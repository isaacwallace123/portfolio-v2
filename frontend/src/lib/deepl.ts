import * as deepl from 'deepl-node';

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
