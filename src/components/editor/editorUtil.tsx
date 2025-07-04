// src/components/editor/editorUtil.ts

/**
 * Returns the number of visual (wrapped) lines for a given logical line
 * in a textarea, using robust character-based measuring.
 */
export function getVisualLines(line: string, textarea: HTMLTextAreaElement): number {
  if (!textarea) return 1
  const style = window.getComputedStyle(textarea)
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 1
  ctx.font = font
  const maxWidth = textarea.offsetWidth
  let lines = 1
  let currentLine = ''
  for (let ch of line) {
    const testLine = currentLine + ch
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth - 32) {
      lines++
      currentLine = ch
    } else {
      currentLine = testLine
    }
  }
  return lines
}
