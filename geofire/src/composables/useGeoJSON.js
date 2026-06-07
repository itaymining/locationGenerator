import { ref, computed } from 'vue'
import * as turf from '@turf/turf'
import moment from 'moment'
import randomLocation from 'random-location'

function toRadians(deg) { return (deg * Math.PI) / 180 }
function toDegrees(rad) { return (rad * 180) / Math.PI }

function createHeading(startLat, startLng, destLat, destLng) {
  const sLat = toRadians(startLat), sLng = toRadians(startLng)
  const dLat = toRadians(destLat), dLng = toRadians(destLng)
  const y = Math.sin(dLng - sLng) * Math.cos(dLat)
  const x = Math.cos(sLat) * Math.sin(dLat) - Math.sin(sLat) * Math.cos(dLat) * Math.cos(dLng - sLng)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

function randomInCircle(center, radius) {
  return randomLocation.randomCirclePoint({ latitude: center[0], longitude: center[1] }, parseInt(radius))
}

export function useGeoJSON() {
  const geojson = ref({ type: 'FeatureCollection', features: [] })
  const lastPointTime = ref([moment()])
  const groupId = ref(-1)

  const firstPointTime = computed(() =>
    geojson.value.features.length > 0
      ? moment(geojson.value.features[0].properties.time.utc)
      : null
  )

  const trailDuration = computed(() => {
    if (geojson.value.features.length > 1) {
      return moment.duration(
        moment(geojson.value.features[geojson.value.features.length - 1].properties.time.utc)
          .diff(moment(geojson.value.features[0].properties.time.utc))
      )
    }
    return moment.duration(0)
  })

  function addFeature(lat, lng, currentPointTime, speed, gId, addRand, locationMethodAssign, setZero, customPropsArg, accuracy, locationSubMethod, onMarkerCreated) {
    accuracy = Number(accuracy) || 12
    const features = geojson.value.features
    const lastfeature = features[features.length - 1]

    if (addRand && accuracy > 0) {
      const newPos = randomInCircle([lat, lng], accuracy)
      lat = newPos.latitude
      lng = newPos.longitude
    }

    // compute speed from distance/time
    if (features.length >= 1) {
      const prevTime = moment(lastfeature.properties.time.utc)
      const line = turf.lineString([
        [lastfeature.geometry.coordinates[0], lastfeature.geometry.coordinates[1]],
        [lat, lng]
      ])
      const dist = turf.lineDistance(line, { units: 'meters' })
      const hours = moment.duration(currentPointTime.diff(prevTime)).asHours()
      speed = hours > 0 ? Math.round(dist / 1000 / hours) : 0
    }

    let heading = 0
    if (features.length >= 1) {
      heading = Math.floor(createHeading(
        lastfeature.geometry.coordinates[0], lastfeature.geometry.coordinates[1], lat, lng
      ))
    }

    if (setZero) { speed = 0; heading = null }

    lastPointTime.value[gId] = currentPointTime

    const lbsInfo = locationSubMethod && locationSubMethod !== 'NONE'
      ? { subMethod: locationSubMethod, cellularsNumber: 11, hotspotsNumber: 26, cellularInfo: [] }
      : null

    const feature = {
      groupId: gId,
      leaflet_id: null,
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [parseFloat(lat), parseFloat(lng)] },
      properties: {
        time: { utc: currentPointTime.toISOString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
        speed,
        speedType: 'kmh',
        heading,
        accuracy,
        ...(lbsInfo ? { lbsInfo } : {}),
        customProps: customPropsArg || {},
      },
    }

    geojson.value.features.push(feature)

    // fix first icon heading when second arrives
    if (features.length === 2 && features[0].properties.setZero !== true) {
      features[0].properties.heading = heading
    }

    if (onMarkerCreated) onMarkerCreated(feature, features.length - 1)
    return feature
  }

  function updateFeatureCustomProps(index, customProps) {
    geojson.value.features[index].properties.customProps = { ...customProps }
  }

  function removeGroup(gId) {
    geojson.value.features = geojson.value.features.filter(f => f.groupId !== gId)
    lastPointTime.value = lastPointTime.value.slice(0, gId)
    if (groupId.value >= 0) groupId.value = gId - 1
  }

  function clearAll() {
    geojson.value.features = []
    lastPointTime.value = [moment()]
    groupId.value = -1
  }

  function changeTrailTimes(newFromTime) {
    if (!firstPointTime.value) return
    const duration = moment.duration(newFromTime.diff(firstPointTime.value))
    geojson.value.features.forEach(feature => {
      const shifted = moment(feature.properties.time.utc).add(duration.asSeconds(), 'seconds')
      feature.properties.time = { utc: shifted.toISOString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone }
    })
    for (const i in lastPointTime.value) {
      lastPointTime.value[i] = lastPointTime.value[i].clone().add(duration.asSeconds(), 'seconds')
    }
  }

  function incrementGroupId() {
    groupId.value += 1
    return groupId.value
  }

  return {
    geojson,
    lastPointTime,
    groupId,
    firstPointTime,
    trailDuration,
    addFeature,
    updateFeatureCustomProps,
    removeGroup,
    clearAll,
    changeTrailTimes,
    incrementGroupId,
  }
}
