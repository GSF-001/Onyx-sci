"use client"

import * as React from "react"
import { File, Loader2, UploadCloud, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type FileUploadItem = {
  file: File
  id: string
  progress?: number
  error?: string
}

export type FileUploadProps = {
  value?: FileUploadItem[]
  onChange?: (items: FileUploadItem[]) => void
  onFilesAdded?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeBytes?: number
  disabled?: boolean
  className?: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      value,
      onChange,
      onFilesAdded,
      accept,
      multiple = true,
      maxFiles,
      maxSizeBytes,
      disabled = false,
      className,
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalItems, setInternalItems] = React.useState<
      FileUploadItem[]
    >([])
    const items = isControlled ? (value as FileUploadItem[]) : internalItems

    const [isDragging, setIsDragging] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const setItems = (next: FileUploadItem[]) => {
      if (!isControlled) setInternalItems(next)
      onChange?.(next)
    }

    const validateFile = (file: File): string | undefined => {
      if (maxSizeBytes && file.size > maxSizeBytes) {
        return `File exceeds ${formatBytes(maxSizeBytes)} limit`
      }
      return undefined
    }

    const addFiles = (fileList: FileList | File[]) => {
      if (disabled) return

      const incoming = Array.from(fileList)
      const availableSlots = maxFiles
        ? Math.max(maxFiles - items.length, 0)
        : incoming.length
      const accepted = incoming.slice(0, availableSlots)

      if (accepted.length === 0) return

      const newItems: FileUploadItem[] = accepted.map((file) => ({
        file,
        id: createId(),
        error: validateFile(file),
      }))

      setItems([...items, ...newItems])
      onFilesAdded?.(accepted)
    }

    const removeItem = (id: string) => {
      setItems(items.filter((item) => item.id !== id))
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files)
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files)
      }
      e.target.value = ""
    }

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          aria-disabled={disabled}
          className={cn(
            "border-input flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            isDragging && "border-primary bg-primary/5",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "hover:border-primary/50 hover:bg-accent/30 cursor-pointer"
          )}
        >
          <UploadCloud className="text-muted-foreground h-8 w-8" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">
              Drag & drop {multiple ? "files" : "a file"} here, or click to
              browse
            </p>
            {(accept || maxSizeBytes) && (
              <p className="text-muted-foreground text-xs">
                {accept && `${accept} `}
                {maxSizeBytes && `Up to ${formatBytes(maxSizeBytes)}`}
              </p>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "border-input flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                  item.error && "border-destructive/50 bg-destructive/5"
                )}
              >
                <File className="text-muted-foreground h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {item.file.name}
                  </span>
                  {item.error ? (
                    <span className="text-destructive text-xs">
                      {item.error}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {formatBytes(item.file.size)}
                    </span>
                  )}
                  {typeof item.progress === "number" &&
                    item.progress < 100 &&
                    !item.error && (
                      <div className="bg-muted mt-1 h-1 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                </div>
                {typeof item.progress === "number" &&
                item.progress < 100 &&
                !item.error ? (
                  <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload }
