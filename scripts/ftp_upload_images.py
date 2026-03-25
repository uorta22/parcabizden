r"""
TecDoc Görsel FTP Upload Script (Windows)

HTTP yerine FTP ile doğrudan sunucuya toplu görsel transferi.
Çok daha hızlı — internet hızının tamamını kullanır.

Kullanım:
    py ftp_upload_images.py                    # Tüm klasörleri yükle
    py ftp_upload_images.py --start 113        # 113. klasörden başla
    py ftp_upload_images.py --threads 4        # 4 paralel bağlantı
    py ftp_upload_images.py --status           # İlerleme durumu

Gereksinimler:
    Python 3.10+ (ek paket gerekmiyor, ftplib built-in)
"""

import argparse
import ftplib
import json
import logging
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# ─── Konfigürasyon ───────────────────────────────────────────────
FTP_HOST = "ftp.umastudio.com.tr"
FTP_USER = "deployer@parcabizden.com.tr"
FTP_PASS = "sv9VI0i_.k5@9-XV"
FTP_PORT = 21

# Sunucudaki hedef dizin (FTP root'a göre)
# Natro'da genelde FTP root = site klasörü
# api.parcabizden.com.tr altındaki uploads/parts/ klasörü
REMOTE_BASE = "/uploads/parts"

