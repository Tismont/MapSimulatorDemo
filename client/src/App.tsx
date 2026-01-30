import { useMemo, useReducer } from 'react'
import './app.css'
import { initialSimState, simReducer } from './store/simulatorStore'
import { useSimWs } from './hooks/websocketHook'
import MapPanel from './components/mapPanel/MapPanel'
import ControlPanel from './components/controlPanel/ControlPanel'
import UnitInfoPanel from './components/unitInfoPanel/UnitInfoPanel'
import LogPanel from './components/logPanel/LogPanel'

export default function App() {
  const [state, dispatch] = useReducer(simReducer, initialSimState)
  const ws = useSimWs(dispatch)

  const selected = useMemo(() => {
    if (!state.selectedEntityId) return null
    return state.entities[state.selectedEntityId] ?? null
  }, [state.entities, state.selectedEntityId])

  if (!state.hasInit) {
    return (
      <div className="loading">
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Loading simulation…
          </div>
          <div style={{ opacity: 0.7 }}>
            WS: {state.connected ? 'connected' : 'connecting…'}
          </div>
          {state.error ? <div className="error">{state.error}</div> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <div className="mapCol">
        <MapPanel
          entities={Object.values(state.entities)}
          selectedId={state.selectedEntityId}
          onSelect={(id) => dispatch({ type: 'selectEntity', id })}
          onMapClick={(point) => {
            if (!state.selectedEntityId) return
            ws.addWaypoint(state.selectedEntityId, point)
          }}
        />
      </div>

      <div className="sideCol">
        <ControlPanel sim={state.sim} ws={ws} />
        <UnitInfoPanel entity={selected} />
        <LogPanel log={state.log} />
      </div>
    </div>
  )
}
