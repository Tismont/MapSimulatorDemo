import { WebSocketServer } from 'ws'
import type WebSocket from 'ws'
import {
  addWaypoint,
  createState,
  setTarget,
  step,
  toPublicEntity,
} from './state'
import { ClientToServer, ServerToClient } from '@shared/simulator'

const PORT = 4000
const TICK_MS = 800

const state = createState() // Current state of the simulation ("STOPPED" | "RUNNING" | "PAUSED")

const wss = new WebSocketServer({ port: PORT })
console.log(`WebSocket server running on ws://localhost:${PORT}`)

function nowTime() {
  return new Date().toLocaleTimeString('cs-CZ', { hour12: false })
}

function send(ws: WebSocket, msg: ServerToClient) {
  ws.send(JSON.stringify(msg))
}

// Send a message to all connected clients (multiplayer logic)
function broadcast(msg: ServerToClient) {
  const raw = JSON.stringify(msg)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(raw)
  }
}

// Send simulation snapshot when a user connects (show loading and wait for init...)
function sendInit(ws: WebSocket) {
  const entities = Array.from(state.entities.values()).map(toPublicEntity)
  send(ws, { type: 'init', payload: { sim: state.sim, entities } })
  send(ws, { type: 'log', payload: { t: nowTime(), msg: 'Client connected' } })
}

function onCommand(cmd: 'play' | 'pause' | 'stop' | 'step') {
  if (cmd === 'play') state.sim.status = 'RUNNING'
  if (cmd === 'pause') state.sim.status = 'PAUSED'
  if (cmd === 'stop') state.sim.status = 'STOPPED'

  broadcast({ type: 'simState', payload: { sim: state.sim } })
  broadcast({
    type: 'log',
    payload: { t: nowTime(), msg: `Sim command: ${cmd}` },
  })

  // Moves the simulation forward by a single tick immediately
  if (cmd === 'step') {
    const changed = step(state, 1)
    for (const e of changed)
      broadcast({ type: 'entityUpdated', payload: { entity: e } })
  }
}

setInterval(() => {
  if (state.sim.status !== 'RUNNING') return
  const changed = step(state, 1)
  for (const e of changed)
    broadcast({ type: 'entityUpdated', payload: { entity: e } })
}, TICK_MS)

wss.on('connection', (ws) => {
  sendInit(ws)

  ws.on('message', (raw) => {
    let msg: ClientToServer
    try {
      msg = JSON.parse(String(raw))
    } catch {
      send(ws, { type: 'error', payload: { message: 'Invalid JSON' } })
      return
    }

    if (msg.type === 'simCommand') {
      onCommand(msg.payload.cmd)
      return
    }

    if (msg.type === 'addWaypoint') {
      const updated = addWaypoint(
        state,
        msg.payload.entityId,
        msg.payload.point
      )
      if (!updated) {
        send(ws, { type: 'error', payload: { message: 'Entity not found' } })
        return
      }
      broadcast({ type: 'entityUpdated', payload: { entity: updated } })
      broadcast({
        type: 'log',
        payload: {
          t: nowTime(),
          msg: `Waypoint added to ${msg.payload.entityId}`,
        },
      })
      return
    }

    if (msg.type === 'setTarget') {
      const updated = setTarget(state, msg.payload.entityId, msg.payload.point)
      if (!updated) {
        send(ws, { type: 'error', payload: { message: 'Entity not found' } })
        return
      }
      broadcast({ type: 'entityUpdated', payload: { entity: updated } })
      broadcast({
        type: 'log',
        payload: {
          t: nowTime(),
          msg: `New target for ${msg.payload.entityId}`,
        },
      })
      return
    }

    send(ws, { type: 'error', payload: { message: 'Unknown message type' } })
  })

  ws.on('close', () => {
    broadcast({
      type: 'log',
      payload: { t: nowTime(), msg: 'Client disconnected' },
    })
  })
})
