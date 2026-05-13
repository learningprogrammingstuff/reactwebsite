import { Download, Moon, Sun, Package } from 'lucide-react'
import { useSpecular } from '../hooks/useSpecular'

// The hero of the design system: a floating glass bar with a real SVG
// refraction filter on its backdrop. Background content scrolling beneath
// gets visibly bent + magnified by the displacement map.
export default function TopBar({
  fileName,
  fileCount,
  archiveSize,
  isLoaded,
  isBusy,
  onDownloadAll,
  onReset,
  theme,
  onToggleTheme
}) {
  const specularRef = useSpecular()

  return (
    <div className="px-4 pt-4 sticky top-0 z-30">
      <div
        ref={specularRef}
        className="glass glass-specular refract-bar flex items-center gap-3 px-4 py-3 animate-glass-in"
      >
        <div className="flex items-center gap-2 mr-1">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{
              background:
                'conic-gradient(from 210deg at 50% 50%, #9aa0ff, #ffb0c8, #ffd28a, #9aa0ff)'
            }}
          >
            <Package size={18} strokeWidth={2.25} className="text-white drop-shadow" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Liquid Glass</div>
            <div className="text-[11px] uppercase tracking-[0.14em] opacity-60">
              ASAR Extractor
            </div>
          </div>
        </div>

        {isLoaded && (
          <div className="hidden md:flex items-center gap-3 px-3 ml-2 pl-4 border-l border-[var(--line)] min-w-0">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate max-w-[28ch]" title={fileName}>
                {fileName}
              </div>
              <div className="text-[11px] opacity-60">
                {fileCount} files · {archiveSize}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1" />

        <button
          type="button"
          className="icon-btn"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {isLoaded && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            disabled={isBusy}
          >
            New archive
          </button>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={onDownloadAll}
          disabled={!isLoaded || isBusy}
          title="Zip and download every file in the archive"
        >
          <Download size={15} strokeWidth={2.25} />
          Download Entire Package
        </button>
      </div>
    </div>
  )
}
