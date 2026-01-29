import { Entity, LatLon, SimState } from '@shared/simulator'
import { MOCK_ENTITIES } from './mock/entities'

export type RuntimeEntity = Entity & { routeIndex: number }

export type RuntimeState = {
  sim: SimState
  entities: Map<string, RuntimeEntity>
}

export function createState(): RuntimeState {
  const entities = new Map<string, RuntimeEntity>()
  for (const e of MOCK_ENTITIES) {
    entities.set(e.id, { ...e, routeIndex: 0 })
  }
  return {
    sim: { status: 'STOPPED', timeSec: 0 },
    entities,
  }
}

export function toPublicEntity(e: RuntimeEntity): Entity {
  const { routeIndex, ...pub } = e
  return pub
}

export function step(state: RuntimeState, dtSec: number): Entity[] {
  state.sim.timeSec += dtSec
  const changed: Entity[] = []

  for (const e of state.entities.values()) {
    if (!e.route || e.route.length < 2) continue // Dont move entities without a route
    if (e.routeIndex >= e.route.length - 1) continue // Dont move entities that are already at the end of their route

    const nextIdx = Math.min(e.routeIndex + 1, e.route.length - 1) // Move to the next route point
    if (nextIdx === e.routeIndex) continue

    e.routeIndex = nextIdx
    e.position = e.route[nextIdx]
    e.task = 'Move'
    e.speedKph = 6

    changed.push(toPublicEntity(e)) // Save the change
  }

  return changed // return all entities that moved and send via entityUpdated
}

export function addWaypoint(
  state: RuntimeState,
  entityId: string,
  point: LatLon
): Entity | null {
  const e = state.entities.get(entityId)
  if (!e) return null
  e.route = [...(e.route ?? []), { lat: point.lat, lon: point.lon }]
  return toPublicEntity(e)
}

export function setTarget(
  state: RuntimeState,
  entityId: string,
  point: LatLon
): Entity | null {
  const e = state.entities.get(entityId)
  if (!e) return null
  e.route = [e.position, { lat: point.lat, lon: point.lon }]
  e.routeIndex = 0
  e.task = 'Move'
  e.speedKph = 6
  return toPublicEntity(e)
}
