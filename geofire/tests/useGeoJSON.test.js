import { describe, it, expect, beforeEach } from 'vitest'
import { useGeoJSON } from '../src/composables/useGeoJSON.js'
import moment from 'moment'

describe('useGeoJSON', () => {
  it('starts with empty FeatureCollection', () => {
    const { geojson } = useGeoJSON()
    expect(geojson.value.type).toBe('FeatureCollection')
    expect(geojson.value.features).toHaveLength(0)
  })

  it('addFeature adds a feature with correct structure', () => {
    const { geojson, addFeature } = useGeoJSON()
    const time = moment('2024-01-01T10:00:00Z')
    addFeature(32.1, 34.8, time, 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    expect(geojson.value.features).toHaveLength(1)
    const f = geojson.value.features[0]
    expect(f.type).toBe('Feature')
    expect(f.geometry.type).toBe('Point')
    expect(f.geometry.coordinates[0]).toBeCloseTo(32.1)
    expect(f.properties.locationMethod).toBe('GNSS')
    expect(f.properties.accuracy).toBe(12)
  })

  it('second feature heading computed from first', () => {
    const { geojson, addFeature } = useGeoJSON()
    const t1 = moment('2024-01-01T10:00:00Z')
    const t2 = moment('2024-01-01T10:01:00Z')
    addFeature(32.1, 34.8, t1, 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    addFeature(32.2, 34.9, t2, 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    expect(geojson.value.features[1].properties.heading).toBeGreaterThanOrEqual(0)
    expect(geojson.value.features[1].properties.heading).toBeLessThan(360)
  })

  it('clearAll empties features', () => {
    const { geojson, addFeature, clearAll } = useGeoJSON()
    const t = moment()
    addFeature(32.1, 34.8, t, 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    clearAll()
    expect(geojson.value.features).toHaveLength(0)
  })

  it('removeGroup removes features by groupId', () => {
    const { geojson, addFeature, removeGroup } = useGeoJSON()
    const t = moment()
    addFeature(32.1, 34.8, t, 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    addFeature(32.2, 34.9, moment(t).add(60,'s'), 5, 1, false, 'GNSS', false, null, 12, 'NONE', null)
    removeGroup(1)
    expect(geojson.value.features.every(f => f.groupId !== 1)).toBe(true)
  })

  it('changeTrailTimes shifts all timestamps', () => {
    const { geojson, addFeature, changeTrailTimes } = useGeoJSON()
    const t = moment('2024-01-01T10:00:00Z')
    addFeature(32.1, 34.8, t, 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    addFeature(32.2, 34.9, moment(t).add(60,'s'), 5, 0, false, 'GNSS', false, null, 12, 'NONE', null)
    changeTrailTimes(moment('2024-06-01T10:00:00Z'))
    expect(geojson.value.features[0].properties.time.utc).toContain('2024-06-01')
  })
})
