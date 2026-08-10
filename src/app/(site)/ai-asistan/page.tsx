import { redirect } from 'next/navigation'

/**
 * AI Asistan — emekliye ayrıldı.
 *
 * Sayfa serbest metin araması yapıyordu ama iki sorunu vardı: giriş duvarının
 * arkasındaydı (yani kimseye hizmet etmiyordu) ve verisini 11 GB'lık eski
 * `parts` tablosundan çekiyordu. O tablo düşürülüyor.
 *
 * Serbest metin araması TecDoc şeması üzerine yeniden kurulacak; o zamana
 * kadar ziyaretçileri çalışan araç seçim akışına gönderiyoruz.
 * Eski uygulama: git show <commit>:src/app/ai-asistan/page.tsx
 */
export default function AiAsistanPage() {
  redirect('/parcalar')
}
