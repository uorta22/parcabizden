#!/usr/bin/env python3
"""
ParçaBizden — İnsan benzeri parça scraping script.

Hedef: hedef sitenin (otoparcasan / 7zap / autodoc vb.) ürün
listeleme ve detay sayfalarından parça verisi + görsellerini
toplayıp lokalde organize bir klasör yapısında saklamak.

Yaklaşım:
  • Playwright async (Chromium) — gerçek tarayıcı, JS rendering
  • Human-like davranış: rastgele bekleme, fare hareketi, scroll
  • Resumable: state SQLite'a yazılır, çökerse kaldığı yerden devam
  • Resilient: 429 / 5xx → exponential backoff + retry
  • Throttled: hedef site başına eş zamanlı 1 sayfa, request başına
    1.5-4 saniye rastgele bekleme

Klasör çıktısı:
    data/scrape/
      ├── <site>/
      │   ├── images/<supplier>/<part_number>/<filename>.jpg
      │   ├── parts.jsonl      (her satır 1 parça: oem, supplier, name, urls, etc.)
      │   └── state.sqlite     (queue + completed table'ları)

KURULUM:
    pip install playwright httpx tenacity pydantic loguru
    playwright install chromium

KULLANIM:
    python parts_scraper.py --site otoparcasan --start-url https://otoparcasan.com/yedek-parca
    python parts_scraper.py --resume   # son state'ten devam
    python parts_scraper.py --site 7zap --workers 1 --jitter 2,5

PRATİK ALTERNATİFLER (gelecekte):
  - Bright Data / ScraperAPI: managed proxy + CAPTCHA çözümü ($)
  - Apify Actor: hazır SaaS scraper'lar, run-as-a-service
  - Crawlee (Node.js): Playwright + scheduling + storage built-in
  - selectolax + httpx: Headless tarayıcı GEREK YOKsa 10x daha hızlı

Bu script ücretsiz + tam kontrol. SaaS'a geçiş istediğinde Bright Data
+ Crawlee kombinasyonu en pratiği.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import random
import re
import signal
import sqlite3
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import urljoin, urlparse

# Third-party (pip install)
try:
    import httpx
    from playwright.async_api import async_playwright, Browser, BrowserContext, Page, TimeoutError as PWTimeout
    from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
    from loguru import logger
except ImportError as e:
    sys.exit(f"Eksik bağımlılık: {e}\nKur: pip install playwright httpx tenacity loguru && playwright install chromium")


# ─────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────
DATA_ROOT = Path(__file__).parent.parent.parent / 'data' / 'scrape'
USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
]


# ─────────────────────────────────────────────────────────
# Veri modeli
# ─────────────────────────────────────────────────────────
@dataclass
class PartRecord:
    site: str
    url: str
    part_number: str
    supplier: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    image_paths: list[str] = None    # type: ignore
    compatible_vehicles: list[str] = None  # type: ignore

    def __post_init__(self):
        if self.image_paths is None: self.image_paths = []
        if self.compatible_vehicles is None: self.compatible_vehicles = []


# ─────────────────────────────────────────────────────────
# State store (resumable)
# ─────────────────────────────────────────────────────────
class StateStore:
    """SQLite tabanlı queue + completed kayıtları. Crash-safe."""

    def __init__(self, site_dir: Path):
        self.db_path = site_dir / 'state.sqlite'
        site_dir.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute('PRAGMA journal_mode=WAL')
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS queue (
                url        TEXT PRIMARY KEY,
                kind       TEXT NOT NULL,        -- 'list' veya 'detail'
                depth      INTEGER NOT NULL DEFAULT 0,
                discovered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS completed (
                url        TEXT PRIMARY KEY,
                kind       TEXT NOT NULL,
                done_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                error      TEXT
            )
        ''')
        self.conn.commit()

    def enqueue(self, url: str, kind: str, depth: int = 0) -> bool:
        try:
            cur = self.conn.execute(
                'SELECT 1 FROM completed WHERE url = ? UNION SELECT 1 FROM queue WHERE url = ?',
                (url, url),
            )
            if cur.fetchone():
                return False
            self.conn.execute(
                'INSERT OR IGNORE INTO queue (url, kind, depth) VALUES (?, ?, ?)',
                (url, kind, depth),
            )
            self.conn.commit()
            return True
        except Exception as e:
            logger.warning('enqueue error: {}', e)
            return False

    def next_job(self) -> Optional[tuple[str, str, int]]:
        cur = self.conn.execute('SELECT url, kind, depth FROM queue ORDER BY discovered LIMIT 1')
        row = cur.fetchone()
        return row

    def mark_done(self, url: str, kind: str, error: Optional[str] = None) -> None:
        self.conn.execute('DELETE FROM queue WHERE url = ?', (url,))
        self.conn.execute(
            'INSERT OR REPLACE INTO completed (url, kind, error) VALUES (?, ?, ?)',
            (url, kind, error),
        )
        self.conn.commit()

    def stats(self) -> dict:
        q = self.conn.execute('SELECT kind, COUNT(*) FROM queue GROUP BY kind').fetchall()
        d = self.conn.execute('SELECT kind, COUNT(*) FROM completed GROUP BY kind').fetchall()
        return {
            'pending':   {k: c for k, c in q},
            'completed': {k: c for k, c in d},
        }


# ─────────────────────────────────────────────────────────
# Human-like davranış katmanı
# ─────────────────────────────────────────────────────────
async def humanize_navigate(page: Page, url: str, jitter: tuple[float, float] = (1.5, 4.0)) -> None:
    """Bir gerçek kullanıcı gibi: rastgele bekleme + scroll + mouse hareketi."""
    await asyncio.sleep(random.uniform(*jitter))
    try:
        await page.goto(url, wait_until='domcontentloaded', timeout=45_000)
    except PWTimeout:
        logger.warning('Timeout: {}', url)
        return

    # Scroll boyunca 2-3 yerden geç
    height = await page.evaluate('document.body.scrollHeight')
    for _ in range(random.randint(2, 4)):
        y = random.randint(100, max(200, height - 200))
        await page.mouse.wheel(0, random.randint(200, 800))
        await asyncio.sleep(random.uniform(0.4, 1.2))

    # Rastgele fare hareketi
    await page.mouse.move(random.randint(100, 800), random.randint(100, 600))
    await asyncio.sleep(random.uniform(0.3, 1.0))


# ─────────────────────────────────────────────────────────
# Görsel indirme
# ─────────────────────────────────────────────────────────
@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=20),
       retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)))
async def download_image(client: httpx.AsyncClient, url: str, dst: Path) -> Optional[Path]:
    if dst.exists() and dst.stat().st_size > 0:
        return dst    # zaten var, atla
    dst.parent.mkdir(parents=True, exist_ok=True)
    r = await client.get(url, timeout=30, follow_redirects=True)
    r.raise_for_status()
    dst.write_bytes(r.content)
    return dst


# ─────────────────────────────────────────────────────────
# Site adapter'ları — her hedef site için ekstraksiyon kuralları
# ─────────────────────────────────────────────────────────
class SiteAdapter:
    """Bir sitenin URL şeması + DOM seçicileri."""
    name: str = 'generic'

    def is_listing(self, url: str) -> bool:
        raise NotImplementedError

    def is_detail(self, url: str) -> bool:
        raise NotImplementedError

    async def extract_links(self, page: Page) -> list[tuple[str, str]]:
        """[(url, kind), ...] — bu sayfada bulunan diğer hedef URL'leri döndür."""
        raise NotImplementedError

    async def extract_part(self, page: Page) -> Optional[PartRecord]:
        """Bir detay sayfasından PartRecord çıkar."""
        raise NotImplementedError


