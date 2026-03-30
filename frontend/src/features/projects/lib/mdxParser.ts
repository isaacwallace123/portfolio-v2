import type { Block, CalloutProps, DividerProps, FeaturesProps, HeadingProps, ImageProps, ListProps, ParagraphProps, StatsProps, TableProps } from './blocks';
import type { CodeProps } from './blocks';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Convert inline markdown to HTML (bold, italic, code, links, strikethrough)
function inlineToHtml(text: string): string {
  return text
    // Escape HTML entities first (except in code spans — handled below)
    // Code spans — do first so inner content isn't processed by other rules
    .replace(/`([^`]+)`/g, (_, code) => `<code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`)
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Bold+italic (***text***)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold (**text**)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic (*text* or _text_)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(?<![a-zA-Z0-9])_(.+?)_(?![a-zA-Z0-9])/g, '<em>$1</em>')
    // Strikethrough (~~text~~)
    .replace(/~~(.+?)~~/g, '<s>$1</s>');
}

export function parseMdxToBlocks(mdx: string): Block[] {
  const lines = mdx.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines between blocks
    if (!trimmed) {
      i++;
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────────
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      // Strip inline markdown from heading text (headings store plain text)
      const headingText = headingMatch[2].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`([^`]+)`/g, '$1');
      blocks.push({
        id: generateId(),
        type: 'heading',
        props: { level: headingMatch[1].length as 1 | 2 | 3, text: headingText } as HeadingProps,
      });
      i++;
      continue;
    }

    // ── HR with data-style ───────────────────────────────────────────────────
    const hrMatch = trimmed.match(/^<hr data-style="(dashed|dots)" \/>$/);
    if (hrMatch) {
      blocks.push({
        id: generateId(),
        type: 'divider',
        props: { style: hrMatch[1] as 'dashed' | 'dots' } as DividerProps,
      });
      i++;
      continue;
    }

    // ── Solid divider ────────────────────────────────────────────────────────
    if (trimmed === '---') {
      blocks.push({ id: generateId(), type: 'divider', props: { style: 'solid' } as DividerProps });
      i++;
      continue;
    }

    // ── Code block ───────────────────────────────────────────────────────────
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      blocks.push({
        id: generateId(),
        type: 'code',
        props: { language: lang, code: codeLines.join('\n') } as CodeProps,
      });
      continue;
    }

    // ── Callout ───────────────────────────────────────────────────────────────
    const calloutOpenMatch = trimmed.match(/^<Callout type="(info|warning|success|danger)" title="([^"]*)">/);
    if (calloutOpenMatch) {
      const variant = calloutOpenMatch[1] as CalloutProps['variant'];
      const title = calloutOpenMatch[2];

      // Single-line: <Callout ...>body</Callout>
      const singleLine = trimmed.match(/^<Callout[^>]+>(.+)<\/Callout>$/);
      if (singleLine) {
        blocks.push({ id: generateId(), type: 'callout', props: { variant, title, body: singleLine[1] } as CalloutProps });
        i++;
        continue;
      }

      // Multi-line
      const bodyLines: string[] = [];
      const afterOpen = trimmed.slice(trimmed.indexOf('>') + 1);
      if (afterOpen) bodyLines.push(afterOpen);
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('</Callout>')) {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // consume </Callout>
      blocks.push({
        id: generateId(),
        type: 'callout',
        props: { variant, title, body: bodyLines.join('\n').trim() } as CalloutProps,
      });
      continue;
    }

    // ── StatsGrid ─────────────────────────────────────────────────────────────
    const statsMatch = trimmed.match(/^<StatsGrid items=\{(.+)\} \/>$/);
    if (statsMatch) {
      try {
        const items = JSON.parse(statsMatch[1]);
        blocks.push({ id: generateId(), type: 'stats', props: { items } as StatsProps });
      } catch {
        // malformed — skip
      }
      i++;
      continue;
    }

    // ── FeatureList ───────────────────────────────────────────────────────────
    const featuresMatch = trimmed.match(/^<FeatureList items=\{(.+)\} \/>$/);
    if (featuresMatch) {
      try {
        const items = JSON.parse(featuresMatch[1]);
        blocks.push({ id: generateId(), type: 'features', props: { items } as FeaturesProps });
      } catch {
        // malformed — skip
      }
      i++;
      continue;
    }

    // ── Figure (image with caption / size) ────────────────────────────────────
    if (trimmed.startsWith('<figure')) {
      const figLines: string[] = [trimmed];
      i++;
      while (i < lines.length && !lines[i].includes('</figure>')) {
        figLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) figLines.push(lines[i]);
      i++;
      const figContent = figLines.join('\n');
      const imgMatch = figContent.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const captionMatch = figContent.match(/<figcaption>([\s\S]*?)<\/figcaption>/);
      const sizeMatch = figContent.match(/data-size="(medium|small)"/);
      if (imgMatch) {
        blocks.push({
          id: generateId(),
          type: 'image',
          props: {
            src: imgMatch[2],
            alt: imgMatch[1],
            caption: captionMatch ? captionMatch[1] : '',
            size: sizeMatch ? (sizeMatch[1] as 'medium' | 'small') : 'full',
          } as ImageProps,
        });
      }
      continue;
    }

    // ── Bare image ────────────────────────────────────────────────────────────
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      blocks.push({
        id: generateId(),
        type: 'image',
        props: { src: imageMatch[2], alt: imageMatch[1], caption: '', size: 'full' } as ImageProps,
      });
      i++;
      continue;
    }

    // ── Markdown table ────────────────────────────────────────────────────────
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // First line = headers, second line = separator (|---|), rest = rows
      if (tableLines.length >= 2) {
        const parseRow = (line: string) =>
          line.split('|').slice(1, -1).map((cell) => cell.trim());
        const headers = parseRow(tableLines[0]);
        // tableLines[1] is the separator — skip it
        const rows = tableLines.slice(2).map(parseRow);
        blocks.push({ id: generateId(), type: 'table', props: { headers, rows } as TableProps });
      }
      continue;
    }

    // ── Lists ─────────────────────────────────────────────────────────────────
    if (trimmed.match(/^(-|\d+\.)\s/)) {
      let style: ListProps['style'] = 'bullet';
      const items: string[] = [];

      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l) break;
        if (l.match(/^\d+\.\s/)) {
          style = 'numbered';
          items.push(l.replace(/^\d+\.\s/, ''));
        } else if (l.match(/^-\s\[[ x]\]\s/)) {
          style = 'check';
          items.push(l.replace(/^-\s\[[ x]\]\s/, ''));
        } else if (l.match(/^-\s/)) {
          items.push(l.replace(/^-\s/, ''));
        } else {
          break;
        }
        i++;
      }

      blocks.push({ id: generateId(), type: 'list', props: { style, items } as ListProps });
      continue;
    }

    // ── Paragraph (everything else) ───────────────────────────────────────────
    const htmlLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (!t) break;
      // Stop if the next line looks like a new block type
      if (
        t.match(/^#{1,3}\s/) ||
        t === '---' ||
        t.startsWith('```') ||
        t.startsWith('<Callout') ||
        t.startsWith('<StatsGrid') ||
        t.startsWith('<FeatureList') ||
        t.startsWith('<figure') ||
        t.startsWith('<hr') ||
        t.startsWith('![') ||
        (t.startsWith('|') && t.endsWith('|')) ||
        t.match(/^(-|\d+\.)\s/)
      ) {
        break;
      }
      htmlLines.push(l);
      i++;
    }

    if (htmlLines.length > 0) {
      const raw = htmlLines.join('\n').trim();
      // If already HTML (from a Tiptap-generated round-trip), use as-is.
      // Otherwise convert inline markdown and wrap in <p>.
      const html = raw.startsWith('<') ? raw : `<p>${inlineToHtml(raw)}</p>`;
      blocks.push({ id: generateId(), type: 'paragraph', props: { html } as ParagraphProps });
    }
  }

  return blocks;
}
