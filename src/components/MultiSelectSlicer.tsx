import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SlicerOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectSlicerProps {
  id: string;
  label: string;
  placeholder: string;
  options: SlicerOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function MultiSelectSlicer({
  id,
  label,
  placeholder,
  options,
  selected,
  onChange,
  searchable = false,
  searchPlaceholder = 'Cari...',
}: MultiSelectSlicerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      // Focus search input when opening searchable slicer
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else if (!open) {
      setQuery('');
    }
  }, [open, searchable]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, query, searchable]);

  const toggleValue = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const selectAllVisible = () => {
    const visibleValues = filteredOptions.map((o) => o.value);
    const merged = Array.from(new Set([...selected, ...visibleValues]));
    if (merged.length === options.length) {
      // All selected is equivalent to empty ("Semua")
      onChange([]);
    } else {
      onChange(merged);
    }
  };

  const clearSelection = () => {
    onChange([]);
  };

  const displayLabel = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const found = options.find((o) => o.value === selected[0]);
      return found?.label ?? selected[0];
    }
    return `${selected.length} dipilih`;
  }, [selected, options, placeholder]);

  return (
    <div ref={containerRef} className="relative min-w-[165px] flex-1 sm:flex-none">
      <label
        htmlFor={id}
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>

      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${
          selected.length > 0
            ? 'border-[#C8102E]/60 bg-red-50/70 text-[#9B0D24] dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200'
            : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <span className="truncate max-w-[160px]">{displayLabel}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Reset ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  clearSelection();
                }
              }}
              className="rounded p-0.5 hover:bg-red-200/70 dark:hover:bg-red-900/60"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {searchable && (
            <div className="border-b border-slate-100 p-2 dark:border-slate-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#C8102E] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Hapus pencarian"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-[11px] dark:border-slate-800">
            <button
              type="button"
              onClick={selectAllVisible}
              className="font-semibold text-[#C8102E] hover:underline dark:text-red-400 cursor-pointer"
            >
              {query ? 'Pilih Hasil' : 'Pilih Semua'}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Reset ({selected.length === 0 ? 'Semua' : selected.length})
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Tidak ada opsi yang cocok.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isChecked}
                    onClick={() => toggleValue(opt.value)}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      isChecked
                        ? 'bg-red-50/80 text-slate-900 font-semibold dark:bg-red-950/40 dark:text-white'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        isChecked
                          ? 'border-[#C8102E] bg-[#C8102E] text-white'
                          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="block truncate text-[10px] font-normal text-slate-400 dark:text-slate-500">
                          {opt.sublabel}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