class OtoparcasanAdapter(SiteAdapter):
    name = 'otoparcasan'

    def is_listing(self, url: str) -> bool:
        p = urlparse(url).path
        return '/kategori/' in p or '/marka/' in p or '/yedek-parca' in p

    def is_detail(self, url: str) -> bool:
        return '/urun/' in urlparse(url).path

    async def extract_links(self, page: Page) -> list[tuple[str, str]]:
        result: list[tuple[str, str]] = []
        anchors = await page.eval_on_selector_all(
            'a[href]', 'els => els.map(e => e.href).filter(Boolean)'
        )
        for href in anchors:
            if '/urun/' in href:
                result.append((href, 'detail'))
            elif '/kategori/' in href or '/marka/' in href:
                result.append((href, 'list'))
        return result

    async def extract_part(self, page: Page) -> Optional[PartRecord]:
        url = page.url
        try:
            name = await page.text_content('h1') or ''
            part_number = ''
            supplier = ''
            # Özellikler tablosunu tara
            rows = await page.query_selector_all('table tr, dl > div, .product-spec li')
            for row in rows:
                txt = (await row.text_content() or '').lower()
                if 'stok kodu' in txt or 'ürün kodu' in txt or 'oem' in txt:
                    part_number = (await row.text_content() or '').split(':')[-1].strip()
                if 'marka' in txt and not supplier:
                    supplier = (await row.text_content() or '').split(':')[-1].strip()
            if not part_number:
                return None

            images = await page.eval_on_selector_all(
                '.product-images img, .gallery img, img[itemprop="image"]',
                'els => els.map(e => e.src).filter(Boolean)',
            )
            price = await page.text_content('.price, [itemprop="price"]')

            return PartRecord(
                site=self.name, url=url,
                part_number=part_number, supplier=supplier or None,
                name=name.strip() or None, price=price or None,
                image_paths=[],   # downloader doldurur
            )
        except Exception as e:
            logger.warning('extract_part hata: {} — {}', url, e)
            return None


# Sözlük: kayıtlı adapter'lar
ADAPTERS: dict[str, SiteAdapter] = {
    'otoparcasan': OtoparcasanAdapter(),
    # 7zap, autodoc vs. eklenebilir — her biri kendi seçicileriyle
}


