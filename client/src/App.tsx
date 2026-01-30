import { useMemo, useReducer, useState } from 'react'
import './app.css'
import { initialSimState, simReducer } from './store/simulatorStore'
import { useSimWs } from './hooks/websocketHook'
import MapPanel from './components/mapPanel/MapPanel'
import ControlPanel from './components/controlPanel/ControlPanel'
import UnitInfoPanel from './components/unitInfoPanel/UnitInfoPanel'
import LogPanel from './components/logPanel/LogPanel'
import { Group, Panel, Separator } from 'react-resizable-panels'
import CollapsiblePanel from './components/collapsiblePanel/CollapsiblePanel'

export default function App() {
  const [state, dispatch] = useReducer(simReducer, initialSimState)
  const ws = useSimWs(dispatch)

  const [cControl, setCControl] = useState(false)
  const [cUnit, setCUnit] = useState(false)
  const [cLog, setCLog] = useState(false)

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
      <Group orientation="horizontal" className="split">
        <Panel defaultSize="70%" minSize="40%">
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
        </Panel>

        <Separator className="resizeHandle" />

        <Panel defaultSize={300} minSize={240}>
          <div className="sideCol">
            <CollapsiblePanel
              title="Simulation state"
              collapsed={cControl}
              onToggle={() => setCControl((v) => !v)}
            >
              <ControlPanel sim={state.sim} ws={ws} />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Unit info"
              collapsed={cUnit}
              onToggle={() => setCUnit((v) => !v)}
            >
              <UnitInfoPanel entity={selected} />
            </CollapsiblePanel>

            <CollapsiblePanel
              title="Log"
              collapsed={cLog}
              onToggle={() => setCLog((v) => !v)}
              fill
            >
              <LogPanel log={state.log} />
            </CollapsiblePanel>
          </div>
        </Panel>
      </Group>
    </div>
  )
}
