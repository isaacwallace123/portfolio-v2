import type {
  Block,
  HeadingProps,
  ParagraphProps,
  ListProps,
  ImageProps,
  DividerProps,
  CodeProps,
  CalloutProps,
  StatsProps,
  FeaturesProps,
  TableProps,
} from './blocks';

export function serializeToMdx(blocks: Block[]): string {
  return blocks.map(blockToMdx).filter(Boolean).join('\n\n');
}

function blockToMdx(block: Block): string {
  switch (block.type) {
    case 'heading': {
      const { level, text } = block.props as HeadingProps;
      return `${'#'.repeat(level)} ${text}`;
    }

    case 'paragraph': {
      const { html } = block.props as ParagraphProps;
      return html;
    }

    case 'list': {
      const { style, items } = block.props as ListProps;
      return items
        .map((item, i) => {
          if (style === 'numbered') return `${i + 1}. ${item}`;
          if (style === 'check') return `- [ ] ${item}`;
          return `- ${item}`;
        })
        .join('\n');
    }

    case 'image': {
      const { src, alt, caption, size } = block.props as ImageProps;
      const sizeAttr = size !== 'full' ? ` data-size="${size}"` : '';
      if (caption) {
        return `<figure${sizeAttr}>\n\n![${alt}](${src})\n\n<figcaption>${caption}</figcaption>\n\n</figure>`;
      }
      return `![${alt}](${src})`;
    }

    case 'divider': {
      const { style } = block.props as DividerProps;
      if (style === 'dashed') return `<hr data-style="dashed" />`;
      if (style === 'dots') return `<hr data-style="dots" />`;
      return `---`;
    }

    case 'code': {
      const { language, code } = block.props as CodeProps;
      return `\`\`\`${language}\n${code}\n\`\`\``;
    }

    case 'callout': {
      const { variant, title, body } = block.props as CalloutProps;
      return `<Callout type="${variant}" title="${title}">\n${body}\n</Callout>`;
    }

    case 'stats': {
      const { items } = block.props as StatsProps;
      return `<StatsGrid items={${JSON.stringify(items)}} />`;
    }

    case 'features': {
      const { items } = block.props as FeaturesProps;
      return `<FeatureList items={${JSON.stringify(items)}} />`;
    }

    case 'table': {
      const { headers, rows } = block.props as TableProps;
      if (!headers.length) return '';
      const sep = headers.map(() => '------').join(' | ');
      const headerRow = headers.join(' | ');
      const dataRows = rows.map((r) => headers.map((_, i) => r[i] ?? '').join(' | '));
      return `| ${headerRow} |\n| ${sep} |\n${dataRows.map((r) => `| ${r} |`).join('\n')}`;
    }

    default:
      return '';
  }
}
