import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface TabPane {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  tabs: TabPane[]
  defaultActiveId?: string
}

export function Tabs({ tabs, defaultActiveId }: TabsProps) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    const ids = new Set(tabs.map((tab) => tab.id))
    if (defaultActiveId && ids.has(defaultActiveId)) {
      return defaultActiveId
    }
    return tabs[0]?.id ?? null
  })

  useEffect(() => {
    setActiveId((current) => {
      const ids = new Set(tabs.map((tab) => tab.id))
      if (current && ids.has(current)) {
        return current
      }
      if (defaultActiveId && ids.has(defaultActiveId)) {
        return defaultActiveId
      }
      return tabs[0]?.id ?? null
    })
  }, [tabs, defaultActiveId])

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeId), [tabs, activeId])

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="sketch-tabs">
      <div role="tablist" className="sketch-tabs__list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={`sketch-tabs__trigger${isActive ? ' sketch-tabs__trigger--active' : ''}`}
              aria-selected={isActive}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="sketch-tabs__panel" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  )
}
