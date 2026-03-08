'use client'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    // Yatay kaydırma — mobilde tüm sekmeler görünür
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1 border-b border-gray-200 whitespace-nowrap min-w-max sm:min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className={[
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm transition-all',
                // Alt çizgi göstergesi — aktif/pasif
                isActive
                  ? 'text-primary-600 border-b-2 border-primary-500 font-semibold -mb-px'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent',
              ].join(' ')}
            >
              {tab.label}

              {/* İsteğe bağlı sayı rozeti */}
              {tab.count !== undefined && (
                <span
                  className={[
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
