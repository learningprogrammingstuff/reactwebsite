import { useMemo, useState } from 'react'
import { ChevronRight, Download, Archive } from 'lucide-react'

// Build the displayable tree once, then render with collapse state.
// We use Material Symbols Rounded for file/folder glyphs because the brief
// asks for "Material Icon" file tree — keeps the surface dense and on-brand.

function iconForFile(name) {
  const ext = name.toLowerCase().split('.').pop()
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'mjs':
    case 'cjs':  return 'code'
    case 'json': return 'data_object'
    case 'html': return 'html'
    case 'css':
    case 'scss': return 'style'
    case 'md':   return 'description'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':  return 'image'
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'ogg':  return 'music_note'
    case 'mp4':
    case 'mov':
    case 'mkv':  return 'movie'
    case 'zip':
    case 'tar':
    case 'gz':
    case 'asar': return 'folder_zip'
    case 'pdf':  return 'picture_as_pdf'
    case 'ttf':
    case 'otf':
    case 'woff':
    case 'woff2': return 'font_download'
    default:     return 'draft'
  }
}

function buildTree(header) {
  // The worker hands us the raw ASAR header object; convert it into a stable
  // sorted shape that's easier for React to memoise on.
  const visit = (node, path) => {
    if (!node?.files) return null
    const entries = Object.entries(node.files).map(([name, child]) => {
      const childPath = path ? `${path}/${name}` : name
      if (child.files) {
        return {
          kind: 'dir',
          name,
          path: childPath,
          children: visit(child, childPath)
        }
      }
      return {
        kind: 'file',
        name,
        path: childPath,
        size: child.size
      }
    })
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return entries
  }
  return visit(header, '') || []
}

function TreeNode({ node, depth, expanded, onToggle, onSelect, onDownloadFile, onZipFolder, selectedPath, busyPath }) {
  const isOpen = expanded.has(node.path)
  const isSelected = selectedPath === node.path
  const isBusy = busyPath === node.path

  if (node.kind === 'dir') {
    return (
      <li>
        <div
          className={`group flex items-center gap-1 rounded-lg px-1.5 py-1 cursor-pointer transition-colors ${
            isSelected ? 'bg-[var(--glass)]' : 'hover:bg-[var(--glass)]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => onToggle(node.path)}
        >
          <ChevronRight
            size={14}
            className={`opacity-60 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
          <span className="material-symbols-rounded opacity-80">
            {isOpen ? 'folder_open' : 'folder'}
          </span>
          <span className="text-sm truncate flex-1">{node.name}</span>
          <button
            type="button"
            className="icon-btn opacity-0 group-hover:opacity-100 w-6 h-6"
            onClick={(e) => {
              e.stopPropagation()
              onZipFolder(node.path)
            }}
            title="Zip and download this folder"
            disabled={isBusy}
          >
            <Archive size={13} />
          </button>
        </div>
        {isOpen && node.children?.length > 0 && (
          <ul>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                onDownloadFile={onDownloadFile}
                onZipFolder={onZipFolder}
                selectedPath={selectedPath}
                busyPath={busyPath}
              />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <div
        className={`group flex items-center gap-1 rounded-lg px-1.5 py-1 cursor-pointer transition-colors ${
          isSelected ? 'bg-[var(--glass)]' : 'hover:bg-[var(--glass)]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 18}px` }}
        onClick={() => onSelect(node.path)}
      >
        <span className="material-symbols-rounded opacity-70">{iconForFile(node.name)}</span>
        <span className="text-sm truncate flex-1">{node.name}</span>
        <button
          type="button"
          className="icon-btn opacity-0 group-hover:opacity-100 w-6 h-6"
          onClick={(e) => {
            e.stopPropagation()
            onDownloadFile(node.path)
          }}
          title="Download this file"
          disabled={isBusy}
        >
          <Download size={13} />
        </button>
      </div>
    </li>
  )
}

export default function FileTree({
  header,
  selectedPath,
  busyPath,
  onSelect,
  onDownloadFile,
  onZipFolder
}) {
  const tree = useMemo(() => buildTree(header), [header])
  const [expanded, setExpanded] = useState(() => {
    // Auto-expand the root level so the user always sees something.
    const init = new Set([''])
    tree.forEach((n) => n.kind === 'dir' && init.add(n.path))
    return init
  })

  const toggle = (path) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  return (
    <nav className="h-full overflow-auto scroll-area py-2 px-1">
      <ul>
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            onSelect={onSelect}
            onDownloadFile={onDownloadFile}
            onZipFolder={onZipFolder}
            selectedPath={selectedPath}
            busyPath={busyPath}
          />
        ))}
      </ul>
    </nav>
  )
}
