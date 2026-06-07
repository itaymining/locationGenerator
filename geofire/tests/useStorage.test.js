import { describe, it, expect, beforeEach } from 'vitest'
import { useStorage } from '../src/composables/useStorage.js'

describe('useStorage', () => {
  beforeEach(() => localStorage.clear())

  it('loadConfig returns defaults when nothing stored', () => {
    const { loadConfig } = useStorage()
    const cfg = loadConfig()
    expect(cfg.endpointUrl).toBe('')
    expect(cfg.headers).toEqual([])
    expect(cfg.defaultCustomProps).toEqual([])
  })

  it('saveConfig and loadConfig roundtrip', () => {
    const { saveConfig, loadConfig } = useStorage()
    saveConfig({ endpointUrl: 'http://test.com', headers: [{ key: 'X-Token', value: 'abc' }], defaultCustomProps: [] })
    const cfg = loadConfig()
    expect(cfg.endpointUrl).toBe('http://test.com')
    expect(cfg.headers[0].key).toBe('X-Token')
  })

  it('saveSession and loadSessions roundtrip', () => {
    const { saveSession, loadSessions } = useStorage()
    saveSession('trail-1', { type: 'FeatureCollection', features: [] }, { endpointUrl: 'http://x.com', headers: [], defaultCustomProps: [] })
    const sessions = loadSessions()
    expect(sessions['trail-1']).toBeDefined()
    expect(sessions['trail-1'].geojson.type).toBe('FeatureCollection')
  })

  it('deleteSession removes entry', () => {
    const { saveSession, deleteSession, loadSessions } = useStorage()
    saveSession('to-delete', { type: 'FeatureCollection', features: [] }, { endpointUrl: '', headers: [], defaultCustomProps: [] })
    deleteSession('to-delete')
    expect(loadSessions()['to-delete']).toBeUndefined()
  })
})
