export function formatBytes(n) {
  const b = Number(n)
  if (!isFinite(b)) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

export function downloadBlob(bytes, name) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
