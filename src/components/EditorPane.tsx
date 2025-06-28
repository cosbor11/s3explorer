// src/components/EditorPane.tsx   (orchestrator)
'use client'

import { JSX, useState } from 'react'
import { useS3 } from '@/contexts/s3'
import ImageViewer from './editor/ImageViewer'
import CsvViewer from './editor/CsvViewer'
import TextPreview from './editor/TextPreview'
import RawEditor from './editor/RawEditor'

const CSV_EXT = ['csv', 'tsv']

export default function EditorPane() {
  const { selectedFile, isNewFile } = useS3()
  const [mode, setMode] = useState<'preview' | 'raw'>('preview')

  if (!selectedFile && !isNewFile) return null

  const ext = selectedFile?.name.split('.').pop()?.toLowerCase()
  let content: JSX.Element

  if (!isNewFile && ext && CSV_EXT.includes(ext) && mode === 'preview')
    content = <CsvViewer onEdit={() => setMode('raw')} />
  else if (
    !isNewFile &&
    (ext === 'md' || ext === 'markdown' || ext === 'json') &&
    mode === 'preview'
  )
    content = <TextPreview onEdit={() => setMode('raw')} />
  else if (!isNewFile && ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext))
    content = <ImageViewer />
  else
    content = <RawEditor onPreview={() => setMode('preview')} />

  return (
    <div className="flex-1 flex flex-col h-full">{content}</div>
  )
}
