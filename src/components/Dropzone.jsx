import { useCallback, useRef, useState } from 'react'
import { UploadCloud, FileArchive } from 'lucide-react'
import { useSpecular } from '../hooks/useSpecular'

// Drag-and-drop entry point. Refraction is bumped while dragging over
// (via the `-strong` filter) so the panel literally bends light harder.
export default function Dropzone({ onFile, error }) {
  const [hover, setHover] = useState(false)
  const fileInput = useRef(null)
  const specularRef = useSpecular()

  const accept = useCallback(
    (file) => {
      if (!file) return
      // ASAR is a custom format; some browsers report empty MIME. Be lenient
      // and let the worker decide if the magic doesn't match.
      if (file.name && !file.name.toLowerCase().endsWith('.asar')) {
        const ok = window.confirm(
          `"${file.name}" doesn't end in .asar. Try to parse it anyway?`
        )
        if (!ok) return
      }
      onFile(file)
    },
    [onFile]
  )

  const onDrop = (e) => {
    e.preventDefault()
    setHover(false)
    const f = e.dataTransfer.files?.[0]
    accept(f)
  }

  return (
    <div className="px-4 pb-4 flex-1 min-h-0 flex items-center justify-center">
      <label
        ref={specularRef}
        onDragOver={(e) => {
          e.preventDefault()
          setHover(true)
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        className={`glass glass-specular w-full max-w-2xl block cursor-pointer animate-glass-in transition-all duration-300 ${
          hover ? 'dropzone-halo scale-[1.01]' : ''
        }`}
        style={{
          padding: '3rem 2rem',
          backdropFilter: hover
            ? 'blur(60px) saturate(220%) url(#liquid-refraction-strong)'
            : 'blur(50px) saturate(180%) url(#liquid-refraction)'
        }}
      >
        <input
          ref={fileInput}
          type="file"
          accept=".asar"
          className="sr-only"
          onChange={(e) => accept(e.target.files?.[0])}
        />

        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-transform ${
              hover ? 'animate-drop-pulse' : ''
            }`}
            style={{
              background:
                'conic-gradient(from 210deg at 50% 50%, #9aa0ff, #ffb0c8, #ffd28a, #9aa0ff)'
            }}
          >
            {hover ? (
              <FileArchive size={34} className="text-white" strokeWidth={2} />
            ) : (
              <UploadCloud size={34} className="text-white" strokeWidth={2} />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {hover ? 'Release to parse' : 'Drop your .asar archive here'}
            </h2>
            <p className="text-sm opacity-70 max-w-md">
              Everything happens in your browser — files never leave your device.
              Supports archives up to about 2 GB.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault()
                fileInput.current?.click()
              }}
            >
              <UploadCloud size={15} strokeWidth={2.25} />
              Choose file
            </button>
            <span className="text-xs opacity-60">or drag &amp; drop</span>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-500/90 dark:text-red-400/90">
              {error}
            </div>
          )}
        </div>
      </label>
    </div>
  )
}
