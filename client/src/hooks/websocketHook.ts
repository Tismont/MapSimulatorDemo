import { useEffect, useMemo, useRef } from 'react'
import type { ClientToServer, ServerToClient } from '@shared/simulator'
import type { SimAction } from '../store/simulatorStore'

export function useSimWs(dispatch: (a: SimAction) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  const api = useMemo(() => {
    function send(msg: ClientToServer) {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify(msg))
    }

    return {
      play: () => send({ type: 'simCommand', payload: { cmd: 'play' } }),
      pause: () => send({ type: 'simCommand', payload: { cmd: 'pause' } }),
      stop: () => send({ type: 'simCommand', payload: { cmd: 'stop' } }),
      step: () => send({ type: 'simCommand', payload: { cmd: 'step' } }),
      setTarget: (entityId: string, point: { lat: number; lon: number }) =>
        send({ type: 'setTarget', payload: { entityId, point } }),
      addWaypoint: (entityId: string, point: { lat: number; lon: number }) =>
        send({ type: 'addWaypoint', payload: { entityId, point } }),
    }
  }, [])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000')
    wsRef.current = ws

    ws.onopen = () => dispatch({ type: 'wsConnected' })
    ws.onclose = () => dispatch({ type: 'wsDisconnected' })
    ws.onerror = () => dispatch({ type: 'wsError', message: 'WebSocket error' })

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as ServerToClient
        dispatch({ type: 'serverMsg', msg })
      } catch {
        dispatch({ type: 'wsError', message: 'Invalid message from server' })
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [dispatch])

  return api
}
