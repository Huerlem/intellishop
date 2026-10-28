/**
 * Minimal, dependency-free Markdown parser for IntelliShop's legal documents.
 *
 * One parser feeds both outputs so the website and the app always show the same text:
 *   - the static legal site (scripts/legal/build-legal-site.mjs → HTML), and
 *   - the in-app legal screens (src/components/legal/LegalMarkdown.tsx → React Native).
 *
 * Supported subset (all that the legal documents use): YAML-like front matter with
 * `key: value` lines, ATX headings (#–####), paragraphs, unordered and ordered lists with
 * one nested level, pipe tables, blockquotes, horizontal rules, **bold**, *italic*,
 * `code` and [links](url).
 *
 * This file must stay self-contained (no imports, no enums or namespaces) so Node can run
 * it directly with built-in TypeScript type stripping.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] };

export type ListItem = { content: Inline[]; children: Block[] };

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; content: Inline[]; id: string }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; ordered: boolean; start: number; items: ListItem[] }
  | { type: 'table'; header: Inline[][]; rows: Inline[][][] }
  | { type: 'blockquote'; children: Block[] }
  | { type: 'hr' };

export type FrontMatter = Record<string, string>;

export type ParsedDocument = { frontMatter: FrontMatter; blocks: Block[] };

/** Markers that must not appear in a document published in release mode. */
export const PUBLICATION_BLOCKING_MARKERS = [
  '[OWNER TO CONFIRM',
  '[PENDING IMPLEMENTATION',
  '[PENDING DECISION',
  '[PENDING:',
  '[LEGAL REVIEW',
] as const;

export function parseFrontMatter(source: string): { frontMatter: FrontMatter; body: string } {
  const text = source.replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return { frontMatter: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end === -1) return { frontMatter: {}, body: text };
  const frontMatter: FrontMatter = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    frontMatter[match[1]] = value;
  }
  const afterClose = text.indexOf('\n', end + 4);
  return { frontMatter, body: afterClose === -1 ? '' : text.slice(afterClose + 1) };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function inlineToPlainText(inlines: Inline[]): string {
  return inlines
    .map((node) => {
      switch (node.type) {
        case 'text':
        case 'code':
          return node.text;
        default:
          return inlineToPlainText(node.children);
      }
    })
    .join('');
}

/** Parses inline Markdown. Unmatched markers are kept as literal text. */
export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer) out.push({ type: 'text', text: buffer });
    buffer = '';
  };
  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    if (rest.startsWith('\\') && rest.length > 1 && /[\\`*_[\]()#|>-]/.test(rest[1])) {
      buffer += rest[1];
      i += 2;
      continue;
    }
    if (rest.startsWith('`')) {
      const close = source.indexOf('`', i + 1);
      if (close > i) {
        flush();
        out.push({ type: 'code', text: source.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }
    if (rest.startsWith('**')) {
      const close = source.indexOf('**', i + 2);
      if (close > i + 2) {
        flush();
        out.push({ type: 'strong', children: parseInline(source.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
    }
    if (rest.startsWith('*') && !rest.startsWith('**')) {
      const close = findSingleStar(source, i + 1);
      if (close > i + 1) {
        flush();
        out.push({ type: 'em', children: parseInline(source.slice(i + 1, close)) });
        i = close + 1;
        continue;
      }
    }
    if (rest.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest);
      if (link) {
        flush();
        out.push({ type: 'link', href: link[2], children: parseInline(link[1]) });
        i += link[0].length;
        continue;
      }
    }
    buffer += source[i];
    i += 1;
  }
  flush();
  return out;
}

function findSingleStar(source: string, from: number): number {
  for (let j = from; j < source.length; j += 1) {
    if (source[j] === '*' && source[j + 1] !== '*' && source[j - 1] !== '*' && source[j - 1] !== ' ') return j;
  }
  return -1;
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line: string) => /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
const listMarker = /^(\s*)([-*]|(\d+)\.)\s+(.*)$/;

function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '\\' && inner[i + 1] === '|') {
      current += '|';
      i += 1;
    } else if (inner[i] === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += inner[i];
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;

  const uniqueId = (text: string) => {
    const base = slugify(text) || 'section';
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      const content = parseInline(heading[2]);
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3 | 4,
        content,
        id: uniqueId(inlineToPlainText(content)),
      });
      i += 1;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'blockquote', children: parseBlocks(quoted.join('\n')) });
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]).map(parseInline));
        i += 1;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    const marker = listMarker.exec(line);
    if (marker && marker[1].length === 0) {
      const ordered = marker[3] !== undefined;
      const start = ordered ? Number(marker[3]) : 1;
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = listMarker.exec(lines[i]);
        if (!m || m[1].length !== 0 || (m[3] !== undefined) !== ordered) break;
        const textLines = [m[4]];
        const nested: string[] = [];
        i += 1;
        while (i < lines.length) {
          const next = lines[i];
          if (!next.trim()) {
            // A blank line ends the item unless indented content follows.
            if (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) {
              if (nested.length) nested.push('');
              else textLines.push('\n');
              i += 1;
              continue;
            }
            break;
          }
          if (/^\s{2,}/.test(next)) {
            if (listMarker.test(next) || nested.length > 0) nested.push(next.replace(/^\s{2,4}/, ''));
            else textLines.push(next.trim());
            i += 1;
            continue;
          }
          if (listMarker.test(next)) break;
          // Lazy continuation of the item text.
          textLines.push(next.trim());
          i += 1;
        }
        items.push({ content: parseInline(textLines.join(' ')), children: nested.length ? parseBlocks(nested.join('\n')) : [] });
        // Skip blank lines between items of the same list.
        let j = i;
        while (j < lines.length && !lines[j].trim()) j += 1;
        const following = j < lines.length ? listMarker.exec(lines[j]) : null;
        if (following && following[1].length === 0 && (following[3] !== undefined) === ordered) i = j;
        else break;
      }
      blocks.push({ type: 'list', ordered, start, items });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      if (!next.trim() || /^#{1,4}\s/.test(next) || /^\s*>/.test(next) || (listMarker.test(next) && !/^\s/.test(next)) || isTableRow(next) || /^\s*-{3,}\s*$/.test(next)) break;
      paragraph.push(next.trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', content: parseInline(paragraph.join(' ')) });
  }
  return blocks;
}

