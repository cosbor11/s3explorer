// src/contexts/s3/types.ts
import { MouseEvent } from 'react'

export interface S3Node {
  name: string
  fullKey: string
  isDir: boolean
}

export type MenuType =
  | 'bucket'
  | 'folder'
  | 'file'
  | 'multiselect'
  | 'emptySidebar'
  | 'emptyTree'

export interface MenuState {
  visible: boolean
  x: number
  y: number
  type: MenuType
  target?: string
  node?: S3Node
}

export interface S3ContextState {
  /* data */
  buckets: string[]
  tree: S3Node[] | null
  selectedBucket: string | null
  breadcrumb: string[]
  currentPrefix: string
  selectedFile: S3Node | null
  originalContent: string
  editedContent: string
  isNewFile: boolean
  newFilePrefix: string
  wrap: boolean
  loading: boolean
  error: string | null
  dirty: boolean
  menu: MenuState

  /* actions */
  fetchBuckets(): void
  openPrefix(prefix: string): void
  openFile(n: S3Node): void
  startNewFile(prefix: string): void
  setWrap(v: boolean): void
  setEditedContent(v: string): void
  saveFile(): Promise<boolean>
  refreshCurrent(): void
  selectBucket(bucket: string | null): void
  deleteFolder(n: S3Node): Promise<void>
  deleteFile(n: S3Node): Promise<void>
  setTree(tree: S3Node[]): void

  /* core file ops */
  uploadFiles(prefix: string, files: FileList): Promise<void>
  downloadNode(node: S3Node): void
  renameNode(node: S3Node, newName: string): Promise<void>
  createBucket(): Promise<void>
  deleteBucket(b: string): Promise<void>
  createFolder(prefix: string): Promise<void>

  /* menu */
  openMenu(e: MouseEvent, type: MenuType, node?: S3Node, target?: string): void
  closeMenu(): void
  setError(v: string | null): void
}
