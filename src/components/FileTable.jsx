import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from 'lucide-react'

// Main view: filterable, sortable table of every leaf entry.
// Sort by Name (lex) or Size (numeric); Type column also sorts lex by ext.
export default function FileTable({
  files,
  busyPath,
  selectedPath,
  onSelect,
  onDownloadFile
}) {
  const [sort, setSort] = useState({ key: 'path', dir: 'asc' })
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? files.filter((f) => f.path.toLowerCase().includes(q)) : files
    const { key, dir } = sort
    const mult = dir === 'asc' ? 1 : -1
    const cmp =
      key === 'size'
        ? (a, b) => (a.size - b.size) * mult
        : (a, b) => String(a[key]).localeCompare(String(b[key])) * mult
    return [...filtered].sort(cmp)
  }, [files, sort, query])

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const SortIcon = ({ col }) => {
    if (sort.key !== col) return <ArrowUpDown size={12} className="opacity-40" />
    return sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)]">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Filter files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-[var(--glass)] border border-[var(--line)] focus:border-[var(--fg-0)] outline-none transition-colors"
          />
        </div>
        <div className="text-xs opacity-60">
          {rows.length.toLocaleString()} of {files.length.toLocaleString()} files
        </div>
      </div>

      <div className="flex-1 overflow-auto scroll-area">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-[11px] uppercase tracking-[0.12em] opacity-70 bg-[var(--bg-0)]/80 backdrop-blur">
              <Th onClick={() => toggleSort('path')} className="pl-4">
                File name <SortIcon col="path" />
              </Th>
              <Th onClick={() => toggleSort('size')} className="w-32 text-right">
                Size <SortIcon col="size" />
              </Th>
              <Th onClick={() => toggleSort('type')} className="w-28">
                Type <SortIcon col="type" />
              </Th>
              <th className="w-12 pr-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const isSelected = selectedPath === f.path
              const isBusy = busyPath === f.path
              return (
                <tr
                  key={f.path}
                  onClick={() => onSelect(f.path)}
                  className={`group border-t border-[var(--line)] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[var(--glass)]' : 'hover:bg-[var(--glass)]'
                  }`}
                >
                  <td className="pl-4 py-2.5 truncate max-w-0">
                    <span className="material-symbols-rounded align-middle opacity-70 mr-2">
                      draft
                    </span>
                    <span title={f.path}>{f.path}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums opacity-80">{f.sizeLabel}</td>
                  <td className="py-2.5 opacity-70 uppercase text-[11px] tracking-wider">
                    {f.type}
                  </td>
                  <td className="pr-4 py-2 text-right">
                    <button
                      type="button"
                      className="icon-btn w-7 h-7 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownloadFile(f.path)
                      }}
                      title="Download this file"
                      disabled={isBusy}
                    >
                      <Download size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center opacity-60">
                  No files match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className = '', onClick }) {
  return (
    <th
      onClick={onClick}
      className={`py-3 pr-3 cursor-pointer select-none ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </th>
  )
}
