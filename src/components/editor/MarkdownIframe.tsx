'use client'

import { useState, useEffect } from 'react'
import { marked } from 'marked'

interface Props {
  markdownContent: string
}

export default function MarkdownIframe({ markdownContent }: Props) {
  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    if (markdownContent) {
      // Convert markdown to HTML
      const html = marked(markdownContent)
      // Wrap HTML with styles to isolate it from global CSS
      const styledHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                margin: 0;
                background-color: #1e1e1e;
                color: #ffffff;
              }
              h1, h2, h3 {
                color: #ffffff;
              }
              p {
                line-height: 1.6;
              }
              code {
                background-color: #2d2d2d;
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
              }
              pre {
                background-color: #2d2d2d;
                padding: 1rem;
                border-radius: 4px;
                overflow-x: auto;
              }
              a {
                color: #1e90ff;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              ul, ol {
                padding-left: 20px;
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `
      setHtmlContent(styledHtml)
    }
  }, [markdownContent])

  return (
    <iframe
      srcDoc={htmlContent}
      style={{ width: '100%', height: '100%', border: 'none' }}
      sandbox="allow-same-origin"
    />
  )
}