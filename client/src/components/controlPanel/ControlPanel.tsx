import type { SimState } from '@shared/simulator'
import './ControlPanel.css'

export default function ControlPanel({
  sim,
  ws,
}: {
  sim: SimState | null
  ws: { play(): void; pause(): void; stop(): void; step(): void }
}) {
  return (
    <>
      <div className="controlButtons">
        <button onClick={ws.play}>▶︎</button>
        <button onClick={ws.pause}>⏸</button>
        <button onClick={ws.step}>⏭</button>
        <button onClick={ws.stop}>⏹</button>
      </div>

      <div className="controlMeta">
        Status: <b>{sim?.status ?? '-'}</b>
      </div>
      <div className="controlMeta">
        Time: <b>{String(sim?.timeSec ?? 0)}s</b>
      </div>
    </>
  )
}
