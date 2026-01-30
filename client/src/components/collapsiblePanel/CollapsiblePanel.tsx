import type { ReactNode } from 'react'
import './CollapsiblePanel.css'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function CollapsiblePanel({
  title,
  collapsed,
  onToggle,
  children,
  fill,
}: {
  title: string
  collapsed: boolean
  onToggle(): void
  children: ReactNode
  fill?: boolean
}) {
  return (
    <div
      className={`panel cpanel ${fill ? 'cpanelFill' : ''} ${collapsed ? 'isCollapsed' : ''}`}
    >
      <div className="cpanelHeader">
        <div className="panelTitle cpanelTitle">{title}</div>

        <button
          className="cpanelToggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand panel' : 'Minimize panel'}
          title={collapsed ? 'Expand' : 'Minimize'}
          type="button"
        >
          {collapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!collapsed && <div className="cpanelBody">{children}</div>}
    </div>
  )
}
