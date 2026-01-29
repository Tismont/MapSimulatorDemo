export type SimStatus = "STOPPED" | "RUNNING" | "PAUSED"

export type Side = "BLUE" | "RED"
export type UnitType = "LightInfantry" | "Tank" | "Artillery"
export type Task = "Idle" | "Move" | "Attack"

export type LatLon = { lat: number; lon: number }

export type Entity = {
  id: string
  side: Side
  type: UnitType
  callsign: string
  position: LatLon
  task: Task
  speedKph: number
  damagePct: number
  ammoPct: number
  route: LatLon[]
}

export type SimState = { status: SimStatus; timeSec: number }

export type ServerToClient =
  | { type: "init"; payload: { sim: SimState; entities: Entity[] } }
  | { type: "simState"; payload: { sim: SimState } }
  | { type: "entityCreated"; payload: { entity: Entity } }
  | { type: "entityUpdated"; payload: { entity: Entity } }
  | { type: "entityDestroyed"; payload: { entityId: string } }
  | { type: "log"; payload: { t: string; msg: string } }
  | { type: "error"; payload: { message: string } }

export type ClientToServer =
  | { type: "simCommand"; payload: { cmd: "play" | "pause" | "stop" | "step" } }
  | { type: "addWaypoint"; payload: { entityId: string; point: LatLon } }
  | { type: "setTarget"; payload: { entityId: string; point: LatLon } }
