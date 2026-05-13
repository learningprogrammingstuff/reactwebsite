// Promise-based wrapper around the ASAR Web Worker.
//
// Each request gets a unique id; the worker echoes the id back in every
// reply, so we can fan many concurrent operations through one worker and
// route the replies to the right caller. `onProgress` is invoked for every
// "progress" message that shares the id.

import AsarWorker from '../workers/asar.worker.js?worker'

let worker
let nextId = 1
const inflight = new Map() // id -> { resolve, reject, onProgress }

function ensureWorker() {
  if (worker) return worker
  worker = new AsarWorker()
  worker.onmessage = (e) => {
    const { id, type, message, ...rest } = e.data || {}
    const handler = inflight.get(id)
    if (!handler) return
    if (type === 'progress') {
      handler.onProgress?.(rest)
      return
    }
    if (type === 'error') {
      handler.reject(new Error(message))
      inflight.delete(id)
      return
    }
    handler.resolve({ type, ...rest })
    inflight.delete(id)
  }
  worker.onerror = (e) => {
    // Surface bootstrap errors (e.g. import failure) to every caller in
    // flight — otherwise they'd hang forever.
    for (const { reject } of inflight.values()) {
      reject(new Error(e.message || 'Worker crashed'))
    }
    inflight.clear()
  }
  return worker
}

function request(action, payload, { onProgress, transfer } = {}) {
  const w = ensureWorker()
  const id = nextId++
  return new Promise((resolve, reject) => {
    inflight.set(id, { resolve, reject, onProgress })
    w.postMessage({ id, action, payload }, transfer || [])
  })
}

export const asar = {
  load: (file, onProgress) => request('load', { file }, { onProgress }),
  extractFile: (path) => request('extract-file', { path }),
  zipFolder: (path, onProgress) => request('zip-folder', { path }, { onProgress }),
  zipAll: (onProgress) => request('zip-all', {}, { onProgress })
}
