// ═══ Site Configuration - Tek merkezden yönetim ═══

export const siteConfig = {
  name: 'ParcaBizden',
  tagline: 'Yedek & Çıkma Parça Platformu',
  url: 'https://parcabizden.com.tr',
  email: 'info@parcabizden.com',
  description: 'Araç yedek parçası ve çıkma parça ihtiyaçlarınız için doğru adres. Şase numarası ile arama yapın, tüm markalara uygun parçaları bulun.',

  // İletişim
  phone: {
    raw: '+905001234567',
    display: '0500 123 45 67',
    whatsapp: '905001234567',
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

  // İstatistikler
  stats: {
    customers: '5.000+',
    parts: '10.000+',
    brands: '50+',
    support: '7/24',
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
