-- ParcaBizden — Row Level Security
--
-- Kural: her tabloda RLS açık, politika yoksa erişim yok. PHP'de
-- yetkilendirme her endpoint'in ilk satırlarındaki elle yazılmış
-- kontrollerdeydi; biri unutulduğunda tablo sessizce herkese açılıyordu.
-- Burada tersi: yazmayı unutursan kimse göremez.

alter table profiles             enable row level security;
alter table cities               enable row level security;
alter table districts            enable row level security;
alter table vehicle_manufacturers enable row level security;
alter table vehicle_models       enable row level security;
alter table vehicles             enable row level security;
alter table vehicle_attributes   enable row level security;
alter table sellers              enable row level security;
alter table listings             enable row level security;
alter table listing_images       enable row level security;
alter table requests             enable row level security;
alter table request_items        enable row level security;
alter table request_item_images  enable row level security;
alter table request_dispatches   enable row level security;
alter table offers               enable row level security;
alter table seller_reviews       enable row level security;
alter table garage               enable row level security;
alter table vehicle_maintenance  enable row level security;

-- ── Yardımcılar ───────────────────────────────────────────────

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Oturumdaki kullanıcının onaylı satıcı kaydı. Onaysız satıcı ilan
-- veremez; bu kontrol PHP'de her ilan endpoint'inde tekrar ediyordu.
create function current_seller_id() returns uuid
language sql stable security definer set search_path = public as $$
    select id from sellers where user_id = auth.uid() and status = 'approved';
$$;

-- ── Referans veri: herkese açık okuma, yazma yok ───────────────
-- Katalog ve coğrafya servis rolüyle yükleniyor; servis rolü RLS'i
-- zaten atlıyor, o yüzden yazma politikası bilerek tanımlanmadı.

create policy "herkes okur" on cities                for select using (true);
create policy "herkes okur" on districts             for select using (true);
create policy "herkes okur" on vehicle_manufacturers for select using (true);
create policy "herkes okur" on vehicle_models        for select using (true);
create policy "herkes okur" on vehicles              for select using (true);
create policy "herkes okur" on vehicle_attributes    for select using (true);

-- ── Profil ────────────────────────────────────────────────────

create policy "kendi profilini okur" on profiles
    for select using (id = auth.uid() or is_admin());

create policy "kendi profilini günceller" on profiles
    for update using (id = auth.uid())
    -- is_admin ve account_type'ı kullanıcı kendi değiştiremesin:
    -- biri yönetici olmanın, diğeri onay beklemeden satıcı olmanın yolu.
    with check (
        id = auth.uid()
        and is_admin     = (select p.is_admin     from profiles p where p.id = auth.uid())
        and account_type = (select p.account_type from profiles p where p.id = auth.uid())
    );

-- ── Satıcılar ─────────────────────────────────────────────────

create policy "onaylı mağaza herkese görünür" on sellers
    for select using (status = 'approved' or user_id = auth.uid() or is_admin());

create policy "kendi başvurusunu oluşturur" on sellers
    for insert with check (user_id = auth.uid());

create policy "kendi mağazasını günceller" on sellers
    for update using (user_id = auth.uid())
    -- Statüyü satıcı kendi değiştiremez; onay admin işi.
    with check (
        user_id = auth.uid()
        and status = (select s.status from sellers s where s.user_id = auth.uid())
    );

create policy "admin mağaza yönetir" on sellers
    for update using (is_admin()) with check (is_admin());

-- ── İlanlar ───────────────────────────────────────────────────

create policy "yayındaki ilan herkese açık" on listings
    for select using (
        (status = 'active' and (expires_at is null or expires_at > now()))
        or seller_id = current_seller_id()
        or is_admin()
    );

create policy "satıcı kendi ilanını açar" on listings
    for insert with check (seller_id = current_seller_id());

create policy "satıcı kendi ilanını düzenler" on listings
    for update using (seller_id = current_seller_id())
    with check (seller_id = current_seller_id());

create policy "satıcı kendi ilanını siler" on listings
    for delete using (seller_id = current_seller_id());

create policy "ilan görseli ilanı takip eder" on listing_images
    for select using (exists (select 1 from listings l where l.id = listing_id));

create policy "satıcı kendi ilanının görselini yönetir" on listing_images
    for all using (exists (
        select 1 from listings l
        where l.id = listing_id and l.seller_id = current_seller_id()
    ));

