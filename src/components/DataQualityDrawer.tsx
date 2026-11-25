import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import type { DataQualityReport } from '../types/sales';
import { formatRupiahFull } from '../lib/format';

interface DataQualityDrawerProps {
  quality: DataQualityReport;
  fileName: string;
}

export function DataQualityDrawer({ quality, fileName }: DataQualityDrawerProps) {
  const [open, setOpen] = useState(false);

  const totalAutoFixes =
    quality.duplicatesRemoved +
    quality.regionsNormalized +
    quality.whitespaceFixed +
    quality.salesmanImputed;

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-100">
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Audit Data ERP ({fileName}):</strong> {quality.rawRowCount.toLocaleString('id-ID')}{' '}
            baris mentah dibersihkan menjadi{' '}
            <strong>{quality.cleanRowCount.toLocaleString('id-ID')} baris valid</strong> (
            {totalAutoFixes} anomali diperbaiki otomatis, {quality.returnCount} retur dipertahankan).
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100/80 dark:text-emerald-300 dark:hover:bg-emerald-900/40 cursor-pointer"
        >
          {open ? 'Tutup Rincian' : 'Lihat Rincian'}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-emerald-200/70 pt-3 md:grid-cols-4 text-[11px] text-emerald-950 dark:border-emerald-900/60 dark:text-emerald-100">
          <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-100 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-100">
              Duplikat Dihapus ({quality.duplicatesRemoved})
            </div>
            {quality.duplicateDetails.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                {quality.duplicateDetails.map((d, i) => (
                  <li key={`${d.invoiceNo}-${i}`}>
                    {d.invoiceNo} · {d.sku} ({formatRupiahFull(d.netSales)})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-slate-500 dark:text-slate-400">Tidak ditemukan baris duplikat.</p>
            )}
          </div>

          <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-100 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-100">
              Normalisasi Region ({quality.regionsNormalized})
            </div>
            {quality.regionNormalizations.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                {quality.regionNormalizations.map((n) => (
                  <li key={`${n.from}-${n.to}`}>
                    &ldquo;{n.from}&rdquo; → <strong>{n.to}</strong> ({n.count} baris)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-slate-500 dark:text-slate-400">Semua nama region sudah standar.</p>
            )}
          </div>

          <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-100 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-100">
              Salesman &amp; Spasi Dirapikan
            </div>
            <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
              <li>
                <strong>{quality.salesmanImputed}</strong> baris tanpa nama salesman dilengkapi dari riwayat PIC outlet.
              </li>
              <li>
                <strong>{quality.whitespaceFixed}</strong> sel dengan spasi berlebih dibersihkan otomatis.
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-white/80 p-2.5 border border-emerald-100 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="font-bold text-slate-800 dark:text-slate-100">
              Retur Penjualan ({quality.returnCount})
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Total nilai retur <strong>{formatRupiahFull(quality.returnNetSales)}</strong> tetap
              diperhitungkan dalam Net Sales agar angka omzet akurat sesuai pembukuan ERP.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
