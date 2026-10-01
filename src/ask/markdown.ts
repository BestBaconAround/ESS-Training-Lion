export interface MarkdownSection {
  title: string
  text: string
}

/**
 * Splits a markdown file into sections at headings (#, ##, ###). Text before the first heading becomes a section
 * titled with the file name. Empty sections are dropped. This is how information dropped into
 * src/content/reference/*.md becomes searchable.
 */
export function parseMarkdownSections(raw: string, fileTitle: string): MarkdownSection[] {
  const sections: MarkdownSection[] = []
  let title = fileTitle
  let lines: string[] = []
  const flush = () => {
    const text = lines.join('\n').trim()
    if (text) sections.push({ title, text })
    lines = []
  }
  for (const line of raw.split(/\r?\n/)) {
    const h = /^#{1,3}\s+(.*\S)\s*$/.exec(line)
    if (h) {
      flush()
      title = h[1]
    } else {
      lines.push(line)
    }
  }
  flush()
  return sections
}
