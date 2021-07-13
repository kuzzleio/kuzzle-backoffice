export function getPersistedItem(item: string) {
  return localStorage.getItem(item)
}

export function setPersistedItem(item: string, value: string) {
  localStorage.setItem(item, value)
}
