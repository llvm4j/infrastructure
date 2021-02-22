export function normalize(path: string) {
  while (path.startsWith('/')) {
    path = path.substring(1)
  }
  while (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }
  return `${path}`
}