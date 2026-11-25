import { useState } from 'react';
import { Check, Copy, Send, Sparkles } from 'lucide-react';
import type { FilterState } from '../types/sales';

interface TelegramDigestCardProps {
  summary: string;
  filters: FilterState;
}

export function TelegramDigestCard({ summary, filters }: TelegramDigestCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    ' '
  )}&text=${encodeURIComponent(summary)}`;

  const scopeBadge =
    filters.branches.length > 0
      ? `Cakupan Cabang: ${filters.branches.join(', ')}`
      : filters.regions.length === 0
        ? 'Cakupan: Nasional'
        : `Cakupan: ${filters.regions.join(', ')}`;

  return (
    <section
      aria-label="Ringkasan Telegram untuk Area Sales Manager"
      className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-white p-5 shadow-sm dark:border-sky-900/60 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-sm">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Ringkasan 1 Paragraf Siap Kirim ke Telegram
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                <Sparkles className="h-3 w-3" />
                Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dirancang khusus agar cepat dibaca Area Sales Manager di grup Telegram. {scopeBadge}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#229ED9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1c89be] active:scale-[0.99] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Salin Teks Telegram
              </>
            )}
          </button>
          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Send className="h-3.5 w-3.5 text-[#229ED9]" />
            Buka Telegram
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-[#EFF7FE]/70 p-4 dark:border-sky-900/50 dark:bg-slate-950/60">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-sky-900/70 dark:text-sky-300/80">
          <span>Bot Radar Sales Dua Kelinci</span>
          <span>{summary.length} karakter · 1 paragraf</span>
        </div>
        <p className="text-sm leading-relaxed text-slate-800 select-all dark:text-slate-200">
          {summary}
        </p>
      </div>
    </section>
  );
}
