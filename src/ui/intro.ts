const key = (levelId: number) => `sandbox.introSeen.${levelId}`

/** Whether a level's walkthrough has been dismissed before. Storage may be unavailable; default to showing it. */
export function introSeen(levelId: number): boolean {
  try {
    return localStorage.getItem(key(levelId)) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen(levelId: number) {
  try {
    localStorage.setItem(key(levelId), '1')
  } catch {
    /* ignore */
  }
}
