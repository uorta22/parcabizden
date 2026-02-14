import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Shield } from 'lucide-react'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: `Gizlilik Politikası - ${siteConfig.name}`,
  description: `${siteConfig.name} gizlilik politikası. Kişisel verilerinizin korunması ve KVKK uyumu hakkında bilgi edinin.`,
}

export default function GizlilikPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Gizlilik Politikası</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Gizlilik Politikası</h1>
              <p className="text-gray-500 text-sm mt-1">Son güncelleme: Şubat 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Genel Bilgi</h2>
              <p className="text-gray-400 leading-relaxed">
                {siteConfig.name} ({siteConfig.url}) olarak kişisel verilerinizin güvenliği bizim için önemlidir.
                Bu gizlilik politikası, web sitemizi ziyaret ettiğinizde ve hizmetlerimizi kullandığınızda
                hangi bilgilerin toplandığını, nasıl kullanıldığını ve korunduğunu açıklamaktadır.
                6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu olarak hareket etmekteyiz.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. Toplanan Bilgiler</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Hizmetlerimizi sunabilmek için aşağıdaki bilgileri toplayabiliriz:
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span><strong className="text-gray-300">Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası (kayıt sırasında)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span><strong className="text-gray-300">Araç Bilgileri:</strong> Şase numarası, marka, model, yıl (parça arama ve garaj özelliği için)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span><strong className="text-gray-300">Kullanım Verileri:</strong> IP adresi, tarayıcı bilgisi, ziyaret edilen sayfalar, kullanım istatistikleri</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span><strong className="text-gray-300">İletişim Verileri:</strong> WhatsApp ve form üzerinden iletilen mesajlar</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. Bilgilerin Kullanımı</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Toplanan kişisel verileriniz aşağıdaki amaçlarla kullanılmaktadır:
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Parça arama ve sorgulama hizmetlerinin sunulması</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Kullanıcı hesabı oluşturma ve garaj özelliğinin yönetimi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Parça talepleri ve fiyat tekliflerinin iletilmesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Web sitesi performansının iyileştirilmesi ve kullanıcı deneyiminin geliştirilmesi</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Yasal yükümlülüklerin yerine getirilmesi</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Verilerin Korunması</h2>
              <p className="text-gray-400 leading-relaxed">
                Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz.
                Şifreleriniz bcrypt algoritması ile hashlenerek saklanır. Tüm veri iletişimleri SSL/TLS
                şifreleme ile korunmaktadır. Veritabanı erişimleri yetkilendirme mekanizmaları ile
                sınırlandırılmıştır.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Çerezler (Cookies)</h2>
              <p className="text-gray-400 leading-relaxed">
                Web sitemizde oturum yönetimi ve kullanıcı deneyimini iyileştirmek amacıyla çerezler
                kullanılmaktadır. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz, ancak
                bu durumda bazı özellikler düzgün çalışmayabilir. Kullandığımız çerezler yalnızca
                teknik gereklilikler ve oturum yönetimi içindir.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. KVKK Kapsamındaki Haklarınız</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Kişisel verilerinizin işlenip işlenmediğini öğrenme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>İşlenmiş ise buna ilişkin bilgi talep etme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Eksik veya yanlış işlenen kişisel verilerin düzeltilmesini isteme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <span>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</span>
                </li>
              </ul>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. Üçüncü Taraf Hizmetler</h2>
              <p className="text-gray-400 leading-relaxed">
                Şase numarası sorgulama işlemi için NHTSA (National Highway Traffic Safety Administration)
                API hizmeti kullanılmaktadır. Bu hizmet üzerinden yalnızca araç teknik bilgileri sorgulanır,
                kişisel veri paylaşımı yapılmaz. WhatsApp üzerinden yapılan iletişimler Meta Platforms Inc.
                tarafından işlenmektedir ve Meta&apos;nın gizlilik politikasına tabidir.
              </p>
            </section>

            <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. İletişim</h2>
              <p className="text-gray-400 leading-relaxed">
                Gizlilik politikamız ile ilgili sorularınız veya KVKK kapsamındaki talepleriniz için
                bize aşağıdaki kanallardan ulaşabilirsiniz:
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
