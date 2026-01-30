import { useEffect, useRef } from 'react'
import type { Entity } from '@shared/simulator'

import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import { fromLonLat, toLonLat } from 'ol/proj'
import {
  Style,
  Stroke,
  Fill,
  Circle as CircleStyle,
  Text as TextStyle,
} from 'ol/style'

import './mapPanel.css'

type LonLat = { lon: number; lat: number }

export default function MapPanel({
  entities,
  selectedId,
  onSelect,
  onMapClick,
}: {
  entities: Entity[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMapClick: (p: LonLat) => void
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)

  const entitySourceRef = useRef<VectorSource | null>(null)
  const routeSourceRef = useRef<VectorSource | null>(null)

  const entityLayerRef = useRef<VectorLayer<VectorSource> | null>(null)
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null)

  const onSelectRef = useRef(onSelect)
  const onMapClickRef = useRef(onMapClick)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  useEffect(() => {
    if (!mapDivRef.current) return
    if (mapRef.current) return

    const entitySource = new VectorSource()
    const routeSource = new VectorSource()
    entitySourceRef.current = entitySource
    routeSourceRef.current = routeSource

    const entityLayer = new VectorLayer({ source: entitySource })
    const routeLayer = new VectorLayer({
      source: routeSource,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(255, 120, 0, 0.9)',
          width: 3,
          lineDash: [10, 8],
        }),
      }),
    })

    entityLayerRef.current = entityLayer
    routeLayerRef.current = routeLayer

    const map = new Map({
      target: mapDivRef.current,
      layers: [new TileLayer({ source: new OSM() }), routeLayer, entityLayer],
      view: new View({
        center: fromLonLat([17.5221244, 49.6339428]),
        zoom: 13,
      }),
    })

    map.on('singleclick', (evt) => {
      const hit = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature) as
        | Feature
        | undefined

      if (hit) {
        const id = hit.get('entityId') as string | undefined
        if (id) onSelectRef.current(id)
        return
      }

      const [lon, lat] = toLonLat(evt.coordinate)
      onMapClickRef.current({ lon, lat })
    })

    mapRef.current = map

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
      entityLayerRef.current = null
      routeLayerRef.current = null
      entitySourceRef.current = null
      routeSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    const src = entitySourceRef.current
    if (!src) return

    src.clear()

    const feats = entities.map((e) => {
      const f = new Feature({
        geometry: new Point(fromLonLat([e.position.lon, e.position.lat])),
      })
      f.set('entityId', e.id)
      f.set('callsign', e.callsign)
      return f
    })

    src.addFeatures(feats)
  }, [entities])

  useEffect(() => {
    const layer = entityLayerRef.current
    if (!layer) return

    layer.setStyle((feature) => {
      const id = feature.get('entityId') as string
      const callsign = (feature.get('callsign') as string) ?? id
      const selected = selectedId === id

      return new Style({
        image: new CircleStyle({
          radius: selected ? 9 : 6,
          fill: new Fill({ color: selected ? '#111' : '#2b6cb0' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new TextStyle({
          text: selected ? callsign : '',
          offsetY: -18,
          font: '12px system-ui',
          fill: new Fill({ color: '#111' }),
          stroke: new Stroke({ color: 'rgba(255,255,255,0.9)', width: 3 }),
        }),
      })
    })
  }, [selectedId])

  useEffect(() => {
    const src = routeSourceRef.current
    if (!src) return

    src.clear()

    const e = entities.find((x) => x.id === selectedId)
    if (!e?.route || e.route.length < 2) return

    const coords = e.route.map((p) => fromLonLat([p.lon, p.lat]))
    const line = new Feature({ geometry: new LineString(coords) })
    src.addFeature(line)

    const map = mapRef.current
    if (!map) return
    try {
      const view = map.getView()
      const extent = (line.getGeometry() as LineString).getExtent()
      view.fit(extent, { padding: [40, 40, 40, 40], maxZoom: 14 })
    } catch {
      // ignore
    }
  }, [entities, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.updateSize()
  })

  return (
    <div className="mapRoot">
      <div ref={mapDivRef} className="mapCanvas" />
      <div className="mapHint">
        Click a unit to display its details. Then click on the map to choose
        where it should move.
      </div>
    </div>
  )
}
