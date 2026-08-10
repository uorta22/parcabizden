import type { Metadata } from 'next'

/**
 * Talep yüzeyi kabuğu — talep.parcabizden.com.tr
 *
 * Profesyonel kullanıcının parça talebi açtığı alan. Üyelik istemez;
 * alıcı sitesinden ve satıcı panelinden ayrı bir yüzeydir.
 */
export const metadata: Metadata = {
  title: {
    default: 'Yedek Parça Talebi | ParcaBizden',
    template: '%s | ParcaBizden Talep',
  },
  description: 'Aradığınız yedek parçayı tarif edin, doğrulanmış satıcılardan teklif alın. Üyelik gerekmez.',
}

export default function TalepLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
