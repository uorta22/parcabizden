import type { Metadata } from 'next'
import PanelShell from './_components/PanelShell'

/**
 * Satıcı paneli kabuğu — pazaryeri.parcabizden.com.tr
 *
 * Alıcı sitesinden görsel ve yapısal olarak ayrı bir çalışma alanı — kendi
 * gezinmesi (PanelShell) var, alıcı sitesinin Header/Footer'ını kullanmaz.
 * Bu ağaca erişim middleware'de alt alan adına bağlı; yetkilendirme ise
 * PHP tarafında (listing_require_seller) yapılır.
 */
export const metadata: Metadata = {
  title: {
    default: 'Pazaryeri | ParcaBizden',
    template: '%s | ParcaBizden Pazaryeri',
  },
  description: 'ParcaBizden satıcı paneli — mağazanızı, ilanlarınızı ve gelen talepleri yönetin.',
  robots: { index: false, follow: false },
}

export default function PazaryeriLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>
}