IMAGE_DIR = Path(r"E:\TecDoc\images")
PROGRESS_FILE = Path(r"E:\TecDoc\ftp_progress.json")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tif", ".tiff"}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(r"E:\TecDoc\ftp_upload.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def load_progress() -> dict:
    """Son kaldığımız yeri yükle."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"last_folder": 0, "total_uploaded": 0, "total_skipped": 0, "total_errors": 0}


def save_progress(progress: dict) -> None:
    """İlerlemeyi kaydet."""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)


def create_ftp_connection() -> ftplib.FTP:
    """Yeni FTP bağlantısı oluştur."""
    ftp = ftplib.FTP()
    ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    return ftp


def ensure_remote_dir(ftp: ftplib.FTP, remote_path: str) -> None:
    """Uzak dizini oluştur (yoksa)."""
    dirs = remote_path.strip("/").split("/")
    current = ""
    for d in dirs:
        current += f"/{d}"
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
            except ftplib.error_perm:
                pass  # Zaten var olabilir


def list_remote_files(ftp: ftplib.FTP, remote_dir: str) -> set[str]:
    """Uzak dizindeki dosya listesini al."""
    try:
        ftp.cwd(remote_dir)
        return set(ftp.nlst())
    except ftplib.error_perm:
        return set()


def upload_folder(folder_num: int, image_dir: Path, remote_base: str) -> tuple[int, int, int]:
    """Tek klasörü FTP ile yükle. Thread-safe."""
    folder_path = image_dir / str(folder_num)

    if not folder_path.exists() or not folder_path.is_dir():
        return 0, 0, 0

    # Klasördeki görselleri topla
    images = [
        f for f in folder_path.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    ]

    if not images:
        return 0, 0, 0

    uploaded = 0
    skipped = 0
    errors = 0

    remote_dir = f"{remote_base}/{folder_num}"

    try:
        ftp = create_ftp_connection()

        # Uzak klasörü oluştur
        ensure_remote_dir(ftp, remote_dir)
        ftp.cwd(remote_dir)

        # Mevcut dosyaları kontrol et
        existing = set()
        try:
            existing = set(ftp.nlst())
        except ftplib.error_perm:
            pass

        for img in images:
            if img.name in existing:
                skipped += 1
                continue

            try:
                with open(img, "rb") as f:
                    ftp.storbinary(f"STOR {img.name}", f)
                uploaded += 1
            except Exception as e:
                logger.warning("  Hata: %s/%s — %s", folder_num, img.name, e)
                errors += 1

        ftp.quit()

    except Exception as e:
        logger.error("  Klasör %d FTP hatası: %s", folder_num, e)
        errors += len(images) - uploaded - skipped

    return uploaded, skipped, errors


def run_upload(
    start_folder: int = 1,
    end_folder: int = 4999,
    threads: int = 3,
    image_dir: Path = IMAGE_DIR,
    remote_base: str = REMOTE_BASE,
) -> None:
    """Ana upload döngüsü."""
    progress = load_progress()

    effective_start = max(start_folder, progress["last_folder"] + 1)
    if effective_start > start_folder:
        logger.info("Kaldığımız yerden devam: klasör %d", effective_start)

    total_uploaded = progress["total_uploaded"]
    total_skipped = progress["total_skipped"]
    total_errors = progress["total_errors"]

    # Önce hangi klasörlerin dolu olduğunu bul
    folders_to_process = []
    for folder_num in range(effective_start, end_folder + 1):
        folder_path = image_dir / str(folder_num)
        if folder_path.exists() and folder_path.is_dir():
            # En az bir görsel dosyası var mı kontrol et
            has_images = any(
                f.suffix.lower() in IMAGE_EXTENSIONS
                for f in folder_path.iterdir()
                if f.is_file()
            )
            if has_images:
                folders_to_process.append(folder_num)

    total_folders = len(folders_to_process)
    logger.info("İşlenecek klasör sayısı: %d (paralel: %d thread)", total_folders, threads)

    start_time = time.time()
    processed = 0

    if threads == 1:
        # Tek thread — sıralı işlem
        for folder_num in folders_to_process:
            up, skip, err = upload_folder(folder_num, image_dir, remote_base)
            total_uploaded += up
            total_skipped += skip
            total_errors += err
            processed += 1

            elapsed = time.time() - start_time
            rate = processed / elapsed if elapsed > 0 else 0
            eta = (total_folders - processed) / rate if rate > 0 else 0

            logger.info(
                "[%d/%d] Klasör %d — yüklendi: %d, atlandı: %d, hata: %d — ETA: %d:%02d",
                processed, total_folders, folder_num,
                up, skip, err,
                int(eta // 60), int(eta % 60),
            )

            # İlerlemeyi kaydet
            progress = {
                "last_folder": folder_num,
                "total_uploaded": total_uploaded,
                "total_skipped": total_skipped,
                "total_errors": total_errors,
            }
            save_progress(progress)
    else:
        # Paralel upload
        with ThreadPoolExecutor(max_workers=threads) as executor:
            future_to_folder = {}
            batch_size = threads * 2  # İleri tamponlama

            folder_iter = iter(folders_to_process)
            active_futures: dict = {}

            # İlk batch'i başlat
            for _ in range(min(batch_size, total_folders)):
                try:
                    fn = next(folder_iter)
                    future = executor.submit(upload_folder, fn, image_dir, remote_base)
                    active_futures[future] = fn
                except StopIteration:
                    break

            while active_futures:
                for future in as_completed(active_futures):
                    folder_num = active_futures.pop(future)

                    try:
                        up, skip, err = future.result()
                    except Exception as e:
                        logger.error("Klasör %d beklenmeyen hata: %s", folder_num, e)
                        up, skip, err = 0, 0, 1

                    total_uploaded += up
                    total_skipped += skip
                    total_errors += err
                    processed += 1

                    elapsed = time.time() - start_time
                    rate = processed / elapsed if elapsed > 0 else 0
                    eta = (total_folders - processed) / rate if rate > 0 else 0

                    if up > 0 or err > 0:
                        logger.info(
                            "[%d/%d] Klasör %d — yüklendi: %d, atlandı: %d, hata: %d — ETA: %d:%02d",
                            processed, total_folders, folder_num,
                            up, skip, err,
                            int(eta // 60), int(eta % 60),
                        )

                    # İlerlemeyi kaydet
                    progress = {
                        "last_folder": folder_num,
                        "total_uploaded": total_uploaded,
                        "total_skipped": total_skipped,
                        "total_errors": total_errors,
                    }
                    save_progress(progress)

                    # Yeni klasör ekle
                    try:
                        fn = next(folder_iter)
                        new_future = executor.submit(upload_folder, fn, image_dir, remote_base)
                        active_futures[new_future] = fn
                    except StopIteration:
                        pass

                    break  # as_completed'den sadece birini al, döngüye devam

    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info("TAMAMLANDI!")
    logger.info("  Toplam yüklenen: %d", total_uploaded)
    logger.info("  Toplam atlanan: %d", total_skipped)
    logger.info("  Toplam hata: %d", total_errors)
    logger.info("  Süre: %d dakika %d saniye", int(elapsed // 60), int(elapsed % 60))


def check_connection() -> None:
    """FTP bağlantısını test et ve dizin yapısını göster."""
    logger.info("FTP bağlantısı test ediliyor...")
    try:
        ftp = create_ftp_connection()
        logger.info("Bağlantı başarılı!")
        logger.info("Sunucu: %s", ftp.getwelcome())

        # Kök dizini listele
        logger.info("Kök dizin içeriği:")
        items = ftp.nlst()
        for item in items[:20]:
            logger.info("  %s", item)
        if len(items) > 20:
            logger.info("  ... ve %d daha", len(items) - 20)

        # uploads/parts var mı kontrol et
        try:
            ftp.cwd(REMOTE_BASE)
            logger.info("Hedef dizin mevcut: %s", REMOTE_BASE)
            sub_items = ftp.nlst()
            logger.info("  İçerik: %d öğe", len(sub_items))
        except ftplib.error_perm:
            logger.info("Hedef dizin henüz yok: %s (otomatik oluşturulacak)", REMOTE_BASE)

        ftp.quit()
    except Exception as e:
        logger.error("FTP bağlantı hatası: %s", e)
        logger.error("Lütfen FTP bilgilerini kontrol edin.")


def main() -> None:
    parser = argparse.ArgumentParser(description="TecDoc görsel FTP upload")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç klasör numarası")
    parser.add_argument("--end", type=int, default=4999, help="Bitiş klasör numarası")
    parser.add_argument("--threads", type=int, default=3, help="Paralel FTP bağlantı sayısı (varsayılan: 3)")
    parser.add_argument("--test", action="store_true", help="FTP bağlantısını test et")
    parser.add_argument("--status", action="store_true", help="İlerleme durumunu göster")
    parser.add_argument("--reset", action="store_true", help="İlerlemeyi sıfırla")
    parser.add_argument("--remote-base", type=str, default=REMOTE_BASE, help="Sunucudaki hedef dizin")
    parser.add_argument("--image-dir", type=str, default=str(IMAGE_DIR), help="Görsel dizini")

    args = parser.parse_args()

    if args.reset:
        if PROGRESS_FILE.exists():
            PROGRESS_FILE.unlink()
        logger.info("İlerleme sıfırlandı")
        return

    if args.status:
        progress = load_progress()
        logger.info("FTP Upload Durumu:")
        logger.info("  Son klasör: %d", progress["last_folder"])
        logger.info("  Toplam yüklenen: %d", progress["total_uploaded"])
        logger.info("  Toplam atlanan: %d", progress["total_skipped"])
        logger.info("  Toplam hata: %d", progress["total_errors"])
        return

    if args.test:
        check_connection()
        return

    image_dir = Path(args.image_dir)
    if not image_dir.exists():
        logger.error("Görsel dizini bulunamadı: %s", image_dir)
        sys.exit(1)

    run_upload(args.start, args.end, args.threads, image_dir, args.remote_base)


if __name__ == "__main__":
    main()
