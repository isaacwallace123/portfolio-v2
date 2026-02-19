import * as deepl from 'deepl-node';
import type { Block, StatItem, FeatureItem } from '@/features/projects/lib/blocks';
import { parseBlocks, serializeBlocks } from '@/features/projects/lib/blocks';

let translator: deepl.Translator | null = null;

function getTranslator(): deepl.Translator | null {
  if (!process.env.DEEPL_API_KEY) return null;
  if (!translator) {
    translator = new deepl.Translator(process.env.DEEPL_API_KEY);
  }
  return translator;
}

export async function translateToFrench(text: string): Promise<string> {
  const t = getTranslator();
  if (!t || !text.trim()) return '';

  try {
    const result = await t.translateText(text, 'en', 'fr', { tagHandling: 'html' });
    return result.text;
  } catch (error) {
    console.error('DeepL translation failed:', error);
    return '';
  }
}

export async function translateFields(
  fields: Record<string, string | null | undefined>
): Promise<Record<string, string>> {
  const t = getTranslator();
  if (!t) return {};

  const result: Record<string, string> = {};

  // For 'content' field, use block-aware translation if it's block JSON
  if (fields.content && fields.content.trimStart().startsWith('[')) {
    const blocks = parseBlocks(fields.content);
    if (blocks) {
      try {
        const translated = await translateBlocks(blocks, t);
        result.contentFr = serializeBlocks(translated);
      } catch (error) {
        console.error('Block translation failed:', error);
      }
      // Remove content from plain fields so it isn't double-processed
      const { content: _content, ...rest } = fields;
      fields = rest;
    }
  }

  const entries = Object.entries(fields).filter(
    ([, value]) => value && value.trim().length > 0
  );

  if (entries.length === 0) return result;

  try {
    const texts = entries.map(([, value]) => value!);
    const translations = await t.translateText(texts, 'en', 'fr', { tagHandling: 'html' });

    const translationArray = Array.isArray(translations) ? translations : [translations];

    entries.forEach(([key], index) => {
      const frKey = key + 'Fr';
      result[frKey] = translationArray[index].text;
    });
  } catch (error) {
    console.error('DeepL batch translation failed:', error);
  }

  return result;
}

// Translates text fields within a blocks array without touching structure or code
export async function translateBlocks(
  blocks: Block[],
  t?: deepl.Translator | null
): Promise<Block[]> {
  const translator_ = t ?? getTranslator();
  if (!translator_) return blocks;

  // Collect all translatable items with a setter closure so we can reassemble
  type Item = { value: string; isHtml: boolean; set: (v: string) => void };
  const items: Item[] = [];

  // Deep clone so we don't mutate the original
  const cloned: Block[] = JSON.parse(JSON.stringify(blocks));

  for (const block of cloned) {
    const p = block.props as unknown as Record<string, unknown>;

    switch (block.type) {
      case 'heading':
        if (p.text) items.push({ value: p.text as string, isHtml: false, set: v => { p.text = v; } });
        break;

      case 'paragraph':
        if (p.html) items.push({ value: p.html as string, isHtml: true, set: v => { p.html = v; } });
        break;

      case 'callout':
        if (p.title) items.push({ value: p.title as string, isHtml: false, set: v => { p.title = v; } });
        if (p.body)  items.push({ value: p.body as string,  isHtml: false, set: v => { p.body  = v; } });
        break;

      case 'image':
        if (p.alt)     items.push({ value: p.alt as string,     isHtml: false, set: v => { p.alt     = v; } });
        if (p.caption) items.push({ value: p.caption as string, isHtml: false, set: v => { p.caption = v; } });
        break;

      case 'stats': {
        const statItems = p.items as StatItem[];
        for (const item of (statItems ?? [])) {
          const captured = item;
          if (captured.label) items.push({ value: captured.label, isHtml: false, set: v => { captured.label = v; } });
          // Only translate values that contain letters (skip pure numbers like "99%" or "3")
          if (captured.value && /[a-zA-Z]/.test(captured.value)) {
            items.push({ value: captured.value, isHtml: false, set: v => { captured.value = v; } });
          }
        }
        break;
      }

      case 'features': {
        const featItems = p.items as FeatureItem[];
        for (const item of (featItems ?? [])) {
          const captured = item;
          if (captured.title)       items.push({ value: captured.title,       isHtml: false, set: v => { captured.title       = v; } });
          if (captured.description) items.push({ value: captured.description, isHtml: false, set: v => { captured.description = v; } });
        }
        break;
      }

      // code and divider blocks: nothing to translate
    }
  }

  if (items.length === 0) return cloned;

  const plainItems = items.filter(i => !i.isHtml);
  const htmlItems  = items.filter(i =>  i.isHtml);

  const [plainResults, htmlResults] = await Promise.all([
    plainItems.length > 0
      ? translator_.translateText(plainItems.map(i => i.value), 'en', 'fr')
      : Promise.resolve([]),
    htmlItems.length > 0
      ? translator_.translateText(htmlItems.map(i => i.value), 'en', 'fr', { tagHandling: 'html', ignoreTags: ['code', 'pre'] })
      : Promise.resolve([]),
  ]);

  const toArr = (r: deepl.TextResult | deepl.TextResult[]) => Array.isArray(r) ? r : [r];

  toArr(plainResults as deepl.TextResult | deepl.TextResult[]).forEach((r, i) => plainItems[i].set(r.text));
  toArr(htmlResults  as deepl.TextResult | deepl.TextResult[]).forEach((r, i) => htmlItems[i].set(r.text));

  return cloned;
}
