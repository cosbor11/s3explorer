// src/contexts/s3/menu.ts
import { MouseEvent } from 'react'
import { MenuType, S3Node } from './types'

export function openMenu(
  setMenu: any,
  e: MouseEvent,
  type: MenuType,
  node?: S3Node,
  target?: string
) {
  e.preventDefault()
  setMenu({
    visible: true,
    x: e.clientX,
    y: e.clientY,
    type,
    node,
    target,
  })
}

export function closeMenu(setMenu: any) {
  setMenu((m: any) => ({ ...m, visible: false }))
}
