<template>
  <div class="map-wrapper" v-show="showMap">
    <div id="mapContainer" ref="mapContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import * as turf from '@turf/turf'
import moment from 'moment'
import Swal from 'sweetalert2'
import randomLocation from 'random-location'

// Inline leaflet-rotatedmarker polyfill (CJS module uses global L — inlined for Vite compat)
function applyRotatedMarkerPolyfill(L) {
  if (L.Marker.prototype.setRotationAngle) return // already patched
  const proto_setPos = L.Marker.prototype._setPos
  L.Marker.addInitHook(function () {
    const iconOptions = this.options.icon && this.options.icon.options
    const iconAnchor = iconOptions && this.options.icon.options.iconAnchor
    this.options.rotationOrigin = this.options.rotationOrigin || (iconAnchor ? (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px') : 'center bottom')
    this.options.rotationAngle = this.options.rotationAngle || 0
  })
  L.Marker.include({
    _setPos(pos) {
      proto_setPos.call(this, pos)
      if (this.options.rotationAngle && this._icon) {
        this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = this.options.rotationOrigin
        this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)'
      }
    },
    setRotationAngle(angle) { this.options.rotationAngle = angle; this.update(); return this },
    setRotationOrigin(origin) { this.options.rotationOrigin = origin; this.update(); return this },
  })
}

import movementBlue from '../assets/icons/movement_blue.svg'
import movementGreen from '../assets/icons/movement_green.svg'
import movementOrange from '../assets/icons/movement_orange.svg'
import movementRed from '../assets/icons/movement_red.svg'
import stopBlue from '../assets/icons/stop_blue.svg'
import stopGreen from '../assets/icons/stop_green.svg'
import stopOrange from '../assets/icons/stop_orange.svg'
import stopRed from '../assets/icons/stop_red.svg'

// Fix Vite/Leaflet broken default marker icon (geoman drag preview uses it)
import leafletIconUrl from 'leaflet/dist/images/marker-icon.png'
import leafletIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import leafletShadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: leafletIconUrl,
  iconRetinaUrl: leafletIconRetinaUrl,
  shadowUrl: leafletShadowUrl,
})

const props = defineProps({
  geojson: { type: Object, required: true },
  showMap: { type: Boolean, default: true },
  settings: { type: Object, required: true },
})

const emit = defineEmits(['add-features', 'edit-point'])

const mapContainer = ref(null)
let map = null
// map from marker leaflet_id → accuracy circle layer
const accuracyCircles = {}

const icons = {}

function makeIcon(url) {
  return new L.Icon({ iconUrl: url, iconSize: [20, 20], iconAnchor: [10, 10] })
}

function initIcons() {
  icons.movementBlue = makeIcon(movementBlue)
  icons.movementGreen = makeIcon(movementGreen)
  icons.movementOrange = makeIcon(movementOrange)
  icons.movementRed = makeIcon(movementRed)
  icons.stopBlue = makeIcon(stopBlue)
  icons.stopGreen = makeIcon(stopGreen)
  icons.stopOrange = makeIcon(stopOrange)
  icons.stopRed = makeIcon(stopRed)
}

