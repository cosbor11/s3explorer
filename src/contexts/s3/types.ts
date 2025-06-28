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

  fetchBuckets(): void
  openPrefix(prefix: string): void
  openFile(n: S3Node): void
  startNewFile(prefix: string): void
  setWrap(v: boolean): void
  setEditedContent(v: string): void
  saveFile(): Promise<void>
  createBucket(): Promise<void>
  deleteBucket(b: string): Promise<void>
  createFolder(prefix: string): Promise<void>
  deleteFolder(n: S3Node): Promise<void>
  deleteFile(n: S3Node): Promise<void>
  selectBucket(b: string | null): void
  setError(v: string | null): void
  refreshCurrent(): void 

  openMenu(e: MouseEvent, type: MenuType, node?: S3Node, target?: string): void
  closeMenu(): void
}
