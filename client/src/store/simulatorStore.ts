import type { Entity, SimState, ServerToClient } from '@shared/simulator'

export type SimLogRow = { t: string; msg: string }

export type SimUIState = {
  connected: boolean
  hasInit: boolean
  sim: SimState | null
  entities: Record<string, Entity>
  selectedEntityId: string | null
  log: SimLogRow[]
  error: string | null
}

export type SimAction =
  | { type: 'wsConnected' }
  | { type: 'wsDisconnected' }
  | { type: 'wsError'; message: string }
  | { type: 'selectEntity'; id: string | null }
  | { type: 'serverMsg'; msg: ServerToClient }

export const initialSimState: SimUIState = {
  connected: false,
  hasInit: false,
  sim: null,
  entities: {},
  selectedEntityId: null,
  log: [],
  error: null,
}

function upsertEntity(map: Record<string, Entity>, e: Entity) {
  return { ...map, [e.id]: e }
}

export function simReducer(state: SimUIState, action: SimAction): SimUIState {
  switch (action.type) {
    case 'wsConnected':
      return { ...state, connected: true, error: null }
    case 'wsDisconnected':
      return { ...state, connected: false }
    case 'wsError':
      return { ...state, error: action.message }
    case 'selectEntity':
      return { ...state, selectedEntityId: action.id }
    case 'serverMsg': {
      const m = action.msg

      if (m.type === 'init') {
        const entities: Record<string, Entity> = {}
        for (const e of m.payload.entities) entities[e.id] = e
        return {
          ...state,
          hasInit: true,
          sim: m.payload.sim,
          entities,
          error: null,
        }
      }

      if (m.type === 'entityUpdated') {
        return {
          ...state,
          entities: upsertEntity(state.entities, m.payload.entity),
        }
      }

      if (m.type === 'simState') {
        return { ...state, sim: m.payload.sim }
      }

      if (m.type === 'log') {
        return { ...state, log: [...state.log, m.payload] }
      }

      if (m.type === 'error') {
        return { ...state, error: m.payload.message }
      }

      return state
    }
    default:
      return state
  }
}