-- ── Talepler ──────────────────────────────────────────────────
--
-- Misafir talebi access_token ile okunur. Token'ı RLS politikasına
-- gömmek mümkün değil (anon rolde kimlik yok), o yüzden okuma aşağıdaki
-- security definer fonksiyondan geçiyor: id tahmin ederek başkasının
-- telefonuna ulaşmak engellensin.

create policy "kendi talebini okur" on requests
    for select using (user_id = auth.uid() or is_admin());

create policy "talep açmak üyelik istemez" on requests
    for insert with check (user_id is null or user_id = auth.uid());

create policy "kendi talebini kapatır" on requests
    for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Satıcı yalnızca kendisine yönlendirilen talebin kalemlerini görür.
create policy "talep kalemi sahibine ve yönlendirilen satıcıya" on request_items
    for select using (
        exists (
            select 1 from requests r
            where r.id = request_id
              and (r.user_id = auth.uid() or is_admin()
                   or exists (select 1 from request_dispatches d
                              where d.request_id = r.id and d.seller_id = current_seller_id()))
        )
    );

create policy "talep kalemi talebiyle eklenir" on request_items
    for insert with check (exists (select 1 from requests r where r.id = request_id));

create policy "kalem görseli kalemi takip eder" on request_item_images
    for select using (exists (select 1 from request_items i where i.id = request_item_id));

create policy "satıcı kendi yönlendirmesini görür" on request_dispatches
    for select using (seller_id = current_seller_id() or is_admin());

create policy "satıcı gördü işaretler" on request_dispatches
    for update using (seller_id = current_seller_id())
    with check (seller_id = current_seller_id());

-- ── Teklifler ─────────────────────────────────────────────────

create policy "teklifi veren satıcı ve talebi açan görür" on offers
    for select using (
        seller_id = current_seller_id()
        or is_admin()
        or exists (
            select 1 from request_items i join requests r on r.id = i.request_id
            where i.id = request_item_id and r.user_id = auth.uid()
        )
    );

-- Satıcı yalnızca kendisine yönlendirilmiş talebe teklif verebilir —
-- yoksa id deneyerek tüm taleplere teklif yağdırılabilir.
create policy "yönlendirilen satıcı teklif verir" on offers
    for insert with check (
        seller_id = current_seller_id()
        and exists (
            select 1 from request_items i
            join request_dispatches d on d.request_id = i.request_id
            where i.id = request_item_id
              and d.seller_id = current_seller_id()
              and i.status = 'open'
        )
    );

create policy "satıcı kendi teklifini geri çeker" on offers
    for update using (seller_id = current_seller_id())
    with check (seller_id = current_seller_id());

create policy "satıcı puanı herkese açık" on seller_reviews
    for select using (true);

create policy "teklifi kabul eden puan verir" on seller_reviews
    for insert with check (
        author_id = auth.uid()
        and exists (
            select 1 from offers o
            join request_items i on i.id = o.request_item_id
            join requests r      on r.id = i.request_id
            where o.id = offer_id and o.status = 'accepted' and r.user_id = auth.uid()
        )
    );

-- ── Garaj ─────────────────────────────────────────────────────

create policy "kendi garajı" on garage
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "kendi bakım kaydı" on vehicle_maintenance
    for all using (exists (
        select 1 from garage g where g.id = garage_id and g.user_id = auth.uid()
    ));

-- ══════════════════════════════════════════════════════════════
--  Misafir talep erişimi
-- ══════════════════════════════════════════════════════════════
--
-- Talep detayı yalnızca access_token ile açılır. Fonksiyon token'ı
-- eşleşmezse boş döner; "bulunamadı" ile "yetkisiz" ayrımı yapılmıyor,
-- yoksa id taramasıyla hangi taleplerin var olduğu öğrenilebilirdi.

create function request_by_token(p_token text)
returns table (
    id uuid, status request_status, vehicle_label text, vin text,
    contact_name text, contact_phone text, created_at timestamptz, expires_at timestamptz
)
language sql stable security definer set search_path = public as $$
    select r.id, r.status, r.vehicle_label, r.vin,
           r.contact_name, r.contact_phone, r.created_at, r.expires_at
    from requests r
    where r.access_token = p_token
      and length(p_token) >= 32;
$$;

revoke all on function request_by_token(text) from public;
grant execute on function request_by_token(text) to anon, authenticated;
