// src/components/Tooltip.tsx
'use client'

import { useState, ReactNode } from 'react'

export default function Tooltip({
  label,
  children,
  className = '',
  placement = 'top', // new prop!
}: {
  label: string
  children: ReactNode
  className?: string
  placement?: 'top' | 'bottom' | 'bottom-right'
}) {
  const [show, setShow] = useState(false)
  let placementClass = ''
  if (placement === 'top') placementClass = 'bottom-full left-1/2 -translate-x-1/2 mb-1'
  if (placement === 'bottom') placementClass = 'top-full left-1/2 -translate-x-1/2 mt-1'
  if (placement === 'bottom-right') placementClass = 'top-full right-0 mt-1'

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={`absolute whitespace-nowrap px-2 py-1 text-xs text-gray-200 bg-[rgba(0,0,0,0.85)] rounded shadow-lg z-50 ${placementClass}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
