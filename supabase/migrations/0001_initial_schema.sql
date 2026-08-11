-- ParcaBizden — Supabase/Postgres şeması
--
-- PHP + MySQL'in yerini alıyor. Üç yüzey aynı veritabanını kullanıyor:
--   parcabizden.com.tr           alıcı
--   pazaryeri.parcabizden.com.tr satıcı
--   talep.parcabizden.com.tr     talep
--
-- Yetkilendirme RLS'te. MySQL'de her endpoint'in başında elle yazılan
-- "bu kullanıcı bu satırın sahibi mi" kontrolü vardı; biri unutulduğunda
-- sessizce açık kalıyordu. Burada varsayılan kapalı.
--
-- Auth: Supabase Auth (auth.users). MySQL'deki users tablosu, bcrypt
-- hash'leri ve elle yazılmış JWT kodu taşınmıyor — 3 kullanıcı var,
-- yeniden kaydolmaları taşımaktan ucuz.

-- ══════════════════════════════════════════════════════════════
--  1. Kullanıcı profili
-- ══════════════════════════════════════════════════════════════

create type account_type as enum ('buyer', 'seller');

create table profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    account_type account_type not null default 'buyer',
    full_name    text,
    phone        text,
    is_admin     boolean not null default false,
    created_at   timestamptz not null default now()
);

-- auth.users'a kayıt düşünce profil otomatik açılsın; uygulama kodunun
-- iki adımı da atmasını beklemek, ikincisi patlayınca profilsiz kullanıcı
-- bırakır.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    insert into profiles (id, full_name, phone)
    values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- ══════════════════════════════════════════════════════════════
--  2. Coğrafya
-- ══════════════════════════════════════════════════════════════

create table cities (
    id   smallint primary key,
    name text not null,
    slug text not null unique
);

create table districts (
    id      integer primary key,
    city_id smallint not null references cities(id),
    name    text not null,
    slug    text not null
);
create index districts_city_idx on districts (city_id);

-- ══════════════════════════════════════════════════════════════
--  3. Araç kataloğu  (TecDoc'tan taşınan tek parça)
-- ══════════════════════════════════════════════════════════════
--
-- Parça katalogları taşınmıyor: 8,4M parça ve 82M parça-araç eşleşmesi
-- pazaryerinde hiçbir işe yaramıyordu — arz satıcı ilanlarından geliyor.
-- Araç kimliği kalıyor, çünkü aracı belli olmayan talep ya da ilan
-- işlenemez.
--
-- MySQL'de motor kodu ayrı iki tabloydu (catalog_engines +
-- catalog_vehicle_engines, ~86k satır) ama tek kullanımı kodları
-- birleştirip göstermekti. Diziye indirildi.

create table vehicle_manufacturers (
    id        integer primary key,
    name      text not null,
    matchcode text
);

create table vehicle_models (
    id              integer primary key,
    manufacturer_id integer not null references vehicle_manufacturers(id),
    name            text not null,
    full_name       text,
    year_range      text
);
create index vehicle_models_manufacturer_idx on vehicle_models (manufacturer_id, name);

create table vehicles (
    id           integer primary key,          -- TecDoc KType
    model_id     integer not null references vehicle_models(id),
    description  text,
    full_name    text,
    year_from    smallint,
    year_to      smallint,
    engine_codes text[] not null default '{}'
);
create index vehicles_model_idx on vehicles (model_id, year_from desc);

-- Teknik özellikler. MySQL'de 1,72M satırdı; UI özette yalnızca altı
-- başlık okuyor (motor hacmi, güç, yakıt, motor kodu, şanzıman, gövde).
-- Hangi alt kümenin taşınacağı 0002'de veriyle birlikte belirleniyor.
create table vehicle_attributes (
    vehicle_id      integer not null references vehicles(id) on delete cascade,
    attribute_group text not null,
    display_title   text not null,
    display_value   text,
    primary key (vehicle_id, attribute_group, display_title)
);

-- ══════════════════════════════════════════════════════════════
--  4. Satıcılar
-- ══════════════════════════════════════════════════════════════

create type seller_status as enum ('pending_review', 'approved', 'rejected', 'suspended');

create table sellers (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null unique references auth.users(id) on delete cascade,
    store_name     text not null,
    slug           text not null unique,
    status         seller_status not null default 'pending_review',
    city_id        smallint references cities(id),
    district_id    integer references districts(id),
    phone          text,
    tax_number     text,
    tax_document   text,          -- Storage yolu; herkese açık bucket DEĞİL
    about          text,
    rejected_note  text,
    created_at     timestamptz not null default now(),
    approved_at    timestamptz
);
create index sellers_status_idx on sellers (status, city_id);

-- ══════════════════════════════════════════════════════════════
--  5. İlanlar
-- ══════════════════════════════════════════════════════════════

create type listing_status    as enum ('draft', 'pending_review', 'active', 'paused', 'sold', 'expired', 'rejected');
create type condition_type    as enum ('cikma', 'sifir', 'yenilenmis');
create type shipping_payer    as enum ('buyer', 'seller', 'negotiable');
create type fitment_source    as enum ('seller_declared', 'catalog_verified', 'vin_verified');

