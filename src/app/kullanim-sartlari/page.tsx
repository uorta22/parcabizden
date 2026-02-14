import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `Kullanım Şartları - ${siteConfig.name}`,
  description: `${siteConfig.name} kullanım şartları ve koşulları. Sitemizi kullanmadan önce lütfen okuyun.`,
}

export default function KullanimSartlariPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Kullanım Şartları</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Kullanım Şartları</h1>
              <p className="text-gray-500 text-sm mt-1">Son güncelleme: Şubat 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Kabul</h2>
              <p className="text-gray-400 leading-relaxed">
                {siteConfig.url} web sitesini (&quot;Site&quot;) kullanarak bu kullanım şartlarını kabul etmiş
                sayılırsınız. Bu şartları kabul etmiyorsanız siteyi kullanmayınız. {siteConfig.name},
                bu şartları önceden bildirimde bulunmaksızın değiştirme hakkını saklı tutar.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. Hizmet Tanımı</h2>
              <p className="text-gray-400 leading-relaxed">
                {siteConfig.name}, araç yedek parçası ve çıkma parça arama, sorgulama ve talep oluşturma
                hizmeti sunan bir platformdur. Kullanıcılar şase numarası ile araç sorgulama yapabilir,
                parça kategorilerini inceleyebilir ve WhatsApp üzerinden parça talepleri oluşturabilir.
                Platform, parça satış garantisi vermez; talep ve tedarik arasında aracılık hizmeti sunar.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. Kullanıcı Hesapları</h2>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Hesap oluşturmak için geçerli bir e-posta adresi ve güçlü bir şifre gerekmektedir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayın.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Garaj özelliği, araç bilgilerinizi kaydetmenize olanak tanır. Bu bilgiler yalnızca parça arama kolaylığı için kullanılır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>{siteConfig.name}, uygunsuz kullanım durumunda hesabınızı askıya alma veya silme hakkını saklı tutar.</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Kabul Edilebilir Kullanım</h2>
              <p className="text-gray-400 leading-relaxed mb-4">Siteyi kullanırken aşağıdaki kurallara uymanız gerekmektedir:</p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Siteyi yasa dışı amaçlarla kullanmak yasaktır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Otomatik veri toplama (scraping, bot) araçları kullanmak yasaktır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Site altyapısına zarar verecek eylemler yasaktır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Sahte veya yanıltıcı bilgiler ile hesap oluşturmak yasaktır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>Diğer kullanıcıların site kullanımını engelleyecek davranışlar yasaktır.</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Parça Bilgileri ve Sorumluluk</h2>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Sitede listelenen parça bilgileri referans amaçlıdır. Stok durumu ve fiyatlar değişkenlik gösterebilir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Şase numarası ile yapılan sorgulama sonuçları NHTSA veritabanına dayanmaktadır. Sonuçların doğruluğu garanti edilmez.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Parça uyumluluğu konusunda nihai karar, araç sahibi ve/veya teknisyen tarafından verilmelidir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Yanlış parça seçiminden doğabilecek zararlardan {siteConfig.name} sorumlu tutulamaz.</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Fikri Mülkiyet</h2>
              <p className="text-gray-400 leading-relaxed">
                Site üzerindeki tüm içerik, tasarım, logo, grafik ve yazılım {siteConfig.name}&apos;e aittir
                veya lisans altında kullanılmaktadır. İzinsiz kopyalama, çoğaltma veya dağıtım yasaktır.
                Kullanıcılar, site üzerindeki içerikleri yalnızca kişisel, ticari olmayan amaçlarla
                görüntüleyebilir.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. Sorumluluk Sınırlaması</h2>
              <p className="text-gray-400 leading-relaxed">
                {siteConfig.name}, sitenin kesintisiz veya hatasız çalışacağını garanti etmez.
                Teknik sorunlar, bakım çalışmaları veya üçüncü taraf hizmetlerindeki aksaklıklardan
                dolayı yaşanabilecek erişim problemlerinden sorumlu tutulamaz. Site &quot;olduğu gibi&quot;
                sunulmaktadır ve zımni garantiler dahil olmak üzere her türlü garanti reddedilir.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. Uygulanacak Hukuk</h2>
              <p className="text-gray-400 leading-relaxed">
                Bu kullanım şartları Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlık halinde
                İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">9. İletişim</h2>
              <p className="text-gray-400 leading-relaxed">
                Bu kullanım şartları ile ilgili sorularınız için:
              </p>
              <div className="mt-4 space-y-2 text-gray-400">
                <p>E-posta: <a href={`mailto:${siteConfig.email}`} className="text-primary-500 hover:underline">{siteConfig.email}</a></p>
                <p>Telefon: <a href={`tel:${siteConfig.phone.raw}`} className="text-primary-500 hover:underline">{siteConfig.phone.display}</a></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
