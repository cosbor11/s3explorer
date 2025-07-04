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

export type SearchMode = 'begins' | 'contains' | 'content'

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

  /* paging */
  pageSize: number
  setPageSize(size: number): void
  continuationToken: string | null
  hasMore: boolean
  currentPage: number
  nextPage(): void
  prevPage(): void

  /* search state */
  search: string
  setSearch(s: string): void
  searchMode: SearchMode
  setSearchMode(mode: SearchMode): void
  allLoaded: boolean
  lastRemoteSearch: string
  setLastRemoteSearch(s: string): void
  doRemoteSearch: (search: string, mode: SearchMode) => void

  /* actions */
  fetchBuckets(): void
  openPrefix(prefix: string, contToken?: string | null, customPageSize?: number | null, replacePrevStack?: boolean): void
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
