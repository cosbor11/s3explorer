import React, { useState, useEffect } from 'react';
import { useS3 } from '@/contexts/s3';
import { marked } from 'marked';

interface Props {
  onEdit: () => void;
}

const TextPreview: React.FC<Props> = ({ onEdit }) => {
  const { selectedFile, editedContent } = useS3();
  const [iframeContent, setIframeContent] = useState<string>('');

  useEffect(() => {
    if (selectedFile && editedContent !== null && editedContent !== undefined) {
      try {
        const html = marked(editedContent);
        const styledHtml = `
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
        `;
        setIframeContent(styledHtml);
      } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        setIframeContent('<p>Error rendering content</p>');
      }
    } else {
      setIframeContent('<p>No content to preview</p>');
    }
  }, [selectedFile, editedContent]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">Preview</span>
        <button
          onClick={onEdit}
          className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
        >
          Edit raw
        </button>
      </div>
      {/* Iframe for markdown content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
        <iframe
          srcDoc={iframeContent}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
};

export default TextPreview;