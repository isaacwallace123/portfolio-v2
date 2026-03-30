'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { TableProps } from '../../../lib/blocks';

interface PreviewProps { props: TableProps }
interface PropertiesProps { props: TableProps; onChange: (props: TableProps) => void }

export function TableBlockPreview({ props }: PreviewProps) {
  const { headers, rows } = props;
  if (!headers.length) return <p className="text-sm text-muted-foreground/40 italic">Empty table...</p>;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border my-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground/80 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
              {headers.map((_, ci) => (
                <td key={ci} className="px-4 py-2.5 text-foreground/70">
                  {row[ci] ?? ''}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-4 py-4 text-center text-sm text-muted-foreground/40 italic">
                No rows yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableBlockProperties({ props, onChange }: PropertiesProps) {
  const { headers, rows } = props;

  const setHeader = (i: number, value: string) => {
    const next = [...headers];
    next[i] = value;
    onChange({ ...props, headers: next });
  };

  const addColumn = () => {
    onChange({
      headers: [...headers, 'Column'],
      rows: rows.map((r) => [...r, '']),
    });
  };

  const removeColumn = (i: number) => {
    onChange({
      headers: headers.filter((_, ci) => ci !== i),
      rows: rows.map((r) => r.filter((_, ci) => ci !== i)),
    });
  };

  const setCell = (ri: number, ci: number, value: string) => {
    const next = rows.map((r, idx) => (idx === ri ? r.map((c, cidx) => (cidx === ci ? value : c)) : r));
    onChange({ ...props, rows: next });
  };

  const addRow = () => {
    onChange({ ...props, rows: [...rows, headers.map(() => '')] });
  };

  const removeRow = (i: number) => {
    onChange({ ...props, rows: rows.filter((_, ri) => ri !== i) });
  };

  return (
    <div className="space-y-4">
      {/* Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Columns</Label>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addColumn}>
            <Plus className="h-3 w-3" /> Add column
          </Button>
        </div>
        <div className="space-y-1.5">
          {headers.map((h, i) => (
            <div key={i} className="flex gap-2">
              <Input value={h} onChange={(e) => setHeader(i, e.target.value)} placeholder={`Column ${i + 1}`} className="h-8 text-sm" />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeColumn(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label>Rows</Label>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addRow}>
            <Plus className="h-3 w-3" /> Add row
          </Button>
        </div>
        <div className="space-y-2">
          {rows.map((row, ri) => (
            <div key={ri} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Row {ri + 1}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeRow(ri)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {headers.map((h, ci) => (
                  <Input
                    key={ci}
                    value={row[ci] ?? ''}
                    onChange={(e) => setCell(ri, ci, e.target.value)}
                    placeholder={h}
                    className="h-8 text-sm"
                  />
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic text-center py-2">No rows yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
