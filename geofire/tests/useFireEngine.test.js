import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFireEngine } from '../src/composables/useFireEngine.js'

function makeFeature(utc, lat = 32.1, lng = 34.8) {
  return {
    groupId: 0,
    leaflet_id: 1,
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lat, lng] },
    properties: {
      time: { utc, tz: 'UTC' },
      speedKMH: 5, heading: 45, locationMethod: 'GNSS', accuracy: 12,
      customProps: { myKey: 'myVal' },
    },
  }
}

describe('useFireEngine - cleanFeature', () => {
  it('strips leaflet_id and groupId', () => {
    const { cleanFeature } = useFireEngine()
    const f = makeFeature('2024-01-01T10:00:00Z')
    const clean = cleanFeature(f, [], [])
    expect(clean.leaflet_id).toBeUndefined()
    expect(clean.groupId).toBeUndefined()
  })

  it('merges defaultCustomProps flat into properties', () => {
    const { cleanFeature } = useFireEngine()
    const f = makeFeature('2024-01-01T10:00:00Z')
    const defaultProps = [{ key: 'source', value: 'geofire' }]
    const clean = cleanFeature(f, defaultProps, [])
    expect(clean.properties.source).toBe('geofire')
    expect(clean.properties.customProps).toBeUndefined()
  })

  it('per-point customProps override default', () => {
    const { cleanFeature } = useFireEngine()
    const f = makeFeature('2024-01-01T10:00:00Z')
    f.properties.customProps = { source: 'override' }
    const defaultProps = [{ key: 'source', value: 'default' }]
    const clean = cleanFeature(f, defaultProps, [])
    expect(clean.properties.source).toBe('override')
  })

  it('headersToObject converts array to object', () => {
    const { headersToObject } = useFireEngine()
    const headers = [{ key: 'Authorization', value: 'Bearer abc' }, { key: 'X-Test', value: '1' }]
    const obj = headersToObject(headers)
    expect(obj['Authorization']).toBe('Bearer abc')
    expect(obj['X-Test']).toBe('1')
  })
})
