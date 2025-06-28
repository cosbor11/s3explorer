// src/contexts/s3/editor.ts

export function resetEditor(setters: {
  setOriginalContent: (v: string) => void
  setEditedContent: (v: string) => void
  setIsNewFile: (v: boolean) => void
  setNewFilePrefix: (v: string) => void
}) {
  setters.setOriginalContent('')
  setters.setEditedContent('')
  setters.setIsNewFile(false)
  setters.setNewFilePrefix('')
}
