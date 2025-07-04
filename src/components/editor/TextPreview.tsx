// src/components/editor/TextPreview.tsx
import React from 'react';
import { useS3 } from '@/contexts/s3';
import MarkdownShadow from './MarkdownShadow';
import { X } from 'lucide-react';

interface Props {
  onEdit: () => void;
}

const TextPreview: React.FC<Props> = ({ onEdit }) => {
  const { selectedFile, editedContent, currentPrefix, openPrefix } = useS3();

  const handleClose = () => {
    openPrefix(currentPrefix);
  };

  if (!selectedFile || editedContent === null || editedContent === undefined) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
          <span className="text-gray-400">Preview</span>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
            >
              Edit
            </button>
            <button
              onClick={handleClose}
              className="px-1 py-0.5 bg-[#232323] cursor-pointer hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs flex items-center"
              title="Close file"
              aria-label="Close file"
              tabIndex={0}
              type="button"
            >
              <X className="w-3 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4">
          <p>No content to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-1 text-xs bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between">
        <span className="text-gray-400">Preview</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="px-2 py-0.5 bg-[#232323] hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs"
          >
            Edit raw
          </button>
          <button
            onClick={handleClose}
            className="px-1 py-0.5 bg-[#232323] cursor-pointer hover:bg-[#2e2e2e] border border-[#3a3a3a] rounded text-gray-200 text-xs flex items-center"
            title="Close file"
            aria-label="Close file"
            tabIndex={0}
            type="button"
          >
            <X className="w-3 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4" style={{ height: '100%' }}>
        <MarkdownShadow content={editedContent} />
      </div>
    </div>
  );
};

export default TextPreview;
