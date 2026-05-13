// ──────────────────────────────────────────────────────────────────────────
// asar.worker.js
// Off-main-thread ASAR archive parser + on-demand extractor.
//
// ASAR layout (Electron's Pickle wire format, all uint32 little-endian):
//   bytes 0..3   : size of pickle #1 payload (always 4)
//   bytes 4..7   : payload of pickle #1 = size of pickle #2 (incl. its size field)
//   bytes 8..11  : payload size of pickle #2 (= 4 + len(json) padded to 4)
//   bytes 12..15 : length of the JSON header string
//   bytes 16..N  : UTF-8 JSON header
//   bytes N..    : file data, indexed by header entries (offsets are strings
//                  because they can exceed 2^53; we use BigInt for safety).
// ──────────────────────────────────────────────────────────────────────────

import JSZip from 'jszip'

// File-scoped state for the currently-loaded archive.
let currentFile = null      // the File/Blob backing the archive
let currentHeader = null    // parsed JSON header
let dataOffset = 0n         // BigInt offset where file payloads begin

// ─── helpers ──────────────────────────────────────────────────────────────

function post(type, payload, transfer) {
  if (transfer) self.postMessage({ type, ...payload }, transfer)
  else self.postMessage({ type, ...payload })
}

async function readSlice(start, end) {
  // Blob.slice + arrayBuffer keeps memory bounded: only the requested chunk
  // is decoded into a typed array, even for 2 GB archives.
  const buf = await currentFile.slice(Number(start), Number(end)).arrayBuffer()
  return new Uint8Array(buf)
}

function formatBytes(n) {
  const b = Number(n)
  if (b < 1024) return `${b} B`
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

function inferType(name) {
  const i = name.lastIndexOf('.')
  if (i === -1) return 'file'
  return name.slice(i + 1).toLowerCase()
}

// ─── header parsing ───────────────────────────────────────────────────────

async function parseHeader(file) {
  // First read a small prefix so we can learn how big the header is.
  const prefix = await readSlice(0, 16)
  if (prefix.byteLength < 16) throw new Error('File is too small to be an ASAR archive.')

  const view = new DataView(prefix.buffer)
  const pickle1Size = view.getUint32(0, true)
  if (pickle1Size !== 4) {
    throw new Error(`Bad ASAR magic: expected pickle size 4, got ${pickle1Size}`)
  }
  const headerPickleSize = view.getUint32(4, true)    // size of pickle #2 incl. its size prefix
  const jsonPayloadSize  = view.getUint32(8, true)    // size of pickle #2 payload
  const jsonLength       = view.getUint32(12, true)   // actual JSON length

  // Header data starts at offset 16 and runs for jsonLength bytes (then padding).
  const headerEnd = 16 + jsonPayloadSize - 4          // start-of-padding offset
  const jsonBytes = await readSlice(16, 16 + jsonLength)
  const jsonText  = new TextDecoder('utf-8').decode(jsonBytes)

  let header
  try {
    header = JSON.parse(jsonText)
  } catch (e) {
    throw new Error('ASAR header is not valid JSON: ' + e.message)
  }

  // Data section follows the entire header pickle (16 bytes of prefixes + padded payload).
  const computedDataOffset = BigInt(8 + headerPickleSize)
  return { header, dataOffset: computedDataOffset, headerEnd }
}

// ─── tree flattening ──────────────────────────────────────────────────────

function walkFiles(node, prefix, out) {
  if (!node || !node.files) return
  for (const [name, child] of Object.entries(node.files)) {
    const path = prefix ? `${prefix}/${name}` : name
    if (child.files) {
      walkFiles(child, path, out)
    } else if (typeof child.size === 'number') {
      out.push({
        path,
        name,
        size: child.size,
        offset: child.offset ? BigInt(child.offset) : 0n,
        unpacked: !!child.unpacked,
        executable: !!child.executable,
        type: inferType(name)
      })
    }
  }
}

function flatten(header) {
  const files = []
  walkFiles(header, '', files)
  return files
}

// ─── extraction primitives ────────────────────────────────────────────────

async function extractOne(entry) {
  // Streamed slice: no full-archive buffer in memory.
  const start = dataOffset + entry.offset
  const end   = start + BigInt(entry.size)
  return readSlice(start, end)
}

function findNode(path) {
  // Walk the header JSON, treating "/" segments as folder hops.
  const parts = path.split('/').filter(Boolean)
  let node = currentHeader
  for (const part of parts) {
    if (!node.files || !node.files[part]) return null
    node = node.files[part]
  }
  return node
}

async function collectFolder(folderPath) {
  // Gather every leaf entry under a folder prefix so we can zip them up.
  const node = findNode(folderPath)
  if (!node || !node.files) return []
  const collected = []
  walkFiles(node, folderPath, collected)
  return collected
}

async function zipEntries(entries, onProgress) {
  const zip = new JSZip()
  let done = 0
  for (const entry of entries) {
    const bytes = await extractOne(entry)
    zip.file(entry.path, bytes)
    done++
    onProgress?.(done, entries.length, entry.path)
  }
  return zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => onProgress?.(entries.length, entries.length, `zipping ${meta.percent.toFixed(0)}%`, meta.percent)
  )
}

// ─── message dispatch ─────────────────────────────────────────────────────

self.onmessage = async (event) => {
  const { id, action, payload } = event.data

  try {
    switch (action) {
      case 'load': {
        currentFile = payload.file
        post('progress', { id, stage: 'parsing-header', percent: 5 })
        const { header, dataOffset: off } = await parseHeader(currentFile)
        currentHeader = header
        dataOffset = off
        const files = flatten(header)
        post('loaded', {
          id,
          tree: header,
          files: files.map((f) => ({
            path: f.path,
            name: f.name,
            size: f.size,
            sizeLabel: formatBytes(f.size),
            type: f.type,
            unpacked: f.unpacked,
            executable: f.executable
          })),
          stats: {
            fileCount: files.length,
            totalSize: files.reduce((s, f) => s + f.size, 0),
            archiveSize: currentFile.size,
            dataOffset: dataOffset.toString()
          }
        })
        break
      }

      case 'extract-file': {
        const node = findNode(payload.path)
        if (!node || node.files) throw new Error(`Not a file: ${payload.path}`)
        const entry = {
          path: payload.path,
          name: payload.path.split('/').pop(),
          size: node.size,
          offset: BigInt(node.offset || '0')
        }
        const bytes = await extractOne(entry)
        post('file-ready', { id, path: entry.path, name: entry.name, bytes: bytes.buffer }, [bytes.buffer])
        break
      }

      case 'zip-folder': {
        const entries = await collectFolder(payload.path)
        if (entries.length === 0) throw new Error(`Folder is empty or missing: ${payload.path}`)
        const blob = await zipEntries(entries, (done, total, label, percent) => {
          post('progress', {
            id,
            stage: 'zipping',
            percent: percent ?? Math.round((done / total) * 100),
            label
          })
        })
        const buf = await blob.arrayBuffer()
        const safeName = (payload.path.split('/').pop() || 'folder') + '.zip'
        post('zip-ready', { id, name: safeName, bytes: buf }, [buf])
        break
      }

      case 'zip-all': {
        const entries = flatten(currentHeader)
        const blob = await zipEntries(entries, (done, total, label, percent) => {
          post('progress', {
            id,
            stage: 'zipping',
            percent: percent ?? Math.round((done / total) * 100),
            label
          })
        })
        const buf = await blob.arrayBuffer()
        post('zip-ready', { id, name: 'asar-contents.zip', bytes: buf }, [buf])
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (err) {
    post('error', { id, message: err?.message || String(err) })
  }
}
