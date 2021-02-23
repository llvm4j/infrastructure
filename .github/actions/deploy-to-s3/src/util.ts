export function normalize(path: string) {
  while (path.startsWith('/')) {
    path = path.substring(1)
  }
  while (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }
  // Append a slash because fast-glob doesn't include one
  return `${path}/`
}