create table listings (
    id                uuid primary key default gen_random_uuid(),
    seller_id         uuid not null references sellers(id) on delete cascade,
    title             text not null,
    slug              text not null unique,
    description       text,

    vehicle_id        integer references vehicles(id),
    model_id          integer references vehicle_models(id),
    manufacturer_id   integer references vehicle_manufacturers(id),
    vehicle_label     text,
    year_from         smallint,
    year_to           smallint,

    -- Sabit taksonomi (src/lib/part-categories.ts). MySQL'de TecDoc
    -- kategori tablosuna FK'ydı ve o listeyi süzmek 7,9 GiB'lık tabloyu
    -- okumayı gerektiriyordu.
    category_slug     text,
    part_label        text,
    oem_number        text,
    fitment           fitment_source not null default 'seller_declared',

    condition         condition_type not null,
    quantity          smallint not null default 1,
    price             numeric(10,2),
    price_min         numeric(10,2),
    price_max         numeric(10,2),
    shipping          shipping_payer not null default 'negotiable',

    status            listing_status not null default 'pending_review',
    published_at      timestamptz,
    last_confirmed_at timestamptz,
    expires_at        timestamptz,
    created_at        timestamptz not null default now(),

    -- Kesin fiyat ya da aralık; ikisi de boş ilan aramada sıralanamaz.
    constraint listings_price_present
        check (price is not null or (price_min is not null and price_max is not null))
);
create index listings_browse_idx on listings (status, expires_at, manufacturer_id, model_id, category_slug);
create index listings_seller_idx on listings (seller_id, status);
create index listings_search_idx on listings using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(part_label,'') || ' ' || coalesce(oem_number,'')));

create table listing_images (
    id         uuid primary key default gen_random_uuid(),
    listing_id uuid not null references listings(id) on delete cascade,
    path       text not null,
    sort_order smallint not null default 0
);
create index listing_images_listing_idx on listing_images (listing_id, sort_order);

-- ══════════════════════════════════════════════════════════════
--  6. Talepler
-- ══════════════════════════════════════════════════════════════
--
-- Talep açmak üyelik istemiyor — ürünün bilinçli farkı. Misafir talebi
-- access_token ile okunuyor; o yüzden requests üzerinde anon SELECT
-- politikası YOK, erişim 8. bölümdeki security definer fonksiyondan.

create type request_status      as enum ('open', 'partially_closed', 'closed', 'expired');
create type request_item_status as enum ('open', 'fulfilled', 'cancelled');

create table requests (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid references auth.users(id) on delete set null,  -- misafirde null
    access_token    text not null unique,
    contact_name    text,
    contact_phone   text not null,
    city_id         smallint references cities(id),

    vehicle_id      integer references vehicles(id),
    model_id        integer references vehicle_models(id),
    manufacturer_id integer references vehicle_manufacturers(id),
    vehicle_label   text,
    vin             text,

    status          request_status not null default 'open',
    created_at      timestamptz not null default now(),
    expires_at      timestamptz not null default now() + interval '14 days'
);
create index requests_status_idx on requests (status, expires_at);
create index requests_user_idx   on requests (user_id) where user_id is not null;

create table request_items (
    id            uuid primary key default gen_random_uuid(),
    request_id    uuid not null references requests(id) on delete cascade,
    category_slug text,
    part_label    text not null,
    oem_number    text,
    quantity      smallint not null default 1,
    note          text,
    status        request_item_status not null default 'open'
);
create index request_items_match_idx on request_items (category_slug, status);

create table request_item_images (
    id              uuid primary key default gen_random_uuid(),
    request_item_id uuid not null references request_items(id) on delete cascade,
    path            text not null
);

-- Talebin hangi satıcılara gösterildiği. Herkese yollamak yerine önce
-- eşleşen ilanı olanlara, sonra aynı şehirdekilere.
create table request_dispatches (
    request_id uuid not null references requests(id) on delete cascade,
    seller_id  uuid not null references sellers(id) on delete cascade,
    seen_at    timestamptz,
    created_at timestamptz not null default now(),
    primary key (request_id, seller_id)
);

-- ══════════════════════════════════════════════════════════════
--  7. Teklifler
-- ══════════════════════════════════════════════════════════════

create type offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

create table offers (
    id              uuid primary key default gen_random_uuid(),
    request_item_id uuid not null references request_items(id) on delete cascade,
    seller_id       uuid not null references sellers(id) on delete cascade,
    listing_id      uuid references listings(id) on delete set null,
    price           numeric(10,2) not null,
    condition       condition_type not null,
    note            text,
    status          offer_status not null default 'pending',
    created_at      timestamptz not null default now(),

    -- Bir satıcı aynı talep kalemine ikinci teklif veremesin.
    unique (request_item_id, seller_id)
);
create index offers_seller_idx on offers (seller_id, status);

create table seller_reviews (
    id         uuid primary key default gen_random_uuid(),
    seller_id  uuid not null references sellers(id) on delete cascade,
    offer_id   uuid not null unique references offers(id) on delete cascade,
    author_id  uuid references auth.users(id) on delete set null,
    rating     smallint not null check (rating between 1 and 5),
    comment    text,
    created_at timestamptz not null default now()
);
create index seller_reviews_seller_idx on seller_reviews (seller_id);

-- ══════════════════════════════════════════════════════════════
--  8. Garaj
-- ══════════════════════════════════════════════════════════════

create table garage (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    vehicle_id   integer references vehicles(id),
    label        text,
    plate        text,
    vin          text,
    created_at   timestamptz not null default now()
);
create index garage_user_idx on garage (user_id);

create table vehicle_maintenance (
    id         uuid primary key default gen_random_uuid(),
    garage_id  uuid not null references garage(id) on delete cascade,
    title      text not null,
    done_at    date,
    odometer   integer,
    note       text,
    created_at timestamptz not null default now()
);
create index vehicle_maintenance_garage_idx on vehicle_maintenance (garage_id);
