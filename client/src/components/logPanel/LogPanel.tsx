import type { SimLogRow } from 'client/src/store/simulatorStore'
import './LogPanel.css'

export default function LogPanel({ log }: { log: SimLogRow[] }) {
  return (
    <div className="logList">
      {log.map((row, idx) => (
        <div key={idx} className="logRow">
          [{row.t}] {row.msg}
        </div>
      ))}
    </div>
  )
}