export function parseDocument(source: string): ParsedDocument {
  const { frontMatter, body } = parseFrontMatter(source);
  return { frontMatter, blocks: parseBlocks(body) };
}

/** Returns each publication-blocking marker found, with its line number (1-based). */
export function findPublicationBlockers(source: string): { marker: string; line: number; excerpt: string }[] {
  const found: { marker: string; line: number; excerpt: string }[] = [];
  source.split(/\r?\n/).forEach((text, index) => {
    for (const marker of PUBLICATION_BLOCKING_MARKERS) {
      let from = 0;
      for (;;) {
        const at = text.indexOf(marker, from);
        if (at === -1) break;
        found.push({ marker, line: index + 1, excerpt: text.slice(at, at + 90) });
        from = at + marker.length;
      }
    }
  });
  return found;
}

// ---------------------------------------------------------------------------------------
// HTML rendering (website)
// ---------------------------------------------------------------------------------------

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only http(s), mailto, tel and relative links are rendered as links. */
export function safeHref(href: string): string | null {
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (/^[/#.]/.test(href) || /^[\w-]+(\/[\w-]*)*\/?(#[\w-]+)?$/.test(href)) return href;
  return null;
}

export function renderInlineHtml(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return escapeHtml(node.text);
        case 'code':
          return `<code>${escapeHtml(node.text)}</code>`;
        case 'strong':
          return `<strong>${renderInlineHtml(node.children)}</strong>`;
        case 'em':
          return `<em>${renderInlineHtml(node.children)}</em>`;
        case 'link': {
          const href = safeHref(node.href);
          const inner = renderInlineHtml(node.children);
          return href ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
        }
        default:
          return '';
      }
    })
    .join('');
}

export function renderBlocksHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h${block.level} id="${escapeHtml(block.id)}">${renderInlineHtml(block.content)}</h${block.level}>`;
        case 'paragraph':
          return `<p>${renderInlineHtml(block.content)}</p>`;
        case 'hr':
          return '<hr>';
        case 'blockquote':
          return `<aside class="notice" role="note">${renderBlocksHtml(block.children)}</aside>`;
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul';
          const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : '';
          const items = block.items
            .map((item) => `<li>${renderInlineHtml(item.content)}${item.children.length ? renderBlocksHtml(item.children) : ''}</li>`)
            .join('');
          return `<${tag}${start}>${items}</${tag}>`;
        }
        case 'table': {
          const head = block.header.map((cell) => `<th scope="col">${renderInlineHtml(cell)}</th>`).join('');
          const rows = block.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineHtml(cell)}</td>`).join('')}</tr>`)
            .join('');
          return `<div class="table-wrap" role="region" aria-label="Table" tabindex="0"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        default:
          return '';
      }
    })
    .join('\n');
}
