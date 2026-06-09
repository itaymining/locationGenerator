import { ref } from 'vue'
import moment from 'moment'

export function useFireEngine() {
  const progress = ref(0)
  const inPause = ref(false)
  const isRunning = ref(false)
  const processLoopCount = ref(1)
  let timeinterval = null
  let fireTimeoutBetweenDaysHelper = undefined

  function cleanFeature(feature, defaultCustomProps, _headers) {
    const { leaflet_id, groupId, ...clean } = feature
    const { customProps, ...props } = clean.properties
    const defaultFlat = Object.fromEntries((defaultCustomProps || []).map(h => [h.key, h.value]))
    const customFlat = customProps || {}
    clean.properties = { ...props, ...defaultFlat, ...customFlat }
    return clean
  }

  function headersToObject(headers) {
    return Object.fromEntries((headers || []).filter(h => h.key).map(h => [h.key, h.value]))
  }

  async function fireOne(feature, config) {
    const body = cleanFeature(feature, config.defaultCustomProps, config.headers)
    const headers = { 'Content-Type': 'application/json', ...headersToObject(config.headers) }
    const res = await fetch(config.endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.status
  }

  function start(geojson, config, callbacks, settings) {
    clearInterval(timeinterval) // always kill any running interval before starting new one
    inPause.value = false
    isRunning.value = true
    const {
      fireType = 'pointRate',
      fireTimeoutSec = 1,
      fireBatchTimeoutSec = 120,
      fireTimeoutBetweenDaysSec = 0,
      advanceTrailOverTime = false,
      advanceTrailOverTimeNumOfLoops = 1,
      deviceSamplingSeconds = 60,
      onChangeTrailTimes,
    } = settings

    const { onFire, onSuccess, onError, onLog } = callbacks
    // geojson is a Vue Ref — unwrap to get the plain FeatureCollection
    const features = (geojson.value ?? geojson).features
    const total = features.length

    function _finish() {
      clearInterval(timeinterval)
      isRunning.value = false
      onLog?.({ type: 'info', message: `Done — ${progress.value}/${total} points fired` })
    }
    if (fireType === 'pointRate') {
      timeinterval = setInterval(async () => {
        if (progress.value >= total) { _finish(); return }

        const feature = features[progress.value]

        // timeout between days
        if (fireTimeoutBetweenDaysSec > 0 && progress.value >= 1) {
          const prevDay = moment(features[progress.value - 1].properties.time.utc).startOf('day')
          const curDay = moment(feature.properties.time.utc).startOf('day')
          if (!prevDay.isSame(curDay)) {
            if (!fireTimeoutBetweenDaysHelper) {
              fireTimeoutBetweenDaysHelper = moment()
              onLog?.({ type: 'info', message: `Day boundary — waiting ${fireTimeoutBetweenDaysSec}s` })
            }
            if (moment().diff(fireTimeoutBetweenDaysHelper, 'seconds') < fireTimeoutBetweenDaysSec) return
            fireTimeoutBetweenDaysHelper = undefined
          }
        }

        const idx = progress.value
        onFire?.(idx)
        try {
          const status = await fireOne(feature, config)
          onSuccess?.(idx, status)
          onLog?.({
            type: 'success',
            message: `→ POST ${config.endpointUrl} ${status}`,
            body: cleanFeature(feature, config.defaultCustomProps, config.headers),
            index: idx,
          })
        } catch (err) {
          onError?.(idx, err)
          onLog?.({ type: 'error', message: `✗ ${err.message}`, index: idx })
        }

        progress.value++

        if (progress.value >= total) {
          if (advanceTrailOverTime && (processLoopCount.value + 1) <= advanceTrailOverTimeNumOfLoops) {
            const lastTime = moment(features[features.length - 1].properties.time.utc)
            lastTime.add(deviceSamplingSeconds, 'seconds')
            onChangeTrailTimes?.(lastTime)
            progress.value = 0
            processLoopCount.value++
            return
          }
          _finish()
        }
      }, fireTimeoutSec * 1000)

    } else if (fireType === 'reportRate') {
      // Sliding window along trail-time axis.
      // Every fireBatchTimeoutSec REAL seconds: collect all features whose trail-time
      // falls in [windowStart, windowEnd), fire as ONE FeatureCollection POST.
      // Empty windows → log + slide, no POST. Finish when windowStart > lastTrailTime.
      let windowStart = moment(features[0].properties.time.utc)
      const getTrailEnd = () => moment(features[features.length - 1].properties.time.utc)

      timeinterval = setInterval(async () => {
        const trailEnd = getTrailEnd()

        if (windowStart.isAfter(trailEnd)) {
          if (advanceTrailOverTime && (processLoopCount.value + 1) <= advanceTrailOverTimeNumOfLoops) {
            const nextStart = trailEnd.clone().add(deviceSamplingSeconds, 'seconds')
            onChangeTrailTimes?.(nextStart)
            progress.value = 0
            processLoopCount.value++
            windowStart = moment(features[0].properties.time.utc)
            return
          }
          _finish()
          return
        }

        const windowEnd = windowStart.clone().add(fireBatchTimeoutSec, 'seconds')
        const wStartFmt = windowStart.format('HH:mm:ss')
        const wEndFmt = windowEnd.format('HH:mm:ss')

        const batch = features.filter(f => {
          const t = moment(f.properties.time.utc)
          return t.isSameOrAfter(windowStart) && t.isBefore(windowEnd)
        })

        // slide window before any async work so next tick always advances
        windowStart = windowEnd

        if (batch.length === 0) {
          onLog?.({ type: 'info', message: `Window [${wStartFmt}–${wEndFmt}] empty — sliding` })
          return
        }

        const batchIndices = batch.map(f => features.indexOf(f))
        batchIndices.forEach(i => onFire?.(i))

        try {
          const batchCleaned = batch.map(f => cleanFeature(f, config.defaultCustomProps, config.headers))
          const body = { type: 'FeatureCollection', features: batchCleaned }
          const headers = { 'Content-Type': 'application/json', ...headersToObject(config.headers) }
          const res = await fetch(config.endpointUrl, { method: 'POST', headers, body: JSON.stringify(body) })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)

          batchIndices.forEach(i => onSuccess?.(i, res.status))
          progress.value = batchIndices[batchIndices.length - 1] + 1

          onLog?.({
            type: 'success',
            message: `→ Batch [${wStartFmt}–${wEndFmt}] ${batch.length} pts → ${res.status}`,
            body,
            indices: batchIndices,
          })
        } catch (err) {
          batchIndices.forEach(i => onError?.(i))
          onLog?.({ type: 'error', message: `✗ Batch [${wStartFmt}–${wEndFmt}] ${err.message}` })
        }
      }, fireBatchTimeoutSec * 1000)
    }
  }

  function pause() {
    clearInterval(timeinterval)
    inPause.value = true
    isRunning.value = false
  }

  function resume(geojson, config, callbacks, settings) {
    inPause.value = false
    start(geojson, config, callbacks, settings)
  }

  function reset() {
    clearInterval(timeinterval)
    progress.value = 0
    processLoopCount.value = 1
    inPause.value = false
    isRunning.value = false
    fireTimeoutBetweenDaysHelper = undefined
  }

  return { progress, inPause, isRunning, processLoopCount, start, pause, resume, reset, cleanFeature, headersToObject }
}
