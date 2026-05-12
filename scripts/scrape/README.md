# ParçaBizden Scraping

İnsan benzeri parça scraping aracı. Playwright tabanlı, resumable, throttled.

## Kurulum

```bash
cd scripts/scrape
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## Kullanım

### İlk çalıştırma

```bash
python parts_scraper.py \
  --site otoparcasan \
  --start-url https://otoparcasan.com/yedek-parca \
  --start-url https://otoparcasan.com/kategori/fren-balatasi \
  --jitter 2,5 \
  --max-depth 4
```

### Kaldığı yerden devam

Crash olursa veya `Ctrl+C` ile durdurursan, state SQLite'a yazılır.

```bash
python parts_scraper.py --site otoparcasan --resume
```

### Çıktılar

```
data/scrape/<site>/
  ├── images/<supplier>/<part_number>/<hash>.jpg
  ├── parts.jsonl         (her satır 1 parça — supabase'e import edilebilir)
  └── state.sqlite        (queue + completed kayıtları)
```

## Davranış

- **Throttle**: her sayfa istek arasında 1.5-4 sn rastgele (varsayılan)
- **Human-like**: mouse hareketi, scroll, dynamic UA
- **Resilient**: 429/5xx → tenacity exponential backoff
- **Resource-aware**: font/media kaynakları otomatik bloklanır
- **Resumable**: WAL modlu SQLite ile crash-safe queue

## Yeni Site Ekleme

`parts_scraper.py` içinde `SiteAdapter` subclass'ı yaz:

```python
class SevenZapAdapter(SiteAdapter):
    name = '7zap'
    def is_listing(self, url): return '/parts/' in url
    def is_detail(self, url):  return '/article/' in url
    async def extract_links(self, page): ...
    async def extract_part(self, page): ...

ADAPTERS['7zap'] = SevenZapAdapter()
```

## Pratik Alternatifler

Bu script ücretsiz ve full-control. Daha hızlı/profesyonel ihtiyaç:

| Servis | Ne için | Maliyet |
|---|---|---|
| **Bright Data** | Anti-bot + proxy + CAPTCHA bypass | $$$ pay-as-you-go |
| **Apify** | Hazır otoparça scraper Actor'ları | $0.40/1000 sayfa |
| **Crawlee** (Node.js) | Bu script'in daha gelişmiş versiyonu, built-in queue | Free, self-host |
| **selectolax + httpx** | Tarayıcı gerekmeyen sayfalar için 10x hızlı | Free |

Bu script otoparçacılar için yeterli; CAPTCHA/Cloudflare çok zorlamaya başlarsa Bright Data + Crawlee kombo'ya geçilir.

## Import Adımı (Sonraki)

`parts.jsonl` dosyası Supabase'e direkt import edilebilir:

```python
# scripts/scrape/import_to_supabase.py (henüz yazılmadı)
# Her satırı oku → catalog_parts tablosuna upsert et
```

Bu script bir sonraki turda yazılır.
