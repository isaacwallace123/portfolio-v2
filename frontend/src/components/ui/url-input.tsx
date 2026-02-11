import * as React from 'react';

import { cn } from '@/lib/utils';

type UrlInputProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
};

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

function UrlInput({ className, value, onChange, ...props }: UrlInputProps) {
  const display = stripProtocol(value);

  return (
    <div className="flex">
      <span className="border-input bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-sm select-none">
        https://
      </span>
      <input
        type="text"
        data-slot="input"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-r-md rounded-l-none border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        value={display}
        onChange={(e) => {
          const raw = stripProtocol(e.target.value);
          onChange(raw ? `https://${raw}` : '');
        }}
        {...props}
      />
    </div>
  );
}

export { UrlInput };
