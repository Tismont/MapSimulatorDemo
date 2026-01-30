import type { Entity } from '@shared/simulator'

export default function UnitInfoPanel({ entity }: { entity: Entity | null }) {
  return (
    <div className="panel">
      <div className="panelTitle">Unit info</div>

      {!entity ? (
        <div style={{ opacity: 0.7 }}>Select a unit on the map.</div>
      ) : (
        <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
          <div>
            Type: <b>{entity.type}</b>
          </div>
          <div>
            Callsign: <b>{entity.callsign}</b>
          </div>
          <div>
            Position:{' '}
            <b>
              {entity.position.lat.toFixed(6)}, {entity.position.lon.toFixed(6)}
            </b>
          </div>
          <div>
            Task: <b>{entity.task ?? '-'}</b>
          </div>
          <div>
            Speed: <b>{entity.speedKph ?? 0} kph</b>
          </div>
          <div>
            Ammo: <b>{entity.ammoPct ?? 0}</b>
          </div>
          <div>
            Damage: <b>{entity.damagePct ?? 0}</b>
          </div>
          <div>
            Route points: <b>{entity.route?.length ?? 0}</b>
          </div>
        </div>
      )}
    </div>
  )
}