# ─────────────────────────────────────────────────────────
# Çekirdek worker
# ─────────────────────────────────────────────────────────
class Scraper:
    def __init__(self, adapter: SiteAdapter, *, jitter: tuple[float, float] = (1.5, 4.0),
                 max_depth: int = 5):
        self.adapter = adapter
        self.jitter = jitter
        self.max_depth = max_depth
        self.site_dir = DATA_ROOT / adapter.name
        self.images_dir = self.site_dir / 'images'
        self.parts_file = self.site_dir / 'parts.jsonl'
        self.site_dir.mkdir(parents=True, exist_ok=True)
        self.state = StateStore(self.site_dir)
        self._stop = False

        # Ctrl-C kibarca dursun
        signal.signal(signal.SIGINT, lambda *_: setattr(self, '_stop', True))

    async def run(self, seeds: Iterable[str] = ()) -> None:
        # Seed URL'leri kuyruğa koy
        for u in seeds:
            self.state.enqueue(u, 'list')

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            ctx = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                locale='tr-TR',
                viewport={'width': 1366, 'height': 800},
            )
            # Network optimization — gereksiz kaynakları engelle
            await ctx.route('**/*', lambda route: route.abort()
                            if route.request.resource_type in ('font', 'media', 'manifest')
                            else route.continue_())
            page = await ctx.new_page()

            async with httpx.AsyncClient(headers={'User-Agent': random.choice(USER_AGENTS)}) as client:
                while not self._stop:
                    job = self.state.next_job()
                    if not job:
                        logger.info('Kuyruk boş. Bitti.')
                        break
                    url, kind, depth = job
                    if depth > self.max_depth:
                        self.state.mark_done(url, kind, error='depth_exceeded')
                        continue

                    try:
                        await self._process(page, client, url, kind, depth)
                        self.state.mark_done(url, kind)
                    except Exception as e:
                        logger.error('İş başarısız: {} — {}', url, e)
                        self.state.mark_done(url, kind, error=str(e))

                    if int(asyncio.get_event_loop().time()) % 30 == 0:
                        logger.info('İstatistik: {}', self.state.stats())

            await ctx.close()
            await browser.close()

    async def _process(self, page: Page, client: httpx.AsyncClient,
                       url: str, kind: str, depth: int) -> None:
        await humanize_navigate(page, url, self.jitter)

        if kind == 'list' or self.adapter.is_listing(url):
            links = await self.adapter.extract_links(page)
            for link_url, link_kind in links:
                if depth + 1 <= self.max_depth:
                    self.state.enqueue(link_url, link_kind, depth + 1)
            logger.info('Listeden {} link eklendi: {}', len(links), url)
            return

        # detail
        if self.adapter.is_detail(url):
            rec = await self.adapter.extract_part(page)
            if not rec:
                logger.debug('Parça verisi bulunamadı: {}', url)
                return

            # Görselleri indir
            images_on_page = await page.eval_on_selector_all(
                '.product-images img, .gallery img, img[itemprop="image"]',
                'els => els.map(e => e.src).filter(Boolean)',
            ) if rec.part_number else []
            sup = rec.supplier or 'unknown'
            for i, img_url in enumerate(images_on_page[:6]):
                ext = Path(urlparse(img_url).path).suffix or '.jpg'
                name = hashlib.md5(img_url.encode()).hexdigest()[:12] + ext
                dst = self.images_dir / _safe(sup) / _safe(rec.part_number) / name
                try:
                    saved = await download_image(client, img_url, dst)
                    if saved:
                        rec.image_paths.append(str(saved.relative_to(DATA_ROOT)))
                except Exception as e:
                    logger.warning('Görsel indirilemedi {} — {}', img_url, e)

            # JSONL'a ekle
            with self.parts_file.open('a', encoding='utf-8') as f:
                f.write(json.dumps(asdict(rec), ensure_ascii=False) + '\n')
            logger.success('Kaydedildi: {} ({} görsel)', rec.part_number, len(rec.image_paths))


def _safe(s: str) -> str:
    return re.sub(r'[^A-Za-z0-9._-]+', '_', s.strip()) or 'unknown'


# ─────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────
def main() -> None:
    ap = argparse.ArgumentParser(description='ParçaBizden human-like scraper')
    ap.add_argument('--site', default='otoparcasan', choices=list(ADAPTERS.keys()),
                    help='Hedef site adapter\'ı')
    ap.add_argument('--start-url', action='append', default=[],
                    help='Seed URL (birden fazla --start-url verebilirsin)')
    ap.add_argument('--resume', action='store_true',
                    help='Mevcut state.sqlite üzerinden devam — seed gerekmiyor')
    ap.add_argument('--jitter', default='1.5,4',
                    help='Min,Max saniye rastgele bekleme (örn. 2,6)')
    ap.add_argument('--max-depth', type=int, default=5)
    args = ap.parse_args()

    adapter = ADAPTERS[args.site]
    jmin, jmax = (float(x) for x in args.jitter.split(','))
    scraper = Scraper(adapter, jitter=(jmin, jmax), max_depth=args.max_depth)

    seeds = args.start_url if not args.resume else []
    if not seeds and not args.resume:
        sys.exit('--start-url ya da --resume gerekli')

    logger.info('Başlıyor: site={}, seeds={}', args.site, len(seeds))
    asyncio.run(scraper.run(seeds))


if __name__ == '__main__':
    main()
