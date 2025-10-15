'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type MonthInputProps = {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export const MonthInput = forwardRef<HTMLButtonElement, MonthInputProps>(
  ({ value, onChange, disabled, placeholder = 'Select month' }, ref) => {
    const parse = (input: string | undefined): Date | undefined => {
      if (!input) return undefined;
      const [year, month] = input.split('-');
      const parsedYear = Number(year);
      const parsedMonth = Number(month);
      if (!parsedYear || !parsedMonth) return undefined;
      return new Date(parsedYear, parsedMonth - 1, 1);
    };

    const toYmm = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    const label = (input: string | undefined): string => {
      const parsed = parse(input);
      if (!parsed) return placeholder;
      return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
    };

    const selected = parse(value);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            type="button"
            className="justify-start w-full"
          >
            {label(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0">
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(toYmm(date));
                }
              }}
              captionLayout="dropdown"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange('')}
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

MonthInput.displayName = 'MonthInput';
