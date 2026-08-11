// ═══ Site Configuration - Tek merkezden yönetim ═══

export const siteConfig = {
  name: 'ParcaBizden',
  tagline: 'Yedek & Çıkma Parça Platformu',
  url: 'https://parcabizden.com.tr',
  email: 'info@parcabizden.com',

  // Ayrı origin'lerde çalışan iki yüzey. Tek kod tabanı, ayrı alan adı:
  // oturumlar (localStorage) origin başına izole kalsın diye tam URL gerekiyor,
  // Link ile iç yönlendirme yapılamaz.
  surfaces: {
    seller: 'https://pazaryeri.parcabizden.com.tr',
    request: 'https://talep.parcabizden.com.tr',
  },

  description: 'Araç yedek parçası ve çıkma parça ihtiyaçlarınız için doğru adres. Şase numarası ile arama yapın, tüm markalara uygun parçaları bulun.',

  // İletişim
  phone: {
    raw: '+905449819144',
    display: '0544 981 91 44',
    whatsapp: '905449819144',
  },

  // WhatsApp
  whatsapp: {
    defaultMessage: 'Merhaba, yedek parça hakkında bilgi almak istiyorum.',
    partRequestMessage: 'Merhaba, bir parça arıyorum. Yardımcı olur musunuz?',
    notFoundMessage: 'Merhaba, bir parça arıyorum ama bulamadım. Yardımcı olur musunuz?',
  },

  // Adres
  address: {
    city: 'İstanbul',
    country: 'Türkiye',
    full: 'İstanbul, Türkiye',
  },

  // Çalışma saatleri
  workingHours: {
    weekdays: 'Pazartesi - Cumartesi: 09:00 - 19:00',
    weekend: 'Pazar: Kapalı',
    whatsappNote: 'WhatsApp üzerinden 7/24 mesaj bırakabilirsiniz.',
  },

  // Chat widget
  chat: {
    enabled: process.env.NEXT_PUBLIC_CHAT_ENABLED !== 'false',
    workingHoursStart: 9,
    workingHoursEnd: 19,
    workingDays: [1, 2, 3, 4, 5, 6] as readonly number[], // Mon-Sat
  },

  // Sosyal medya
  social: {
    instagram: '',
    facebook: '',
    twitter: '',
  },
} as const

// WhatsApp link oluşturucu
export function getWhatsAppUrl(message?: string): string {
  const msg = message || siteConfig.whatsapp.defaultMessage
  return `https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(msg)}`
}

// Telefon link
export function getPhoneUrl(): string {
  return `tel:${siteConfig.phone.raw}`
}

// Email link
export function getEmailUrl(): string {
  return `mailto:${siteConfig.email}`
}
