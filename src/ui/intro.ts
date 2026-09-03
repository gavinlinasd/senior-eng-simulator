const KEY = 'sandbox.introSeen'

/** Whether the first-run intro has been dismissed before. Storage may be unavailable; default to showing it. */
export function introSeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* ignore */
  }
}
