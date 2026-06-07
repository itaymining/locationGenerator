import { ref } from 'vue'
import moment from 'moment'

export function useFireEngine() {
  const progress = ref(0)
  const inPause = ref(false)
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
    inPause.value = false
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

        onFire?.(progress.value)
        try {
          const status = await fireOne(feature, config)
          onSuccess?.(progress.value, status)
          onLog?.({ type: 'success', message: `→ POST ${config.endpointUrl} ${status}`, feature })
        } catch (err) {
          onError?.(progress.value, err)
          onLog?.({ type: 'error', message: `✗ ${err.message}`, feature })
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
      timeinterval = setInterval(async () => {
        if (progress.value >= total) { _finish(); return }
        const windowStart = moment(features[progress.value].properties.time.utc)
        const windowEnd = windowStart.clone().add(fireBatchTimeoutSec, 'seconds')
        const batch = features.filter(f =>
          moment(f.properties.time.utc).isBetween(windowStart, windowEnd, null, '[)')
        )
        for (const f of batch) {
          const idx = features.indexOf(f)
          onFire?.(idx)
          try {
            const status = await fireOne(f, config)
            onSuccess?.(idx, status)
            onLog?.({ type: 'success', message: `→ POST ${config.endpointUrl} ${status}` })
          } catch (err) {
            onError?.(idx, err)
            onLog?.({ type: 'error', message: `✗ ${err.message}` })
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
            _finish(); return
          }
        }
      }, fireBatchTimeoutSec * 1000)
    }
  }

  function pause() {
    clearInterval(timeinterval)
    inPause.value = true
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
    fireTimeoutBetweenDaysHelper = undefined
  }

  function _finish() {
    clearInterval(timeinterval)
  }

  return { progress, inPause, processLoopCount, start, pause, resume, reset, cleanFeature, headersToObject }
}
