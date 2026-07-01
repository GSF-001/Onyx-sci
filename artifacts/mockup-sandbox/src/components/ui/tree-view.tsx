"use client"

import * as React from "react"
import { ChevronRight, File, Folder } from "lucide-react"

import { cn } from "@/lib/utils"

export type TreeNode = {
  id: string
  label: string
  icon?: React.ReactNode
  children?: TreeNode[]
  disabled?: boolean
}

export type TreeViewProps = {
  data: TreeNode[]
  selectedId?: string
  onSelect?: (node: TreeNode) => void
  defaultExpandedIds?: string[]
  className?: string
}

function TreeView({
  data,
  selectedId,
  onSelect,
  defaultExpandedIds = [],
  className,
}: TreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(defaultExpandedIds)
  )

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div role="tree" className={cn("flex flex-col text-sm", className)}>
      {data.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function TreeNodeItem({
  node,
  depth,
  expanded,
  onToggle,
  selectedId,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  selectedId?: string
  onSelect?: (node: TreeNode) => void
}) {
  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id

  const handleClick = () => {
    if (node.disabled) return
    if (hasChildren) onToggle(node.id)
    onSelect?.(node)
  }

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
        className={cn(
          "group flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-md pr-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground font-medium",
          node.disabled && "pointer-events-none opacity-50"
        )}
      >
        <ChevronRight
          className={cn(
            "text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform duration-150",
            hasChildren ? "opacity-100" : "opacity-0",
            isExpanded && "rotate-90"
          )}
        />
        <span className="text-muted-foreground flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
          {node.icon ??
            (hasChildren ? (
              <Folder className="fill-muted-foreground/20" />
            ) : (
              <File />
            ))}
        </span>
        <span className="truncate">{node.label}</span>
      </div>

      {hasChildren && isExpanded && (
        <div role="group">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { TreeView }
