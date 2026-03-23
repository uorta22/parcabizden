r"""
TecDoc Parca Gorseli Batch Upload Script (Windows)

Bu script Windows makinesindeki E:\TecDoc\images\ klasorundeki gorselleri
PHP backend'e batch halinde yukler.

Kullanim:
    python upload_tecdoc_images.py --url https://parcabizden.com.tr/php-backend/image-import.php
    python upload_tecdoc_images.py --url https://parcabizden.com.tr/php-backend/image-import.php --start 100
    python upload_tecdoc_images.py --url https://parcabizden.com.tr/php-backend/image-import.php --csv

Gereksinimler:
    pip install requests
"""

import argparse
import csv
import json
import logging
import sys
import time
from pathlib import Path

import requests

# ─── Konfigürasyon ───────────────────────────────────────────────
SECRET_KEY = "parcabizden_img_2024_secret"
BATCH_SIZE = 30          # Tek seferde yüklenecek dosya sayısı
MAX_RETRIES = 3          # Hata durumunda tekrar deneme
RETRY_DELAY = 5          # Tekrar deneme arası bekleme (sn)
IMAGE_DIR = Path(r"E:\TecDoc\images")
CSV_PATH = Path(r"E:\TecDoc\article_images.csv")
PROGRESS_FILE = Path(r"E:\TecDoc\upload_progress.json")

# Desteklenen görsel uzantıları
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tif", ".tiff"}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(r"E:\TecDoc\upload.log"), encoding="utf-8"),
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


def load_csv_metadata(csv_path: Path) -> dict[str, dict]:
    """
    article_images.csv dosyasını oku ve picture_name bazlı index oluştur.
    CSV formatı: supplierId, DataSupplierArticleNumber, PictureName, DocumentType
    """
    metadata: dict[str, dict] = {}
    if not csv_path.exists():
        logger.warning("CSV dosyası bulunamadı: %s — metadata olmadan devam ediliyor", csv_path)
        return metadata

    logger.info("CSV dosyası okunuyor: %s", csv_path)
    count = 0
    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 3:
                continue
            supplier_id = row[0].strip()
            part_number = row[1].strip()
            picture_name = row[2].strip()
            doc_type = row[3].strip() if len(row) > 3 else "Picture"

            # Aynı resim birden fazla parçada olabilir, ilkini al
            if picture_name and picture_name not in metadata:
                metadata[picture_name] = {
                    "supplier_id": int(supplier_id) if supplier_id.isdigit() else 0,
                    "part_number": part_number,
                    "doc_type": doc_type,
                }
                count += 1

    logger.info("CSV'den %d benzersiz görsel metadata'sı yüklendi", count)
    return metadata


def upload_batch(
    url: str,
    folder: str,
    files: list[Path],
    metadata_index: dict[str, dict],
) -> dict:
    """Bir batch görsel dosyasını PHP endpoint'e yükle."""
    file_handles = []
    meta_list = []

    try:
        for file_path in files:
            fh = open(file_path, "rb")
            file_handles.append(("images[]", (file_path.name, fh, "image/jpeg")))

            # CSV'den metadata bul
            meta = metadata_index.get(file_path.name, {
                "supplier_id": 0,
                "part_number": "",
                "doc_type": "Picture",
            })
            meta_list.append(meta)

        data = {
            "secret": SECRET_KEY,
            "action": "upload_batch",
            "folder": folder,
            "metadata": json.dumps(meta_list),
        }

        response = requests.post(url, data=data, files=file_handles, timeout=120)
        response.raise_for_status()
        return response.json()

    finally:
        for _, (_, fh, _) in file_handles:
            fh.close()


