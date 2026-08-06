-- ═══════════════════════════════════════════════════════════════
-- Pazaryeri Coğrafya Seed — Faz 2
-- ═══════════════════════════════════════════════════════════════
-- NE İŞE YARAR:
--   Türkiye'nin 81 ili ve tüm ilçelerini `cities` / `districts`
--   tablolarına doldurur. İlan, satıcı ve talep kayıtlarındaki
--   konum alanları bu tablolara bağlanır.
--
-- KRİTİK: cities.id = PLAKA KODU.
--   Adana=1, Adıyaman=2, ... İstanbul=34, İzmir=35, ... Düzce=81.
--   Uygulama tarafında plaka koduyla doğrudan sorgu atılabilir;
--   bu eşleşme bozulursa mevcut veri anlamsızlaşır.
--
-- SLUG KURALI: Türkçe karakterler ASCII'ye indirgenir, küçük harf,
--   boşluk yerine tire. ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u, â→a.
--   Örnek: Şanlıurfa → sanliurfa, Kahramanmaraş → kahramanmaras.
--   SEO dostu URL'ler (/ilan/istanbul/kadikoy) bu alandan üretilir.
--
-- NASIL ÇALIŞTIRILIR:
--   phpMyAdmin → ilgili veritabanı → SQL sekmesi → bu dosyanın
--   içeriğini yapıştır → Git. (Alternatif: mysql -u ... < dosya)
--
-- ÖNCESİNDE: migration-marketplace-01-core.sql MUTLAKA çalışmış
--   olmalı — cities ve districts tabloları orada yaratılıyor,
--   districts.city_id foreign key ile cities.id'ye bağlı.
--
-- TEKRAR ÇALIŞTIRILABİLİR: INSERT IGNORE kullanıldığı için dosya
--   birden çok kez çalıştırılabilir; mevcut satırlar atlanır.
--   Not: districts.id AUTO_INCREMENT olduğundan atlanan satırlar
--   sayaç boşluğu yaratabilir — zararsız.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── İller (81) ────────────────────────────────────────────────
-- id = plaka kodu
INSERT IGNORE INTO cities (id, name, slug) VALUES
    (1, 'Adana', 'adana'),
    (2, 'Adıyaman', 'adiyaman'),
    (3, 'Afyonkarahisar', 'afyonkarahisar'),
    (4, 'Ağrı', 'agri'),
    (5, 'Amasya', 'amasya'),
    (6, 'Ankara', 'ankara'),
    (7, 'Antalya', 'antalya'),
    (8, 'Artvin', 'artvin'),
    (9, 'Aydın', 'aydin'),
    (10, 'Balıkesir', 'balikesir'),
    (11, 'Bilecik', 'bilecik'),
    (12, 'Bingöl', 'bingol'),
    (13, 'Bitlis', 'bitlis'),
    (14, 'Bolu', 'bolu'),
    (15, 'Burdur', 'burdur'),
    (16, 'Bursa', 'bursa'),
    (17, 'Çanakkale', 'canakkale'),
    (18, 'Çankırı', 'cankiri'),
    (19, 'Çorum', 'corum'),
    (20, 'Denizli', 'denizli'),
    (21, 'Diyarbakır', 'diyarbakir'),
    (22, 'Edirne', 'edirne'),
    (23, 'Elazığ', 'elazig'),
    (24, 'Erzincan', 'erzincan'),
    (25, 'Erzurum', 'erzurum'),
    (26, 'Eskişehir', 'eskisehir'),
    (27, 'Gaziantep', 'gaziantep'),
    (28, 'Giresun', 'giresun'),
    (29, 'Gümüşhane', 'gumushane'),
    (30, 'Hakkâri', 'hakkari'),
    (31, 'Hatay', 'hatay'),
    (32, 'Isparta', 'isparta'),
    (33, 'Mersin', 'mersin'),
    (34, 'İstanbul', 'istanbul'),
    (35, 'İzmir', 'izmir'),
    (36, 'Kars', 'kars'),
    (37, 'Kastamonu', 'kastamonu'),
    (38, 'Kayseri', 'kayseri'),
    (39, 'Kırklareli', 'kirklareli'),
    (40, 'Kırşehir', 'kirsehir'),
    (41, 'Kocaeli', 'kocaeli'),
    (42, 'Konya', 'konya'),
    (43, 'Kütahya', 'kutahya'),
    (44, 'Malatya', 'malatya'),
    (45, 'Manisa', 'manisa'),
    (46, 'Kahramanmaraş', 'kahramanmaras'),
    (47, 'Mardin', 'mardin'),
    (48, 'Muğla', 'mugla'),
    (49, 'Muş', 'mus'),
    (50, 'Nevşehir', 'nevsehir'),
    (51, 'Niğde', 'nigde'),
    (52, 'Ordu', 'ordu'),
    (53, 'Rize', 'rize'),
    (54, 'Sakarya', 'sakarya'),
    (55, 'Samsun', 'samsun'),
    (56, 'Siirt', 'siirt'),
    (57, 'Sinop', 'sinop'),
    (58, 'Sivas', 'sivas'),
    (59, 'Tekirdağ', 'tekirdag'),
    (60, 'Tokat', 'tokat'),
    (61, 'Trabzon', 'trabzon'),
    (62, 'Tunceli', 'tunceli'),
    (63, 'Şanlıurfa', 'sanliurfa'),
    (64, 'Uşak', 'usak'),
    (65, 'Van', 'van'),
    (66, 'Yozgat', 'yozgat'),
    (67, 'Zonguldak', 'zonguldak'),
    (68, 'Aksaray', 'aksaray'),
    (69, 'Bayburt', 'bayburt'),
    (70, 'Karaman', 'karaman'),
    (71, 'Kırıkkale', 'kirikkale'),
    (72, 'Batman', 'batman'),
    (73, 'Şırnak', 'sirnak'),
    (74, 'Bartın', 'bartin'),
    (75, 'Ardahan', 'ardahan'),
    (76, 'Iğdır', 'igdir'),
    (77, 'Yalova', 'yalova'),
    (78, 'Karabük', 'karabuk'),
    (79, 'Kilis', 'kilis'),
    (80, 'Osmaniye', 'osmaniye'),
    (81, 'Düzce', 'duzce');

-- ── İlçeler ───────────────────────────────────────────────────

-- 1 Adana (15)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (1, 'Aladağ', 'aladag'),
    (1, 'Ceyhan', 'ceyhan'),
    (1, 'Çukurova', 'cukurova'),
    (1, 'Feke', 'feke'),
    (1, 'İmamoğlu', 'imamoglu'),
    (1, 'Karaisalı', 'karaisali'),
    (1, 'Karataş', 'karatas'),
    (1, 'Kozan', 'kozan'),
    (1, 'Pozantı', 'pozanti'),
    (1, 'Saimbeyli', 'saimbeyli'),
    (1, 'Sarıçam', 'saricam'),
    (1, 'Seyhan', 'seyhan'),
    (1, 'Tufanbeyli', 'tufanbeyli'),
    (1, 'Yumurtalık', 'yumurtalik'),
    (1, 'Yüreğir', 'yuregir');

