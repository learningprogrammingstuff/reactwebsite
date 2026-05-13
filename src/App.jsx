import { useCallback, useEffect, useState } from 'react'
import LiquidFilters from './components/LiquidFilters'
import TopBar from './components/TopBar'
import Dropzone from './components/Dropzone'
import FileTree from './components/FileTree'
import FileTable from './components/FileTable'
import ProgressBar from './components/ProgressBar'
import { useTheme } from './hooks/useTheme'
import { useSpecular } from './hooks/useSpecular'
import { asar } from './lib/workerBridge'
import { downloadBlob, formatBytes } from './lib/format'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()

  // Archive lifecycle state.
  const [archive, setArchive] = useState(null) // { fileName, tree, files, stats }
  const [progress, setProgress] = useState(null) // { stage, percent, label } | null
  const [error, setError] = useState(null)
  const [selectedPath, setSelectedPath] = useState(null)
  const [busyPath, setBusyPath] = useState(null)

  const sidebarRef = useSpecular()
  const mainRef = useSpecular()

  // Reset progress + error when archive swaps.
  useEffect(() => {
    if (archive) {
      setError(null)
      setProgress(null)
    }
  }, [archive])

  const loadFile = useCallback(async (file) => {
    setError(null)
    setProgress({ stage: 'parsing-header', percent: 5, label: file.name })
    try {
      const res = await asar.load(file, (p) => setProgress(p))
      setArchive({
        fileName: file.name,
        tree: res.tree,
        files: res.files,
        stats: res.stats
      })
      setSelectedPath(null)
      setProgress(null)
    } catch (e) {
      setError(e.message || String(e))
      setProgress(null)
    }
  }, [])

  const handleDownloadFile = useCallback(async (path) => {
    setBusyPath(path)
    try {
      const res = await asar.extractFile(path)
      downloadBlob(res.bytes, res.name)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusyPath(null)
    }
  }, [])

  const handleZipFolder = useCallback(async (path) => {
    setBusyPath(path)
    setProgress({ stage: 'zipping', percent: 0, label: path })
    try {
      const res = await asar.zipFolder(path, (p) => setProgress(p))
      downloadBlob(res.bytes, res.name)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusyPath(null)
      setProgress(null)
    }
  }, [])

  const handleZipAll = useCallback(async () => {
    setProgress({ stage: 'zipping', percent: 0, label: 'entire archive' })
    try {
      const res = await asar.zipAll((p) => setProgress(p))
      downloadBlob(res.bytes, res.name)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setProgress(null)
    }
  }, [])

  const reset = () => {
    setArchive(null)
    setSelectedPath(null)
    setError(null)
  }

  const isBusy = progress != null || busyPath != null

  return (
    <div className="h-full w-full flex flex-col text-[var(--fg-0)]">
      <LiquidFilters />
      <div className="aurora" />

      <TopBar
        fileName={archive?.fileName}
        fileCount={archive?.stats.fileCount}
        archiveSize={archive ? formatBytes(archive.stats.archiveSize) : null}
        isLoaded={!!archive}
        isBusy={isBusy}
        onDownloadAll={handleZipAll}
        onReset={reset}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {!archive ? (
        <Dropzone onFile={loadFile} error={error} />
      ) : (
        <div className="px-4 pb-4 pt-4 flex-1 min-h-0 grid gap-4 grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* Sidebar — recursive file tree */}
          <aside
            ref={sidebarRef}
            className="glass glass-specular animate-glass-in min-h-0 flex flex-col overflow-hidden"
          >
            <header className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-[var(--line)]">
              <div className="text-[11px] uppercase tracking-[0.14em] opacity-70">
                Files
              </div>
              <div className="text-[11px] opacity-60 tabular-nums">
                {archive.stats.fileCount}
              </div>
            </header>
            <div className="flex-1 min-h-0">
              <FileTree
                header={archive.tree}
                selectedPath={selectedPath}
                busyPath={busyPath}
                onSelect={setSelectedPath}
                onDownloadFile={handleDownloadFile}
                onZipFolder={handleZipFolder}
              />
            </div>
          </aside>

          {/* Main — sortable table */}
          <main
            ref={mainRef}
            className="glass glass-specular animate-glass-in min-h-0 flex flex-col overflow-hidden"
          >
            <FileTable
              files={archive.files}
              busyPath={busyPath}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              onDownloadFile={handleDownloadFile}
            />
          </main>
        </div>
      )}

      <ProgressBar
        stage={progress?.stage}
        percent={progress?.percent}
        label={progress?.label}
      />

      {error && archive && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-40 glass px-4 py-3 max-w-sm text-sm animate-glass-in"
        >
          <div className="font-medium mb-1">Something went wrong</div>
          <div className="opacity-80 break-words">{error}</div>
        </div>
      )}
    </div>
  )
}