def migrate_csv_batch(url: str, rows: list[dict]) -> dict:
    """CSV metadata'sını batch olarak PHP endpoint'e gönder."""
    response = requests.post(
        url,
        params={"action": "migrate_csv", "secret": SECRET_KEY},
        json=rows,
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def get_status(url: str) -> dict:
    """Import durumunu sorgula."""
    response = requests.get(
        url,
        params={"action": "import_status", "secret": SECRET_KEY},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def run_image_upload(
    url: str,
    start_folder: int = 1,
    end_folder: int = 4999,
    image_dir: Path = IMAGE_DIR,
    csv_path: Path = CSV_PATH,
    batch_size: int = BATCH_SIZE,
) -> None:
    """Ana upload döngüsü — klasörleri dolaşıp batch yükle."""
    progress = load_progress()

    # Kaldığımız yerden devam et
    effective_start = max(start_folder, progress["last_folder"] + 1)
    if effective_start > start_folder:
        logger.info("Kaldığımız yerden devam: klasör %d", effective_start)

    # CSV metadata yükle
    metadata_index = load_csv_metadata(csv_path)

    total_uploaded = progress["total_uploaded"]
    total_skipped = progress["total_skipped"]
    total_errors = progress["total_errors"]

    for folder_num in range(effective_start, end_folder + 1):
        folder_path = image_dir / str(folder_num)

        if not folder_path.exists() or not folder_path.is_dir():
            continue

        # Klasördeki görselleri topla
        images = [
            f for f in folder_path.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
        ]

        if not images:
            continue

        logger.info(
            "Klasör %d/%d — %d görsel bulundu",
            folder_num, end_folder, len(images),
        )

        # Batch'lere böl
        for batch_start in range(0, len(images), batch_size):
            batch = images[batch_start:batch_start + batch_size]
            batch_num = batch_start // batch_size + 1
            total_batches = (len(images) + batch_size - 1) // batch_size

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    result = upload_batch(url, str(folder_num), batch, metadata_index)

                    uploaded = result.get("uploaded", 0)
                    skipped = result.get("skipped", 0)
                    errors = result.get("errors", [])

                    total_uploaded += uploaded
                    total_skipped += skipped
                    total_errors += len(errors)

                    logger.info(
                        "  Batch %d/%d — yüklendi: %d, atlandı: %d, hata: %d",
                        batch_num, total_batches, uploaded, skipped, len(errors),
                    )

                    if errors:
                        for err in errors:
                            logger.warning("    %s", err)

                    break  # Başarılı, retry döngüsünden çık

                except requests.RequestException as e:
                    logger.error(
                        "  Batch %d/%d — HATA (deneme %d/%d): %s",
                        batch_num, total_batches, attempt, MAX_RETRIES, e,
                    )
                    if attempt < MAX_RETRIES:
                        time.sleep(RETRY_DELAY * attempt)
                    else:
                        total_errors += len(batch)
                        logger.error("  Batch atlanıyor (max deneme aşıldı)")

        # Klasör tamamlandı, ilerlemeyi kaydet
        progress = {
            "last_folder": folder_num,
            "total_uploaded": total_uploaded,
            "total_skipped": total_skipped,
            "total_errors": total_errors,
        }
        save_progress(progress)

    logger.info("=" * 60)
    logger.info("TAMAMLANDI!")
    logger.info("  Toplam yüklenen: %d", total_uploaded)
    logger.info("  Toplam atlanan: %d", total_skipped)
    logger.info("  Toplam hata: %d", total_errors)


def run_csv_migrate(url: str, csv_path: Path) -> None:
    """CSV metadata'sını dosyasız olarak DB'ye aktar (sadece metadata)."""
    if not csv_path.exists():
        logger.error("CSV dosyası bulunamadı: %s", csv_path)
        return

    logger.info("CSV metadata aktarımı başlıyor: %s", csv_path)

    batch: list[dict] = []
    total_inserted = 0
    total_skipped = 0
    row_count = 0

    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 3:
                continue

            batch.append({
                "supplier_id": int(row[0].strip()) if row[0].strip().isdigit() else 0,
                "part_number": row[1].strip(),
                "picture_name": row[2].strip(),
                "doc_type": row[3].strip() if len(row) > 3 else "Picture",
            })
            row_count += 1

            if len(batch) >= 1000:
                try:
                    result = migrate_csv_batch(url, batch)
                    total_inserted += result.get("inserted", 0)
                    total_skipped += result.get("skipped", 0)
                    logger.info(
                        "  %d satır işlendi — eklenen: %d, atlanan: %d",
                        row_count, total_inserted, total_skipped,
                    )
                except requests.RequestException as e:
                    logger.error("  Batch hatası: %s", e)
                batch = []

    # Kalan batch
    if batch:
        try:
            result = migrate_csv_batch(url, batch)
            total_inserted += result.get("inserted", 0)
            total_skipped += result.get("skipped", 0)
        except requests.RequestException as e:
            logger.error("  Son batch hatası: %s", e)

    logger.info("CSV aktarım tamamlandı: %d eklendi, %d atlandı (toplam %d satır)", total_inserted, total_skipped, row_count)


def main() -> None:
    parser = argparse.ArgumentParser(description="TecDoc parça görseli batch upload")
    parser.add_argument("--url", required=True, help="PHP endpoint URL'i")
    parser.add_argument("--start", type=int, default=1, help="Başlangıç klasör numarası (varsayılan: 1)")
    parser.add_argument("--end", type=int, default=4999, help="Bitiş klasör numarası (varsayılan: 4999)")
    parser.add_argument("--csv", action="store_true", help="Sadece CSV metadata aktarımı yap (görsel yüklemeden)")
    parser.add_argument("--csv-path", type=str, default=str(CSV_PATH), help="CSV dosya yolu")
    parser.add_argument("--status", action="store_true", help="Import durumunu göster")
    parser.add_argument("--reset", action="store_true", help="İlerleme dosyasını sıfırla")
    parser.add_argument("--link", action="store_true", help="Görselleri products tablosuna bağla")
    parser.add_argument("--image-dir", type=str, default=str(IMAGE_DIR), help="Görsel dizini (varsayılan: E:\\TecDoc\\images)")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Batch büyüklüğü (varsayılan: 30)")

    args = parser.parse_args()

    image_dir = Path(args.image_dir)
    csv_path = Path(args.csv_path)
    batch_size = args.batch_size

    if args.reset:
        if PROGRESS_FILE.exists():
            PROGRESS_FILE.unlink()
        logger.info("İlerleme sıfırlandı")
        return

    if args.status:
        result = get_status(args.url)
        logger.info("Import Durumu:")
        logger.info("  Toplam kayıt: %d", result.get("total_records", 0))
        logger.info("  Yüklenen: %d", result.get("uploaded_files", 0))
        logger.info("  Bekleyen: %d", result.get("pending", 0))
        logger.info("  Disk kullanımı: %s", result.get("disk_usage", "?"))
        return

    if args.link:
        response = requests.get(
            args.url,
            params={"action": "link_to_parts", "secret": SECRET_KEY},
            timeout=120,
        )
        result = response.json()
        logger.info("Görseller products tablosuna bağlandı: %d ürün güncellendi", result.get("products_updated", 0))
        return

    if args.csv:
        run_csv_migrate(args.url, csv_path)
    else:
        run_image_upload(args.url, args.start, args.end, image_dir, csv_path, batch_size)


if __name__ == "__main__":
    main()