onMounted(() => {
  applyRotatedMarkerPolyfill(L)
  initIcons()

  map = L.map(mapContainer.value, { preferCanvas: true }).setView([32.106, 34.834], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  map.pm.addControls({
    position: 'topleft',
    drawMarker: true,
    drawCircle: true,
    drawCircleMarker: false,
    drawPolyline: false,
    drawText: false,
    drawRectangle: false,
    drawPolygon: false,
    editMode: false,
    dragMode: false,
    cutPolygon: false,
    removalMode: false,
    rotateMode: false,
  })

  map.on('pm:create', onMapCreate)
})

onBeforeUnmount(() => {
  if (map) map.remove()
})

function getIconForFeature(feature, state = 'default') {
  const isMoving = feature.properties.heading !== null && feature.properties.heading !== undefined
  if (state === 'success') return isMoving ? icons.movementGreen : icons.stopGreen
  if (state === 'firing') return isMoving ? icons.movementOrange : icons.stopOrange
  if (state === 'error') return isMoving ? icons.movementRed : icons.stopRed
  return isMoving ? icons.movementBlue : icons.stopBlue
}

function buildPopupContent(feature) {
  const p = feature.properties
  const rows = [
    ['Time (UTC)', p.time?.utc || ''],
    ['Speed', `${p.speed ?? 0} km/h`],
    ['Heading', p.heading != null ? `${p.heading}°` : 'stopped'],
    ['Accuracy', `${p.accuracy ?? 0}m`],
  ]
  if (p.customProps && Object.keys(p.customProps).length > 0) {
    for (const [k, v] of Object.entries(p.customProps)) rows.push([k, v])
  }
  return `<div style="font-family:'Barlow Condensed',sans-serif;min-width:190px">
    <table style="font-size:12px;border-collapse:collapse;width:100%">${
    rows.map(([k, v]) =>
      `<tr>
        <td style="padding:3px 12px 3px 0;color:#7d8fa3;font-weight:700;white-space:nowrap;letter-spacing:0.06em;text-transform:uppercase;font-size:10px">${k}</td>
        <td style="padding:3px 0;word-break:break-all;color:#dde1ea;font-family:'JetBrains Mono',monospace;font-size:11px">${v}</td>
      </tr>`
    ).join('')
  }</table>${p.customProps && Object.keys(p.customProps).length > 0
    ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07)">
        <table style="font-size:12px;border-collapse:collapse;width:100%">${
        Object.entries(p.customProps).map(([k, v]) =>
          `<tr>
            <td style="padding:2px 12px 2px 0;color:#e8a020;font-weight:700;white-space:nowrap;letter-spacing:0.06em;text-transform:uppercase;font-size:10px">${k}</td>
            <td style="padding:2px 0;word-break:break-all;color:#dde1ea;font-family:'JetBrains Mono',monospace;font-size:11px">${v}</td>
          </tr>`
        ).join('')
      }</table>
      </div>`
    : ''
  }</div>`
}

function addMarker(feature, featureIndex) {
  if (!map) return
  const [lat, lng] = feature.geometry.coordinates
  const icon = getIconForFeature(feature)
  const marker = L.marker([lat, lng], { icon })
  if (marker.setRotationAngle) {
    marker.setRotationAngle(feature.properties.heading ?? 0)
  }
  marker.addTo(map)
  marker.bindPopup(L.popup({ maxWidth: 400, closeButton: false }).setContent(buildPopupContent(feature)))
  marker.on('mouseover', () => marker.openPopup())
  marker.on('mouseout', () => marker.closePopup())
  marker.on('click', () => { marker.closePopup(); emit('edit-point', featureIndex) })
  feature.leaflet_id = marker._leaflet_id

  // draw accuracy circle if enabled
  const accuracy = feature.properties.accuracy
  if (props.settings.markLocationWithError && accuracy > 0) {
    const circle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#e8a020',
      fillColor: '#e8a020',
      fillOpacity: 0.07,
      weight: 1,
      opacity: 0.35,
      interactive: false,
    }).addTo(map)
    accuracyCircles[marker._leaflet_id] = circle
  }
}

function setMarkerState(leaflet_id, state) {
  const layer = map?._layers[leaflet_id]
  if (!layer) return
  const feat = props.geojson.features.find(f => f.leaflet_id === leaflet_id)
  if (feat) layer.setIcon(getIconForFeature(feat, state))
}

function setMarkerFiring(leaflet_id) { setMarkerState(leaflet_id, 'firing') }
function setMarkerSuccess(leaflet_id) { setMarkerState(leaflet_id, 'success') }
function setMarkerError(leaflet_id) { setMarkerState(leaflet_id, 'error') }

function resetAllMarkers() {
  for (const f of props.geojson.features) {
    const layer = map?._layers[f.leaflet_id]
    if (layer) layer.setIcon(getIconForFeature(f, 'default'))
  }
}

function clearAll() {
  map?.eachLayer(layer => { if (!layer._url) layer.remove() })
  Object.keys(accuracyCircles).forEach(k => delete accuracyCircles[k])
}

function removeGroup(groupId) {
  const toRemove = props.geojson.features.filter(f => f.groupId === groupId)
  toRemove.forEach(f => {
    const layer = map?._layers[f.leaflet_id]
    if (layer) layer.remove()
    const circle = accuracyCircles[f.leaflet_id]
    if (circle) { circle.remove(); delete accuracyCircles[f.leaflet_id] }
  })
}

function zoomToLast() {
  const features = props.geojson.features
  if (features.length > 0) {
    map.setView(features[features.length - 1].geometry.coordinates, 15)
  }
}

function refreshPopups() {
  for (const f of props.geojson.features) {
    const layer = map?._layers[f.leaflet_id]
    if (layer) layer.setPopupContent(buildPopupContent(f))
  }
}

function removeAllGeomanDrawings() {
  map?.eachLayer(layer => { if (!layer._url && layer._drawnByGeoman) layer.remove() })
}

async function onMapCreate(e) {
  if (e.shape === 'Circle') {
    await handleCircle(e.marker._latlng, e.marker._radius)
    removeAllGeomanDrawings()
    return
  }
  handlePoint(e.marker._latlng)
  removeAllGeomanDrawings()
}

function handlePoint(latlng) {
  const features = props.geojson.features
  const gId = features.length > 0 ? features[features.length - 1].groupId : 0

  if (features.length === 0) {
    emit('add-features', [{
      lat: latlng.lat, lng: latlng.lng,
      time: moment(), addRand: false, setZero: false, groupId: 0,
    }])
    return
  }

  const lastFeature = features[features.length - 1]
  const lastTime = moment(lastFeature.properties.time.utc)
  const speed = props.settings.subjectSpeedKMPH || 5
  const samplingSeconds = props.settings.deviceSamplingSeconds || 60

  const line = turf.lineString([
    [lastFeature.geometry.coordinates[0], lastFeature.geometry.coordinates[1]],
    [latlng.lat, latlng.lng],
  ])
  const distance = turf.lineDistance(line, { units: 'meters' })
  const totalPointsNeeded = Math.floor(distance / (speed / 3.6) / samplingSeconds)

  const toAdd = []
  if (totalPointsNeeded > 0) {
    const chunks = turf.lineChunk(line, distance / 1000 / (totalPointsNeeded + 1))
    let t = lastTime.clone()
    for (let i = 0; i < chunks.features.length; i++) {
      t = t.clone().add(samplingSeconds, 'seconds')
      toAdd.push({
        lat: chunks.features[i].geometry.coordinates[1][0],
        lng: chunks.features[i].geometry.coordinates[1][1],
        time: t.clone(),
        addRand: i !== chunks.features.length - 1,
        setZero: false,
        groupId: gId,
      })
    }
  } else {
    toAdd.push({
      lat: latlng.lat, lng: latlng.lng,
      time: lastTime.clone().add(samplingSeconds, 'seconds'),
      addRand: false, setZero: false, groupId: gId,
    })
  }
  emit('add-features', toAdd)
}

async function handleCircle(latlng, radius) {
  const features = props.geojson.features
  const lastTime = features.length > 0
    ? moment(features[features.length - 1].properties.time.utc)
    : moment()
  const gId = features.length > 0 ? features[features.length - 1].groupId : 0
  const samplingSeconds = props.settings.deviceSamplingSeconds || 60

  const defaultTime = lastTime.clone().add(samplingSeconds * 10, 'seconds').format('YYYY-MM-DD HH:mm:ss')
  const result = await Swal.fire({
    title: 'Area Points',
    html: `
      <label style="display:block;font-size:12px;color:#7d8fa3;text-align:left;margin-bottom:4px;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.08em;text-transform:uppercase">End datetime</label>
      <input id="swal-time" class="swal2-input" value="${lastTime.format('YYYY-MM-DD HH:mm:ss')}" style="font-family:monospace;font-size:13px">
      <div style="display:flex;gap:16px;margin-top:12px;justify-content:center">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#dde1ea;font-family:'Barlow Condensed',sans-serif;font-weight:600">
          <input type="radio" name="moveType" value="movement" checked style="accent-color:#e8a020"> Movement
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#dde1ea;font-family:'Barlow Condensed',sans-serif;font-weight:600">
          <input type="radio" name="moveType" value="stop" style="accent-color:#e8a020"> Stop
        </label>
      </div>`,
    confirmButtonText: 'Add Points',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    background: '#0c0e16',
    color: '#dde1ea',
    confirmButtonColor: '#e8a020',
    cancelButtonColor: '#2a3040',
    focusConfirm: false,
    preConfirm: () => ({
      time: document.getElementById('swal-time').value,
      isStop: document.querySelector('input[name="moveType"]:checked').value === 'stop',
    }),
  })

  if (!result.isConfirmed) return
  const endTime = moment(result.value.time)
  const isStop = result.value.isStop

  const toAdd = []
  let t = lastTime.clone()
  while (t.isBefore(endTime)) {
    t = t.clone().add(samplingSeconds, 'seconds')
    const newPos = randomLocation.randomCirclePoint(
      { latitude: latlng.lat, longitude: latlng.lng },
      parseInt(radius)
    )
    toAdd.push({
      lat: newPos.latitude, lng: newPos.longitude,
      time: t.clone(), addRand: false, setZero: isStop, groupId: gId,
    })
  }
  emit('add-features', toAdd)
}

defineExpose({
  addMarker,
  setMarkerFiring,
  setMarkerSuccess,
  setMarkerError,
  resetAllMarkers,
  clearAll,
  removeGroup,
  zoomToLast,
  refreshPopups,
})
</script>

<style scoped>
.map-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
}
#mapContainer {
  width: 100%;
  height: 100%;
}
</style>