-- 2 Adıyaman (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (2, 'Merkez', 'merkez'),
    (2, 'Besni', 'besni'),
    (2, 'Çelikhan', 'celikhan'),
    (2, 'Gerger', 'gerger'),
    (2, 'Gölbaşı', 'golbasi'),
    (2, 'Kâhta', 'kahta'),
    (2, 'Samsat', 'samsat'),
    (2, 'Sincik', 'sincik'),
    (2, 'Tut', 'tut');

-- 3 Afyonkarahisar (18)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (3, 'Merkez', 'merkez'),
    (3, 'Başmakçı', 'basmakci'),
    (3, 'Bayat', 'bayat'),
    (3, 'Bolvadin', 'bolvadin'),
    (3, 'Çay', 'cay'),
    (3, 'Çobanlar', 'cobanlar'),
    (3, 'Dazkırı', 'dazkiri'),
    (3, 'Dinar', 'dinar'),
    (3, 'Emirdağ', 'emirdag'),
    (3, 'Evciler', 'evciler'),
    (3, 'Hocalar', 'hocalar'),
    (3, 'İhsaniye', 'ihsaniye'),
    (3, 'İscehisar', 'iscehisar'),
    (3, 'Kızılören', 'kiziloren'),
    (3, 'Sandıklı', 'sandikli'),
    (3, 'Sinanpaşa', 'sinanpasa'),
    (3, 'Sultandağı', 'sultandagi'),
    (3, 'Şuhut', 'suhut');

-- 4 Ağrı (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (4, 'Merkez', 'merkez'),
    (4, 'Diyadin', 'diyadin'),
    (4, 'Doğubayazıt', 'dogubayazit'),
    (4, 'Eleşkirt', 'eleskirt'),
    (4, 'Hamur', 'hamur'),
    (4, 'Patnos', 'patnos'),
    (4, 'Taşlıçay', 'taslicay'),
    (4, 'Tutak', 'tutak');

-- 5 Amasya (7)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (5, 'Merkez', 'merkez'),
    (5, 'Göynücek', 'goynucek'),
    (5, 'Gümüşhacıköy', 'gumushacikoy'),
    (5, 'Hamamözü', 'hamamozu'),
    (5, 'Merzifon', 'merzifon'),
    (5, 'Suluova', 'suluova'),
    (5, 'Taşova', 'tasova');

-- 6 Ankara (25)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (6, 'Akyurt', 'akyurt'),
    (6, 'Altındağ', 'altindag'),
    (6, 'Ayaş', 'ayas'),
    (6, 'Bala', 'bala'),
    (6, 'Beypazarı', 'beypazari'),
    (6, 'Çamlıdere', 'camlidere'),
    (6, 'Çankaya', 'cankaya'),
    (6, 'Çubuk', 'cubuk'),
    (6, 'Elmadağ', 'elmadag'),
    (6, 'Etimesgut', 'etimesgut'),
    (6, 'Evren', 'evren'),
    (6, 'Gölbaşı', 'golbasi'),
    (6, 'Güdül', 'gudul'),
    (6, 'Haymana', 'haymana'),
    (6, 'Kahramankazan', 'kahramankazan'),
    (6, 'Kalecik', 'kalecik'),
    (6, 'Keçiören', 'kecioren'),
    (6, 'Kızılcahamam', 'kizilcahamam'),
    (6, 'Mamak', 'mamak'),
    (6, 'Nallıhan', 'nallihan'),
    (6, 'Polatlı', 'polatli'),
    (6, 'Pursaklar', 'pursaklar'),
    (6, 'Sincan', 'sincan'),
    (6, 'Şereflikoçhisar', 'sereflikochisar'),
    (6, 'Yenimahalle', 'yenimahalle');

-- 7 Antalya (19)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (7, 'Akseki', 'akseki'),
    (7, 'Aksu', 'aksu'),
    (7, 'Alanya', 'alanya'),
    (7, 'Demre', 'demre'),
    (7, 'Döşemealtı', 'dosemealti'),
    (7, 'Elmalı', 'elmali'),
    (7, 'Finike', 'finike'),
    (7, 'Gazipaşa', 'gazipasa'),
    (7, 'Gündoğmuş', 'gundogmus'),
    (7, 'İbradı', 'ibradi'),
    (7, 'Kaş', 'kas'),
    (7, 'Kemer', 'kemer'),
    (7, 'Kepez', 'kepez'),
    (7, 'Konyaaltı', 'konyaalti'),
    (7, 'Korkuteli', 'korkuteli'),
    (7, 'Kumluca', 'kumluca'),
    (7, 'Manavgat', 'manavgat'),
    (7, 'Muratpaşa', 'muratpasa'),
    (7, 'Serik', 'serik');

-- 8 Artvin (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (8, 'Merkez', 'merkez'),
    (8, 'Ardanuç', 'ardanuc'),
    (8, 'Arhavi', 'arhavi'),
    (8, 'Borçka', 'borcka'),
    (8, 'Hopa', 'hopa'),
    (8, 'Kemalpaşa', 'kemalpasa'),
    (8, 'Murgul', 'murgul'),
    (8, 'Şavşat', 'savsat'),
    (8, 'Yusufeli', 'yusufeli');

-- 9 Aydın (17)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (9, 'Efeler', 'efeler'),
    (9, 'Bozdoğan', 'bozdogan'),
    (9, 'Buharkent', 'buharkent'),
    (9, 'Çine', 'cine'),
    (9, 'Didim', 'didim'),
    (9, 'Germencik', 'germencik'),
    (9, 'İncirliova', 'incirliova'),
    (9, 'Karacasu', 'karacasu'),
    (9, 'Karpuzlu', 'karpuzlu'),
    (9, 'Koçarlı', 'kocarli'),
    (9, 'Köşk', 'kosk'),
    (9, 'Kuşadası', 'kusadasi'),
    (9, 'Kuyucak', 'kuyucak'),
    (9, 'Nazilli', 'nazilli'),
    (9, 'Söke', 'soke'),
    (9, 'Sultanhisar', 'sultanhisar'),
    (9, 'Yenipazar', 'yenipazar');

-- 10 Balıkesir (20)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (10, 'Altıeylül', 'altieylul'),
    (10, 'Ayvalık', 'ayvalik'),
    (10, 'Balya', 'balya'),
    (10, 'Bandırma', 'bandirma'),
    (10, 'Bigadiç', 'bigadic'),
    (10, 'Burhaniye', 'burhaniye'),
    (10, 'Dursunbey', 'dursunbey'),
    (10, 'Edremit', 'edremit'),
    (10, 'Erdek', 'erdek'),
    (10, 'Gömeç', 'gomec'),
    (10, 'Gönen', 'gonen'),
    (10, 'Havran', 'havran'),
    (10, 'İvrindi', 'ivrindi'),
    (10, 'Karesi', 'karesi'),
    (10, 'Kepsut', 'kepsut'),
    (10, 'Manyas', 'manyas'),
    (10, 'Marmara', 'marmara'),
    (10, 'Savaştepe', 'savastepe'),
    (10, 'Sındırgı', 'sindirgi'),
    (10, 'Susurluk', 'susurluk');

-- 11 Bilecik (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (11, 'Merkez', 'merkez'),
    (11, 'Bozüyük', 'bozuyuk'),
    (11, 'Gölpazarı', 'golpazari'),
    (11, 'İnhisar', 'inhisar'),
    (11, 'Osmaneli', 'osmaneli'),
    (11, 'Pazaryeri', 'pazaryeri'),
    (11, 'Söğüt', 'sogut'),
    (11, 'Yenipazar', 'yenipazar');

-- 12 Bingöl (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (12, 'Merkez', 'merkez'),
    (12, 'Adaklı', 'adakli'),
    (12, 'Genç', 'genc'),
    (12, 'Karlıova', 'karliova'),
    (12, 'Kiğı', 'kigi'),
    (12, 'Solhan', 'solhan'),
    (12, 'Yayladere', 'yayladere'),
    (12, 'Yedisu', 'yedisu');

-- 13 Bitlis (7)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (13, 'Merkez', 'merkez'),
    (13, 'Adilcevaz', 'adilcevaz'),
    (13, 'Ahlat', 'ahlat'),
    (13, 'Güroymak', 'guroymak'),
    (13, 'Hizan', 'hizan'),
    (13, 'Mutki', 'mutki'),
    (13, 'Tatvan', 'tatvan');

-- 14 Bolu (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (14, 'Merkez', 'merkez'),
    (14, 'Dörtdivan', 'dortdivan'),
    (14, 'Gerede', 'gerede'),
    (14, 'Göynük', 'goynuk'),
    (14, 'Kıbrıscık', 'kibriscik'),
    (14, 'Mengen', 'mengen'),
    (14, 'Mudurnu', 'mudurnu'),
    (14, 'Seben', 'seben'),
    (14, 'Yeniçağa', 'yenicaga');

-- 15 Burdur (11)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (15, 'Merkez', 'merkez'),
    (15, 'Ağlasun', 'aglasun'),
    (15, 'Altınyayla', 'altinyayla'),
    (15, 'Bucak', 'bucak'),
    (15, 'Çavdır', 'cavdir'),
    (15, 'Çeltikçi', 'celtikci'),
    (15, 'Gölhisar', 'golhisar'),
    (15, 'Karamanlı', 'karamanli'),
    (15, 'Kemer', 'kemer'),
    (15, 'Tefenni', 'tefenni'),
    (15, 'Yeşilova', 'yesilova');

-- 16 Bursa (17)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (16, 'Büyükorhan', 'buyukorhan'),
    (16, 'Gemlik', 'gemlik'),
    (16, 'Gürsu', 'gursu'),
    (16, 'Harmancık', 'harmancik'),
    (16, 'İnegöl', 'inegol'),
    (16, 'İznik', 'iznik'),
    (16, 'Karacabey', 'karacabey'),
    (16, 'Keles', 'keles'),
    (16, 'Kestel', 'kestel'),
    (16, 'Mudanya', 'mudanya'),
    (16, 'Mustafakemalpaşa', 'mustafakemalpasa'),
    (16, 'Nilüfer', 'nilufer'),
    (16, 'Orhaneli', 'orhaneli'),
    (16, 'Orhangazi', 'orhangazi'),
    (16, 'Osmangazi', 'osmangazi'),
    (16, 'Yenişehir', 'yenisehir'),
    (16, 'Yıldırım', 'yildirim');

-- 17 Çanakkale (12)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (17, 'Merkez', 'merkez'),
    (17, 'Ayvacık', 'ayvacik'),
    (17, 'Bayramiç', 'bayramic'),
    (17, 'Biga', 'biga'),
    (17, 'Bozcaada', 'bozcaada'),
    (17, 'Çan', 'can'),
    (17, 'Eceabat', 'eceabat'),
    (17, 'Ezine', 'ezine'),
    (17, 'Gelibolu', 'gelibolu'),
    (17, 'Gökçeada', 'gokceada'),
    (17, 'Lapseki', 'lapseki'),
    (17, 'Yenice', 'yenice');

-- 18 Çankırı (12)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (18, 'Merkez', 'merkez'),
    (18, 'Atkaracalar', 'atkaracalar'),
    (18, 'Bayramören', 'bayramoren'),
    (18, 'Çerkeş', 'cerkes'),
    (18, 'Eldivan', 'eldivan'),
    (18, 'Ilgaz', 'ilgaz'),
    (18, 'Kızılırmak', 'kizilirmak'),
    (18, 'Korgun', 'korgun'),
    (18, 'Kurşunlu', 'kursunlu'),
    (18, 'Orta', 'orta'),
    (18, 'Şabanözü', 'sabanozu'),
    (18, 'Yapraklı', 'yaprakli');

-- 19 Çorum (14)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (19, 'Merkez', 'merkez'),
    (19, 'Alaca', 'alaca'),
    (19, 'Bayat', 'bayat'),
    (19, 'Boğazkale', 'bogazkale'),
    (19, 'Dodurga', 'dodurga'),
    (19, 'İskilip', 'iskilip'),
    (19, 'Kargı', 'kargi'),
    (19, 'Laçin', 'lacin'),
    (19, 'Mecitözü', 'mecitozu'),
    (19, 'Oğuzlar', 'oguzlar'),
    (19, 'Ortaköy', 'ortakoy'),
    (19, 'Osmancık', 'osmancik'),
    (19, 'Sungurlu', 'sungurlu'),
    (19, 'Uğurludağ', 'ugurludag');

-- 20 Denizli (19)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (20, 'Merkezefendi', 'merkezefendi'),
    (20, 'Pamukkale', 'pamukkale'),
    (20, 'Acıpayam', 'acipayam'),
    (20, 'Babadağ', 'babadag'),
    (20, 'Baklan', 'baklan'),
    (20, 'Bekilli', 'bekilli'),
    (20, 'Beyağaç', 'beyagac'),
    (20, 'Bozkurt', 'bozkurt'),
    (20, 'Buldan', 'buldan'),
    (20, 'Çal', 'cal'),
    (20, 'Çameli', 'cameli'),
    (20, 'Çardak', 'cardak'),
    (20, 'Çivril', 'civril'),
    (20, 'Güney', 'guney'),
    (20, 'Honaz', 'honaz'),
    (20, 'Kale', 'kale'),
    (20, 'Sarayköy', 'saraykoy'),
    (20, 'Serinhisar', 'serinhisar'),
    (20, 'Tavas', 'tavas');

-- 21 Diyarbakır (17)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (21, 'Bağlar', 'baglar'),
    (21, 'Bismil', 'bismil'),
    (21, 'Çermik', 'cermik'),
    (21, 'Çınar', 'cinar'),
    (21, 'Çüngüş', 'cungus'),
    (21, 'Dicle', 'dicle'),
    (21, 'Eğil', 'egil'),
    (21, 'Ergani', 'ergani'),
    (21, 'Hani', 'hani'),
    (21, 'Hazro', 'hazro'),
    (21, 'Kayapınar', 'kayapinar'),
    (21, 'Kocaköy', 'kocakoy'),
    (21, 'Kulp', 'kulp'),
    (21, 'Lice', 'lice'),
    (21, 'Silvan', 'silvan'),
    (21, 'Sur', 'sur'),
    (21, 'Yenişehir', 'yenisehir');

-- 22 Edirne (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (22, 'Merkez', 'merkez'),
    (22, 'Enez', 'enez'),
    (22, 'Havsa', 'havsa'),
    (22, 'İpsala', 'ipsala'),
    (22, 'Keşan', 'kesan'),
    (22, 'Lalapaşa', 'lalapasa'),
    (22, 'Meriç', 'meric'),
    (22, 'Süloğlu', 'suloglu'),
    (22, 'Uzunköprü', 'uzunkopru');

-- 23 Elazığ (11)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (23, 'Merkez', 'merkez'),
    (23, 'Ağın', 'agin'),
    (23, 'Alacakaya', 'alacakaya'),
    (23, 'Arıcak', 'aricak'),
    (23, 'Baskil', 'baskil'),
    (23, 'Karakoçan', 'karakocan'),
    (23, 'Keban', 'keban'),
    (23, 'Kovancılar', 'kovancilar'),
    (23, 'Maden', 'maden'),
    (23, 'Palu', 'palu'),
    (23, 'Sivrice', 'sivrice');

-- 24 Erzincan (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (24, 'Merkez', 'merkez'),
    (24, 'Çayırlı', 'cayirli'),
    (24, 'İliç', 'ilic'),
    (24, 'Kemah', 'kemah'),
    (24, 'Kemaliye', 'kemaliye'),
    (24, 'Otlukbeli', 'otlukbeli'),
    (24, 'Refahiye', 'refahiye'),
    (24, 'Tercan', 'tercan'),
    (24, 'Üzümlü', 'uzumlu');

-- 25 Erzurum (20)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (25, 'Aziziye', 'aziziye'),
    (25, 'Palandöken', 'palandoken'),
    (25, 'Yakutiye', 'yakutiye'),
    (25, 'Aşkale', 'askale'),
    (25, 'Çat', 'cat'),
    (25, 'Hınıs', 'hinis'),
    (25, 'Horasan', 'horasan'),
    (25, 'İspir', 'ispir'),
    (25, 'Karaçoban', 'karacoban'),
    (25, 'Karayazı', 'karayazi'),
    (25, 'Köprüköy', 'koprukoy'),
    (25, 'Narman', 'narman'),
    (25, 'Oltu', 'oltu'),
    (25, 'Olur', 'olur'),
    (25, 'Pasinler', 'pasinler'),
    (25, 'Pazaryolu', 'pazaryolu'),
    (25, 'Şenkaya', 'senkaya'),
    (25, 'Tekman', 'tekman'),
    (25, 'Tortum', 'tortum'),
    (25, 'Uzundere', 'uzundere');

-- 26 Eskişehir (14)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (26, 'Odunpazarı', 'odunpazari'),
    (26, 'Tepebaşı', 'tepebasi'),
    (26, 'Alpu', 'alpu'),
    (26, 'Beylikova', 'beylikova'),
    (26, 'Çifteler', 'cifteler'),
    (26, 'Günyüzü', 'gunyuzu'),
    (26, 'Han', 'han'),
    (26, 'İnönü', 'inonu'),
    (26, 'Mahmudiye', 'mahmudiye'),
    (26, 'Mihalgazi', 'mihalgazi'),
    (26, 'Mihalıççık', 'mihaliccik'),
    (26, 'Sarıcakaya', 'saricakaya'),
    (26, 'Seyitgazi', 'seyitgazi'),
    (26, 'Sivrihisar', 'sivrihisar');

-- 27 Gaziantep (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (27, 'Şahinbey', 'sahinbey'),
    (27, 'Şehitkâmil', 'sehitkamil'),
    (27, 'Araban', 'araban'),
    (27, 'İslahiye', 'islahiye'),
    (27, 'Karkamış', 'karkamis'),
    (27, 'Nizip', 'nizip'),
    (27, 'Nurdağı', 'nurdagi'),
    (27, 'Oğuzeli', 'oguzeli'),
    (27, 'Yavuzeli', 'yavuzeli');

-- 28 Giresun (16)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (28, 'Merkez', 'merkez'),
    (28, 'Alucra', 'alucra'),
    (28, 'Bulancak', 'bulancak'),
    (28, 'Çamoluk', 'camoluk'),
    (28, 'Çanakçı', 'canakci'),
    (28, 'Dereli', 'dereli'),
    (28, 'Doğankent', 'dogankent'),
    (28, 'Espiye', 'espiye'),
    (28, 'Eynesil', 'eynesil'),
    (28, 'Görele', 'gorele'),
    (28, 'Güce', 'guce'),
    (28, 'Keşap', 'kesap'),
    (28, 'Piraziz', 'piraziz'),
    (28, 'Şebinkarahisar', 'sebinkarahisar'),
    (28, 'Tirebolu', 'tirebolu'),
    (28, 'Yağlıdere', 'yaglidere');

-- 29 Gümüşhane (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (29, 'Merkez', 'merkez'),
    (29, 'Kelkit', 'kelkit'),
    (29, 'Köse', 'kose'),
    (29, 'Kürtün', 'kurtun'),
    (29, 'Şiran', 'siran'),
    (29, 'Torul', 'torul');

-- 30 Hakkâri (5)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (30, 'Merkez', 'merkez'),
    (30, 'Çukurca', 'cukurca'),
    (30, 'Derecik', 'derecik'),
    (30, 'Şemdinli', 'semdinli'),
    (30, 'Yüksekova', 'yuksekova');

-- 31 Hatay (15)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (31, 'Antakya', 'antakya'),
    (31, 'Defne', 'defne'),
    (31, 'Altınözü', 'altinozu'),
    (31, 'Arsuz', 'arsuz'),
    (31, 'Belen', 'belen'),
    (31, 'Dörtyol', 'dortyol'),
    (31, 'Erzin', 'erzin'),
    (31, 'Hassa', 'hassa'),
    (31, 'İskenderun', 'iskenderun'),
    (31, 'Kırıkhan', 'kirikhan'),
    (31, 'Kumlu', 'kumlu'),
    (31, 'Payas', 'payas'),
    (31, 'Reyhanlı', 'reyhanli'),
    (31, 'Samandağ', 'samandag'),
    (31, 'Yayladağı', 'yayladagi');

-- 32 Isparta (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (32, 'Merkez', 'merkez'),
    (32, 'Aksu', 'aksu'),
    (32, 'Atabey', 'atabey'),
    (32, 'Eğirdir', 'egirdir'),
    (32, 'Gelendost', 'gelendost'),
    (32, 'Gönen', 'gonen'),
    (32, 'Keçiborlu', 'keciborlu'),
    (32, 'Senirkent', 'senirkent'),
    (32, 'Sütçüler', 'sutculer'),
    (32, 'Şarkikaraağaç', 'sarkikaraagac'),
    (32, 'Uluborlu', 'uluborlu'),
    (32, 'Yalvaç', 'yalvac'),
    (32, 'Yenişarbademli', 'yenisarbademli');

-- 33 Mersin (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (33, 'Akdeniz', 'akdeniz'),
    (33, 'Mezitli', 'mezitli'),
    (33, 'Toroslar', 'toroslar'),
    (33, 'Yenişehir', 'yenisehir'),
    (33, 'Anamur', 'anamur'),
    (33, 'Aydıncık', 'aydincik'),
    (33, 'Bozyazı', 'bozyazi'),
    (33, 'Çamlıyayla', 'camliyayla'),
    (33, 'Erdemli', 'erdemli'),
    (33, 'Gülnar', 'gulnar'),
    (33, 'Mut', 'mut'),
    (33, 'Silifke', 'silifke'),
    (33, 'Tarsus', 'tarsus');

-- 34 İstanbul (39)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (34, 'Adalar', 'adalar'),
    (34, 'Arnavutköy', 'arnavutkoy'),
    (34, 'Ataşehir', 'atasehir'),
    (34, 'Avcılar', 'avcilar'),
    (34, 'Bağcılar', 'bagcilar'),
    (34, 'Bahçelievler', 'bahcelievler'),
    (34, 'Bakırköy', 'bakirkoy'),
    (34, 'Başakşehir', 'basaksehir'),
    (34, 'Bayrampaşa', 'bayrampasa'),
    (34, 'Beşiktaş', 'besiktas'),
    (34, 'Beykoz', 'beykoz'),
    (34, 'Beylikdüzü', 'beylikduzu'),
    (34, 'Beyoğlu', 'beyoglu'),
    (34, 'Büyükçekmece', 'buyukcekmece'),
    (34, 'Çatalca', 'catalca'),
    (34, 'Çekmeköy', 'cekmekoy'),
    (34, 'Esenler', 'esenler'),
    (34, 'Esenyurt', 'esenyurt'),
    (34, 'Eyüpsultan', 'eyupsultan'),
    (34, 'Fatih', 'fatih'),
    (34, 'Gaziosmanpaşa', 'gaziosmanpasa'),
    (34, 'Güngören', 'gungoren'),
    (34, 'Kadıköy', 'kadikoy'),
    (34, 'Kağıthane', 'kagithane'),
    (34, 'Kartal', 'kartal'),
    (34, 'Küçükçekmece', 'kucukcekmece'),
    (34, 'Maltepe', 'maltepe'),
    (34, 'Pendik', 'pendik'),
    (34, 'Sancaktepe', 'sancaktepe'),
    (34, 'Sarıyer', 'sariyer'),
    (34, 'Silivri', 'silivri'),
    (34, 'Sultanbeyli', 'sultanbeyli'),
    (34, 'Sultangazi', 'sultangazi'),
    (34, 'Şile', 'sile'),
    (34, 'Şişli', 'sisli'),
    (34, 'Tuzla', 'tuzla'),
    (34, 'Ümraniye', 'umraniye'),
    (34, 'Üsküdar', 'uskudar'),
    (34, 'Zeytinburnu', 'zeytinburnu');

-- 35 İzmir (30)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (35, 'Aliağa', 'aliaga'),
    (35, 'Balçova', 'balcova'),
    (35, 'Bayındır', 'bayindir'),
    (35, 'Bayraklı', 'bayrakli'),
    (35, 'Bergama', 'bergama'),
    (35, 'Beydağ', 'beydag'),
    (35, 'Bornova', 'bornova'),
    (35, 'Buca', 'buca'),
    (35, 'Çeşme', 'cesme'),
    (35, 'Çiğli', 'cigli'),
    (35, 'Dikili', 'dikili'),
    (35, 'Foça', 'foca'),
    (35, 'Gaziemir', 'gaziemir'),
    (35, 'Güzelbahçe', 'guzelbahce'),
    (35, 'Karabağlar', 'karabaglar'),
    (35, 'Karaburun', 'karaburun'),
    (35, 'Karşıyaka', 'karsiyaka'),
    (35, 'Kemalpaşa', 'kemalpasa'),
    (35, 'Kınık', 'kinik'),
    (35, 'Kiraz', 'kiraz'),
    (35, 'Konak', 'konak'),
    (35, 'Menderes', 'menderes'),
    (35, 'Menemen', 'menemen'),
    (35, 'Narlıdere', 'narlidere'),
    (35, 'Ödemiş', 'odemis'),
    (35, 'Seferihisar', 'seferihisar'),
    (35, 'Selçuk', 'selcuk'),
    (35, 'Tire', 'tire'),
    (35, 'Torbalı', 'torbali'),
    (35, 'Urla', 'urla');

-- 36 Kars (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (36, 'Merkez', 'merkez'),
    (36, 'Akyaka', 'akyaka'),
    (36, 'Arpaçay', 'arpacay'),
    (36, 'Digor', 'digor'),
    (36, 'Kağızman', 'kagizman'),
    (36, 'Sarıkamış', 'sarikamis'),
    (36, 'Selim', 'selim'),
    (36, 'Susuz', 'susuz');

-- 37 Kastamonu (20)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (37, 'Merkez', 'merkez'),
    (37, 'Abana', 'abana'),
    (37, 'Ağlı', 'agli'),
    (37, 'Araç', 'arac'),
    (37, 'Azdavay', 'azdavay'),
    (37, 'Bozkurt', 'bozkurt'),
    (37, 'Cide', 'cide'),
    (37, 'Çatalzeytin', 'catalzeytin'),
    (37, 'Daday', 'daday'),
    (37, 'Devrekani', 'devrekani'),
    (37, 'Doğanyurt', 'doganyurt'),
    (37, 'Hanönü', 'hanonu'),
    (37, 'İhsangazi', 'ihsangazi'),
    (37, 'İnebolu', 'inebolu'),
    (37, 'Küre', 'kure'),
    (37, 'Pınarbaşı', 'pinarbasi'),
    (37, 'Seydiler', 'seydiler'),
    (37, 'Şenpazar', 'senpazar'),
    (37, 'Taşköprü', 'taskopru'),
    (37, 'Tosya', 'tosya');

-- 38 Kayseri (16)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (38, 'Kocasinan', 'kocasinan'),
    (38, 'Melikgazi', 'melikgazi'),
    (38, 'Talas', 'talas'),
    (38, 'Akkışla', 'akkisla'),
    (38, 'Bünyan', 'bunyan'),
    (38, 'Develi', 'develi'),
    (38, 'Felahiye', 'felahiye'),
    (38, 'Hacılar', 'hacilar'),
    (38, 'İncesu', 'incesu'),
    (38, 'Özvatan', 'ozvatan'),
    (38, 'Pınarbaşı', 'pinarbasi'),
    (38, 'Sarıoğlan', 'sarioglan'),
    (38, 'Sarız', 'sariz'),
    (38, 'Tomarza', 'tomarza'),
    (38, 'Yahyalı', 'yahyali'),
    (38, 'Yeşilhisar', 'yesilhisar');

-- 39 Kırklareli (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (39, 'Merkez', 'merkez'),
    (39, 'Babaeski', 'babaeski'),
    (39, 'Demirköy', 'demirkoy'),
    (39, 'Kofçaz', 'kofcaz'),
    (39, 'Lüleburgaz', 'luleburgaz'),
    (39, 'Pehlivanköy', 'pehlivankoy'),
    (39, 'Pınarhisar', 'pinarhisar'),
    (39, 'Vize', 'vize');

-- 40 Kırşehir (7)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (40, 'Merkez', 'merkez'),
    (40, 'Akçakent', 'akcakent'),
    (40, 'Akpınar', 'akpinar'),
    (40, 'Boztepe', 'boztepe'),
    (40, 'Çiçekdağı', 'cicekdagi'),
    (40, 'Kaman', 'kaman'),
    (40, 'Mucur', 'mucur');

-- 41 Kocaeli (12)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (41, 'İzmit', 'izmit'),
    (41, 'Başiskele', 'basiskele'),
    (41, 'Çayırova', 'cayirova'),
    (41, 'Darıca', 'darica'),
    (41, 'Derince', 'derince'),
    (41, 'Dilovası', 'dilovasi'),
    (41, 'Gebze', 'gebze'),
    (41, 'Gölcük', 'golcuk'),
    (41, 'Kandıra', 'kandira'),
    (41, 'Karamürsel', 'karamursel'),
    (41, 'Kartepe', 'kartepe'),
    (41, 'Körfez', 'korfez');

-- 42 Konya (31)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (42, 'Karatay', 'karatay'),
    (42, 'Meram', 'meram'),
    (42, 'Selçuklu', 'selcuklu'),
    (42, 'Ahırlı', 'ahirli'),
    (42, 'Akören', 'akoren'),
    (42, 'Akşehir', 'aksehir'),
    (42, 'Altınekin', 'altinekin'),
    (42, 'Beyşehir', 'beysehir'),
    (42, 'Bozkır', 'bozkir'),
    (42, 'Cihanbeyli', 'cihanbeyli'),
    (42, 'Çeltik', 'celtik'),
    (42, 'Çumra', 'cumra'),
    (42, 'Derbent', 'derbent'),
    (42, 'Derebucak', 'derebucak'),
    (42, 'Doğanhisar', 'doganhisar'),
    (42, 'Emirgazi', 'emirgazi'),
    (42, 'Ereğli', 'eregli'),
    (42, 'Güneysınır', 'guneysinir'),
    (42, 'Hadim', 'hadim'),
    (42, 'Halkapınar', 'halkapinar'),
    (42, 'Hüyük', 'huyuk'),
    (42, 'Ilgın', 'ilgin'),
    (42, 'Kadınhanı', 'kadinhani'),
    (42, 'Karapınar', 'karapinar'),
    (42, 'Kulu', 'kulu'),
    (42, 'Sarayönü', 'sarayonu'),
    (42, 'Seydişehir', 'seydisehir'),
    (42, 'Taşkent', 'taskent'),
    (42, 'Tuzlukçu', 'tuzlukcu'),
    (42, 'Yalıhüyük', 'yalihuyuk'),
    (42, 'Yunak', 'yunak');

-- 43 Kütahya (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (43, 'Merkez', 'merkez'),
    (43, 'Altıntaş', 'altintas'),
    (43, 'Aslanapa', 'aslanapa'),
    (43, 'Çavdarhisar', 'cavdarhisar'),
    (43, 'Domaniç', 'domanic'),
    (43, 'Dumlupınar', 'dumlupinar'),
    (43, 'Emet', 'emet'),
    (43, 'Gediz', 'gediz'),
    (43, 'Hisarcık', 'hisarcik'),
    (43, 'Pazarlar', 'pazarlar'),
    (43, 'Simav', 'simav'),
    (43, 'Şaphane', 'saphane'),
    (43, 'Tavşanlı', 'tavsanli');

-- 44 Malatya (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (44, 'Battalgazi', 'battalgazi'),
    (44, 'Yeşilyurt', 'yesilyurt'),
    (44, 'Akçadağ', 'akcadag'),
    (44, 'Arapgir', 'arapgir'),
    (44, 'Arguvan', 'arguvan'),
    (44, 'Darende', 'darende'),
    (44, 'Doğanşehir', 'dogansehir'),
    (44, 'Doğanyol', 'doganyol'),
    (44, 'Hekimhan', 'hekimhan'),
    (44, 'Kale', 'kale'),
    (44, 'Kuluncak', 'kuluncak'),
    (44, 'Pütürge', 'puturge'),
    (44, 'Yazıhan', 'yazihan');

-- 45 Manisa (17)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (45, 'Şehzadeler', 'sehzadeler'),
    (45, 'Yunusemre', 'yunusemre'),
    (45, 'Ahmetli', 'ahmetli'),
    (45, 'Akhisar', 'akhisar'),
    (45, 'Alaşehir', 'alasehir'),
    (45, 'Demirci', 'demirci'),
    (45, 'Gölmarmara', 'golmarmara'),
    (45, 'Gördes', 'gordes'),
    (45, 'Kırkağaç', 'kirkagac'),
    (45, 'Köprübaşı', 'koprubasi'),
    (45, 'Kula', 'kula'),
    (45, 'Salihli', 'salihli'),
    (45, 'Sarıgöl', 'sarigol'),
    (45, 'Saruhanlı', 'saruhanli'),
    (45, 'Selendi', 'selendi'),
    (45, 'Soma', 'soma'),
    (45, 'Turgutlu', 'turgutlu');

-- 46 Kahramanmaraş (11)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (46, 'Dulkadiroğlu', 'dulkadiroglu'),
    (46, 'Onikişubat', 'onikisubat'),
    (46, 'Afşin', 'afsin'),
    (46, 'Andırın', 'andirin'),
    (46, 'Çağlayancerit', 'caglayancerit'),
    (46, 'Ekinözü', 'ekinozu'),
    (46, 'Elbistan', 'elbistan'),
    (46, 'Göksun', 'goksun'),
    (46, 'Nurhak', 'nurhak'),
    (46, 'Pazarcık', 'pazarcik'),
    (46, 'Türkoğlu', 'turkoglu');

-- 47 Mardin (10)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (47, 'Artuklu', 'artuklu'),
    (47, 'Dargeçit', 'dargecit'),
    (47, 'Derik', 'derik'),
    (47, 'Kızıltepe', 'kiziltepe'),
    (47, 'Mazıdağı', 'mazidagi'),
    (47, 'Midyat', 'midyat'),
    (47, 'Nusaybin', 'nusaybin'),
    (47, 'Ömerli', 'omerli'),
    (47, 'Savur', 'savur'),
    (47, 'Yeşilli', 'yesilli');

-- 48 Muğla (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (48, 'Menteşe', 'mentese'),
    (48, 'Bodrum', 'bodrum'),
    (48, 'Dalaman', 'dalaman'),
    (48, 'Datça', 'datca'),
    (48, 'Fethiye', 'fethiye'),
    (48, 'Kavaklıdere', 'kavaklidere'),
    (48, 'Köyceğiz', 'koycegiz'),
    (48, 'Marmaris', 'marmaris'),
    (48, 'Milas', 'milas'),
    (48, 'Ortaca', 'ortaca'),
    (48, 'Seydikemer', 'seydikemer'),
    (48, 'Ula', 'ula'),
    (48, 'Yatağan', 'yatagan');

-- 49 Muş (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (49, 'Merkez', 'merkez'),
    (49, 'Bulanık', 'bulanik'),
    (49, 'Hasköy', 'haskoy'),
    (49, 'Korkut', 'korkut'),
    (49, 'Malazgirt', 'malazgirt'),
    (49, 'Varto', 'varto');

-- 50 Nevşehir (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (50, 'Merkez', 'merkez'),
    (50, 'Acıgöl', 'acigol'),
    (50, 'Avanos', 'avanos'),
    (50, 'Derinkuyu', 'derinkuyu'),
    (50, 'Gülşehir', 'gulsehir'),
    (50, 'Hacıbektaş', 'hacibektas'),
    (50, 'Kozaklı', 'kozakli'),
    (50, 'Ürgüp', 'urgup');

-- 51 Niğde (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (51, 'Merkez', 'merkez'),
    (51, 'Altunhisar', 'altunhisar'),
    (51, 'Bor', 'bor'),
    (51, 'Çamardı', 'camardi'),
    (51, 'Çiftlik', 'ciftlik'),
    (51, 'Ulukışla', 'ulukisla');

-- 52 Ordu (19)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (52, 'Altınordu', 'altinordu'),
    (52, 'Akkuş', 'akkus'),
    (52, 'Aybastı', 'aybasti'),
    (52, 'Çamaş', 'camas'),
    (52, 'Çatalpınar', 'catalpinar'),
    (52, 'Çaybaşı', 'caybasi'),
    (52, 'Fatsa', 'fatsa'),
    (52, 'Gölköy', 'golkoy'),
    (52, 'Gülyalı', 'gulyali'),
    (52, 'Gürgentepe', 'gurgentepe'),
    (52, 'İkizce', 'ikizce'),
    (52, 'Kabadüz', 'kabaduz'),
    (52, 'Kabataş', 'kabatas'),
    (52, 'Korgan', 'korgan'),
    (52, 'Kumru', 'kumru'),
    (52, 'Mesudiye', 'mesudiye'),
    (52, 'Perşembe', 'persembe'),
    (52, 'Ulubey', 'ulubey'),
    (52, 'Ünye', 'unye');

-- 53 Rize (12)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (53, 'Merkez', 'merkez'),
    (53, 'Ardeşen', 'ardesen'),
    (53, 'Çamlıhemşin', 'camlihemsin'),
    (53, 'Çayeli', 'cayeli'),
    (53, 'Derepazarı', 'derepazari'),
    (53, 'Fındıklı', 'findikli'),
    (53, 'Güneysu', 'guneysu'),
    (53, 'Hemşin', 'hemsin'),
    (53, 'İkizdere', 'ikizdere'),
    (53, 'İyidere', 'iyidere'),
    (53, 'Kalkandere', 'kalkandere'),
    (53, 'Pazar', 'pazar');

-- 54 Sakarya (16)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (54, 'Adapazarı', 'adapazari'),
    (54, 'Erenler', 'erenler'),
    (54, 'Serdivan', 'serdivan'),
    (54, 'Akyazı', 'akyazi'),
    (54, 'Arifiye', 'arifiye'),
    (54, 'Ferizli', 'ferizli'),
    (54, 'Geyve', 'geyve'),
    (54, 'Hendek', 'hendek'),
    (54, 'Karapürçek', 'karapurcek'),
    (54, 'Karasu', 'karasu'),
    (54, 'Kaynarca', 'kaynarca'),
    (54, 'Kocaali', 'kocaali'),
    (54, 'Pamukova', 'pamukova'),
    (54, 'Sapanca', 'sapanca'),
    (54, 'Söğütlü', 'sogutlu'),
    (54, 'Taraklı', 'tarakli');

-- 55 Samsun (17)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (55, 'Atakum', 'atakum'),
    (55, 'Canik', 'canik'),
    (55, 'İlkadım', 'ilkadim'),
    (55, 'Tekkeköy', 'tekkekoy'),
    (55, '19 Mayıs', '19-mayis'),
    (55, 'Alaçam', 'alacam'),
    (55, 'Asarcık', 'asarcik'),
    (55, 'Ayvacık', 'ayvacik'),
    (55, 'Bafra', 'bafra'),
    (55, 'Çarşamba', 'carsamba'),
    (55, 'Havza', 'havza'),
    (55, 'Kavak', 'kavak'),
    (55, 'Ladik', 'ladik'),
    (55, 'Salıpazarı', 'salipazari'),
    (55, 'Terme', 'terme'),
    (55, 'Vezirköprü', 'vezirkopru'),
    (55, 'Yakakent', 'yakakent');

-- 56 Siirt (7)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (56, 'Merkez', 'merkez'),
    (56, 'Baykan', 'baykan'),
    (56, 'Eruh', 'eruh'),
    (56, 'Kurtalan', 'kurtalan'),
    (56, 'Pervari', 'pervari'),
    (56, 'Şirvan', 'sirvan'),
    (56, 'Tillo', 'tillo');

-- 57 Sinop (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (57, 'Merkez', 'merkez'),
    (57, 'Ayancık', 'ayancik'),
    (57, 'Boyabat', 'boyabat'),
    (57, 'Dikmen', 'dikmen'),
    (57, 'Durağan', 'duragan'),
    (57, 'Erfelek', 'erfelek'),
    (57, 'Gerze', 'gerze'),
    (57, 'Saraydüzü', 'sarayduzu'),
    (57, 'Türkeli', 'turkeli');

-- 58 Sivas (17)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (58, 'Merkez', 'merkez'),
    (58, 'Akıncılar', 'akincilar'),
    (58, 'Altınyayla', 'altinyayla'),
    (58, 'Divriği', 'divrigi'),
    (58, 'Doğanşar', 'dogansar'),
    (58, 'Gemerek', 'gemerek'),
    (58, 'Gölova', 'golova'),
    (58, 'Gürün', 'gurun'),
    (58, 'Hafik', 'hafik'),
    (58, 'İmranlı', 'imranli'),
    (58, 'Kangal', 'kangal'),
    (58, 'Koyulhisar', 'koyulhisar'),
    (58, 'Suşehri', 'susehri'),
    (58, 'Şarkışla', 'sarkisla'),
    (58, 'Ulaş', 'ulas'),
    (58, 'Yıldızeli', 'yildizeli'),
    (58, 'Zara', 'zara');

-- 59 Tekirdağ (11)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (59, 'Süleymanpaşa', 'suleymanpasa'),
    (59, 'Çerkezköy', 'cerkezkoy'),
    (59, 'Çorlu', 'corlu'),
    (59, 'Ergene', 'ergene'),
    (59, 'Hayrabolu', 'hayrabolu'),
    (59, 'Kapaklı', 'kapakli'),
    (59, 'Malkara', 'malkara'),
    (59, 'Marmaraereğlisi', 'marmaraereglisi'),
    (59, 'Muratlı', 'muratli'),
    (59, 'Saray', 'saray'),
    (59, 'Şarköy', 'sarkoy');

-- 60 Tokat (12)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (60, 'Merkez', 'merkez'),
    (60, 'Almus', 'almus'),
    (60, 'Artova', 'artova'),
    (60, 'Başçiftlik', 'basciftlik'),
    (60, 'Erbaa', 'erbaa'),
    (60, 'Niksar', 'niksar'),
    (60, 'Pazar', 'pazar'),
    (60, 'Reşadiye', 'resadiye'),
    (60, 'Sulusaray', 'sulusaray'),
    (60, 'Turhal', 'turhal'),
    (60, 'Yeşilyurt', 'yesilyurt'),
    (60, 'Zile', 'zile');

-- 61 Trabzon (18)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (61, 'Ortahisar', 'ortahisar'),
    (61, 'Akçaabat', 'akcaabat'),
    (61, 'Araklı', 'arakli'),
    (61, 'Arsin', 'arsin'),
    (61, 'Beşikdüzü', 'besikduzu'),
    (61, 'Çarşıbaşı', 'carsibasi'),
    (61, 'Çaykara', 'caykara'),
    (61, 'Dernekpazarı', 'dernekpazari'),
    (61, 'Düzköy', 'duzkoy'),
    (61, 'Hayrat', 'hayrat'),
    (61, 'Köprübaşı', 'koprubasi'),
    (61, 'Maçka', 'macka'),
    (61, 'Of', 'of'),
    (61, 'Sürmene', 'surmene'),
    (61, 'Şalpazarı', 'salpazari'),
    (61, 'Tonya', 'tonya'),
    (61, 'Vakfıkebir', 'vakfikebir'),
    (61, 'Yomra', 'yomra');

-- 62 Tunceli (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (62, 'Merkez', 'merkez'),
    (62, 'Çemişgezek', 'cemisgezek'),
    (62, 'Hozat', 'hozat'),
    (62, 'Mazgirt', 'mazgirt'),
    (62, 'Nazımiye', 'nazimiye'),
    (62, 'Ovacık', 'ovacik'),
    (62, 'Pertek', 'pertek'),
    (62, 'Pülümür', 'pulumur');

-- 63 Şanlıurfa (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (63, 'Eyyübiye', 'eyyubiye'),
    (63, 'Haliliye', 'haliliye'),
    (63, 'Karaköprü', 'karakopru'),
    (63, 'Akçakale', 'akcakale'),
    (63, 'Birecik', 'birecik'),
    (63, 'Bozova', 'bozova'),
    (63, 'Ceylanpınar', 'ceylanpinar'),
    (63, 'Halfeti', 'halfeti'),
    (63, 'Harran', 'harran'),
    (63, 'Hilvan', 'hilvan'),
    (63, 'Siverek', 'siverek'),
    (63, 'Suruç', 'suruc'),
    (63, 'Viranşehir', 'viransehir');

-- 64 Uşak (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (64, 'Merkez', 'merkez'),
    (64, 'Banaz', 'banaz'),
    (64, 'Eşme', 'esme'),
    (64, 'Karahallı', 'karahalli'),
    (64, 'Sivaslı', 'sivasli'),
    (64, 'Ulubey', 'ulubey');

-- 65 Van (13)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (65, 'İpekyolu', 'ipekyolu'),
    (65, 'Tuşba', 'tusba'),
    (65, 'Edremit', 'edremit'),
    (65, 'Bahçesaray', 'bahcesaray'),
    (65, 'Başkale', 'baskale'),
    (65, 'Çaldıran', 'caldiran'),
    (65, 'Çatak', 'catak'),
    (65, 'Erciş', 'ercis'),
    (65, 'Gevaş', 'gevas'),
    (65, 'Gürpınar', 'gurpinar'),
    (65, 'Muradiye', 'muradiye'),
    (65, 'Özalp', 'ozalp'),
    (65, 'Saray', 'saray');

-- 66 Yozgat (14)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (66, 'Merkez', 'merkez'),
    (66, 'Akdağmadeni', 'akdagmadeni'),
    (66, 'Aydıncık', 'aydincik'),
    (66, 'Boğazlıyan', 'bogazliyan'),
    (66, 'Çandır', 'candir'),
    (66, 'Çayıralan', 'cayiralan'),
    (66, 'Çekerek', 'cekerek'),
    (66, 'Kadışehri', 'kadisehri'),
    (66, 'Saraykent', 'saraykent'),
    (66, 'Sarıkaya', 'sarikaya'),
    (66, 'Sorgun', 'sorgun'),
    (66, 'Şefaatli', 'sefaatli'),
    (66, 'Yenifakılı', 'yenifakili'),
    (66, 'Yerköy', 'yerkoy');

-- 67 Zonguldak (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (67, 'Merkez', 'merkez'),
    (67, 'Alaplı', 'alapli'),
    (67, 'Çaycuma', 'caycuma'),
    (67, 'Devrek', 'devrek'),
    (67, 'Ereğli', 'eregli'),
    (67, 'Gökçebey', 'gokcebey'),
    (67, 'Kilimli', 'kilimli'),
    (67, 'Kozlu', 'kozlu');

-- 68 Aksaray (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (68, 'Merkez', 'merkez'),
    (68, 'Ağaçören', 'agacoren'),
    (68, 'Eskil', 'eskil'),
    (68, 'Gülağaç', 'gulagac'),
    (68, 'Güzelyurt', 'guzelyurt'),
    (68, 'Ortaköy', 'ortakoy'),
    (68, 'Sarıyahşi', 'sariyahsi'),
    (68, 'Sultanhanı', 'sultanhani');

-- 69 Bayburt (3)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (69, 'Merkez', 'merkez'),
    (69, 'Aydıntepe', 'aydintepe'),
    (69, 'Demirözü', 'demirozu');

-- 70 Karaman (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (70, 'Merkez', 'merkez'),
    (70, 'Ayrancı', 'ayranci'),
    (70, 'Başyayla', 'basyayla'),
    (70, 'Ermenek', 'ermenek'),
    (70, 'Kazımkarabekir', 'kazimkarabekir'),
    (70, 'Sarıveliler', 'sariveliler');

-- 71 Kırıkkale (9)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (71, 'Merkez', 'merkez'),
    (71, 'Bahşılı', 'bahsili'),
    (71, 'Balışeyh', 'baliseyh'),
    (71, 'Çelebi', 'celebi'),
    (71, 'Delice', 'delice'),
    (71, 'Karakeçili', 'karakecili'),
    (71, 'Keskin', 'keskin'),
    (71, 'Sulakyurt', 'sulakyurt'),
    (71, 'Yahşihan', 'yahsihan');

-- 72 Batman (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (72, 'Merkez', 'merkez'),
    (72, 'Beşiri', 'besiri'),
    (72, 'Gercüş', 'gercus'),
    (72, 'Hasankeyf', 'hasankeyf'),
    (72, 'Kozluk', 'kozluk'),
    (72, 'Sason', 'sason');

-- 73 Şırnak (7)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (73, 'Merkez', 'merkez'),
    (73, 'Beytüşşebap', 'beytussebap'),
    (73, 'Cizre', 'cizre'),
    (73, 'Güçlükonak', 'guclukonak'),
    (73, 'İdil', 'idil'),
    (73, 'Silopi', 'silopi'),
    (73, 'Uludere', 'uludere');

-- 74 Bartın (4)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (74, 'Merkez', 'merkez'),
    (74, 'Amasra', 'amasra'),
    (74, 'Kurucaşile', 'kurucasile'),
    (74, 'Ulus', 'ulus');

-- 75 Ardahan (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (75, 'Merkez', 'merkez'),
    (75, 'Çıldır', 'cildir'),
    (75, 'Damal', 'damal'),
    (75, 'Göle', 'gole'),
    (75, 'Hanak', 'hanak'),
    (75, 'Posof', 'posof');

-- 76 Iğdır (4)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (76, 'Merkez', 'merkez'),
    (76, 'Aralık', 'aralik'),
    (76, 'Karakoyunlu', 'karakoyunlu'),
    (76, 'Tuzluca', 'tuzluca');

-- 77 Yalova (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (77, 'Merkez', 'merkez'),
    (77, 'Altınova', 'altinova'),
    (77, 'Armutlu', 'armutlu'),
    (77, 'Çınarcık', 'cinarcik'),
    (77, 'Çiftlikköy', 'ciftlikkoy'),
    (77, 'Termal', 'termal');

-- 78 Karabük (6)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (78, 'Merkez', 'merkez'),
    (78, 'Eflani', 'eflani'),
    (78, 'Eskipazar', 'eskipazar'),
    (78, 'Ovacık', 'ovacik'),
    (78, 'Safranbolu', 'safranbolu'),
    (78, 'Yenice', 'yenice');

-- 79 Kilis (4)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (79, 'Merkez', 'merkez'),
    (79, 'Elbeyli', 'elbeyli'),
    (79, 'Musabeyli', 'musabeyli'),
    (79, 'Polateli', 'polateli');

-- 80 Osmaniye (7)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (80, 'Merkez', 'merkez'),
    (80, 'Bahçe', 'bahce'),
    (80, 'Düziçi', 'duzici'),
    (80, 'Hasanbeyli', 'hasanbeyli'),
    (80, 'Kadirli', 'kadirli'),
    (80, 'Sumbas', 'sumbas'),
    (80, 'Toprakkale', 'toprakkale');

-- 81 Düzce (8)
INSERT IGNORE INTO districts (city_id, name, slug) VALUES
    (81, 'Merkez', 'merkez'),
    (81, 'Akçakoca', 'akcakoca'),
    (81, 'Cumayeri', 'cumayeri'),
    (81, 'Çilimli', 'cilimli'),
    (81, 'Gölyaka', 'golyaka'),
    (81, 'Gümüşova', 'gumusova'),
    (81, 'Kaynaşlı', 'kaynasli'),
    (81, 'Yığılca', 'yigilca');

-- Toplam: 81 il, 973 ilçe.
