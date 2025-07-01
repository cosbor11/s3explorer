import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownShadowProps {
  content: string;
}

const MarkdownShadow = ({ content }: MarkdownShadowProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Check if shadow root already exists
      let shadow = containerRef.current.shadowRoot;
      if (!shadow) {
        // Attach shadow root only if it doesn't exist
        shadow = containerRef.current.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
          /* Your styles here, e.g. */
          .markdown-content { font-family: Arial, sans-serif; }
        `;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-content';
        shadow.appendChild(style);
        shadow.appendChild(contentDiv);
      }

      // Update content
      const contentDiv = shadow.querySelector('.markdown-content') as HTMLDivElement;
      if (contentDiv) {
        const html = marked(content);
        const cleanHtml = DOMPurify.sanitize(html as string);
        contentDiv.innerHTML = cleanHtml;
      }
    }
  }, [content]); // Runs when content changes

  return <div ref={containerRef} />;
};

export default MarkdownShadow
