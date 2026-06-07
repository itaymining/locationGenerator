const CONFIG_KEY = 'geofire_config'
const SESSIONS_KEY = 'geofire_sessions'

const defaultConfig = () => ({
  endpointUrl: '',
  headers: [],
  defaultCustomProps: [],
})

export function useStorage() {
  function loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY)
      return raw ? { ...defaultConfig(), ...JSON.parse(raw) } : defaultConfig()
    } catch {
      return defaultConfig()
    }
  }

  function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  }

  function loadSessions() {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function saveSession(name, geojson, config) {
    const sessions = loadSessions()
    sessions[name] = { savedAt: new Date().toISOString(), geojson, config }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  }

  function deleteSession(name) {
    const sessions = loadSessions()
    delete sessions[name]
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  }

  return { loadConfig, saveConfig, loadSessions, saveSession, deleteSession }
}
