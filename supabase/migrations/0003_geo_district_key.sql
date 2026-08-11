-- Ilce seed'ini tekrar calistirilabilir yapan dogal anahtar.
--
-- districts.id AUTO_INCREMENT'ten geldigi icin uretilen kimlik; seed
-- dosyasi id vermiyor. Bu yuzden "on conflict (id) do nothing" ise
-- yaramiyordu ve seed her calistirildiginda 973 satir daha ekliyordu —
-- yukleme sirasinda tablo 2.919 satira cikti.
--
-- (city_id, slug) dogal anahtar: ayni ilde ayni slug iki kez olamaz.

delete from districts d
using districts keep
where d.city_id = keep.city_id and d.slug = keep.slug and d.id > keep.id;

alter table districts add constraint districts_city_slug_key unique (city_id, slug);
