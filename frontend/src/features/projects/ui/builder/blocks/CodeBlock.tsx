'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import type { CodeProps } from '../../../lib/blocks';

interface PreviewProps { props: CodeProps }
interface PropertiesProps { props: CodeProps; onChange: (props: CodeProps) => void }

// --- Simple single-pass syntax highlighter ---
const KW = new Set([
  'const','let','var','function','return','if','else','for','while','do','switch','case','break',
  'continue','class','new','this','typeof','instanceof','import','export','from','default','async',
  'await','try','catch','finally','throw','type','interface','extends','implements','enum','void',
  'null','undefined','true','false','in','of','delete','yield','static','abstract','readonly',
  // Python
  'def','pass','lambda','with','as','elif','except','raise','global','nonlocal','None','True','False','and','or','not','is','print','self',
  // Go / Rust
  'func','package','struct','impl','fn','pub','mod','use','mut','where','match','Some','Ok','Err','let',
  // Java / C#
  'public','private','protected','final','override','namespace','using','sealed',
  // SQL
  'SELECT','FROM','WHERE','INSERT','UPDATE','DELETE','JOIN','ON','AND','OR','NOT','CREATE','TABLE','DROP','ALTER','INDEX','GROUP','ORDER','BY','HAVING','LIMIT','INTO','VALUES','SET',
]);

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code: string, lang: string): string {
  if (lang === 'plaintext') return esc(code);

  const out: string[] = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    // Line comment // or #
    if ((code[i] === '/' && code[i + 1] === '/') || (code[i] === '#' && lang !== 'html' && lang !== 'css')) {
      const end = code.indexOf('\n', i);
      const t = esc(end === -1 ? code.slice(i) : code.slice(i, end));
      out.push(`<span style="color:#6a9955">${t}</span>`);
      i = end === -1 ? n : end;
      continue;
    }
    // Block comment /* */
    if (code[i] === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      const t = esc(end === -1 ? code.slice(i) : code.slice(i, end + 2));
      out.push(`<span style="color:#6a9955">${t}</span>`);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // HTML comment <!-- -->
    if (lang === 'html' && code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4);
      const t = esc(end === -1 ? code.slice(i) : code.slice(i, end + 3));
      out.push(`<span style="color:#6a9955">${t}</span>`);
      i = end === -1 ? n : end + 3;
      continue;
    }
    // Strings: " ' `
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const q = code[i];
      let j = i + 1;
      while (j < n && !(code[j] === q && code[j - 1] !== '\\')) j++;
      const t = esc(code.slice(i, j + 1));
      out.push(`<span style="color:#ce9178">${t}</span>`);
      i = j + 1;
      continue;
    }
    // Identifiers / keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const isKw = KW.has(word) || KW.has(word.toUpperCase());
      out.push(isKw
        ? `<span style="color:#569cd6">${esc(word)}</span>`
        : esc(word));
      i = j;
      continue;
    }
    // Numbers
    if (/[0-9]/.test(code[i])) {
      let j = i;
      while (j < n && /[0-9._xXabcdefABCDEF]/.test(code[j])) j++;
      out.push(`<span style="color:#b5cea8">${esc(code.slice(i, j))}</span>`);
      i = j;
      continue;
    }
    // Everything else
    out.push(esc(code[i]));
    i++;
  }
  return out.join('');
}

const LANGUAGES = [
  'typescript', 'javascript', 'python', 'go', 'rust', 'java', 'bash',
  'sql', 'yaml', 'json', 'html', 'css', 'dockerfile', 'plaintext',
];

export function CodeBlockPreview({ props }: PreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(props.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border bg-muted overflow-hidden my-1">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60">
        <span className="text-xs font-mono text-muted-foreground">{props.language}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed" translate="no">
        <code dangerouslySetInnerHTML={{ __html: highlight(props.code || '// Your code here', props.language) }} />
      </pre>
    </div>
  );
}

export function CodeBlockProperties({ props, onChange }: PropertiesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Language</Label>
        <Select
          value={props.language}
          onValueChange={(v) => onChange({ ...props, language: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Code</Label>
        <textarea
          value={props.code}
          onChange={(e) => onChange({ ...props, code: e.target.value })}
          className="w-full h-48 rounded-lg border bg-muted px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="// Your code here"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
