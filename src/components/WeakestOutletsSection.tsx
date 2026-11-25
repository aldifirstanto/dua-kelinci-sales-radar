import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import type { OutletPerformance } from '../types/sales';
import { formatDateId, formatPercent, formatRupiahCompact, formatRupiahFull } from '../lib/format';

interface WeakestOutletsSectionProps {
  weakestOutlets: OutletPerformance[];
  biggestDrops: OutletPerformance[];
  showMoM: boolean;
}

export function WeakestOutletsSection({
  weakestOutlets,
  biggestDrops,
  showMoM,
}: WeakestOutletsSectionProps) {
  const [activeTab, setActiveTab] = useState<'weakest' | 'drops'>('weakest');
  const effectiveTab = !showMoM && activeTab === 'drops' ? 'weakest' : activeTab;
  const list = effectiveTab === 'weakest' ? weakestOutlets : biggestDrops;

  return (
    <section
      aria-label="5 Outlet Terlemah dan Risiko Penurunan"
      className="rounded-2xl border border-red-200/80 bg-white p-5 shadow-sm dark:border-red-900/50 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#C8102E] dark:bg-red-950/70 dark:text-red-400">
            {effectiveTab === 'weakest' ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {effectiveTab === 'weakest'
                ? '5 Outlet Terlemah (Prioritas Tindak Lanjut)'
                : '5 Outlet dengan Penurunan Omzet Terbesar (Okt vs Sep)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {effectiveTab === 'weakest'
                ? 'Dikelompokkan berdasarkan ID Outlet unik agar outlet bernama sama di kota berbeda tidak tercampur.'
                : 'Outlet bernilai besar yang mengalami penurunan tajam di Oktober dan berisiko churn.'}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('weakest')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              effectiveTab === 'weakest'
                ? 'bg-white text-[#C8102E] shadow-sm dark:bg-slate-900 dark:text-red-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            5 Outlet Terlemah
          </button>
          {showMoM && (
            <button
              type="button"
              onClick={() => setActiveTab('drops')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                effectiveTab === 'drops'
                  ? 'bg-white text-[#C8102E] shadow-sm dark:bg-slate-900 dark:text-red-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Penurunan Terbesar (MoM)
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Tidak ada outlet yang memenuhi kriteria pada filter saat ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="py-2.5 pl-3 pr-2 font-semibold">#</th>
                <th className="px-2 py-2.5 font-semibold">Outlet &amp; Wilayah</th>
                <th className="px-2 py-2.5 font-semibold">Salesman PIC</th>
                <th className="px-2 py-2.5 text-right font-semibold">Net Sales</th>
                {showMoM && (
                  <th className="px-2 py-2.5 text-right font-semibold">Sep → Okt</th>
                )}
                <th className="px-2 py-2.5 text-center font-semibold">Aktivitas</th>
                <th className="py-2.5 pl-2 pr-3 font-semibold">Diagnosis &amp; Saran ASM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((o, idx) => (
                <tr key={o.outletId} className="hover:bg-red-50/30 dark:hover:bg-red-950/20 transition">
                  <td className="py-3 pl-3 pr-2 align-top">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        idx === 0
                          ? 'bg-[#C8102E] text-white'
                          : 'bg-red-100 text-[#C8102E] dark:bg-red-950/80 dark:text-red-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>

                  <td className="px-2 py-3 align-top">
                    <div className="font-bold text-slate-900 dark:text-white">{o.outletName}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {o.outletId}
                      </span>
                      <span>{o.outletType}</span>
                      <span>·</span>
                      <span>
                        {o.region} / {o.branch}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 py-3 align-top whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      <UserCheck className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      {o.salesman}
                    </div>
                  </td>

                  <td className="px-2 py-3 align-top text-right whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatRupiahFull(o.netSales)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {o.qtyCarton} karton · {o.skuCount} SKU
                    </div>
                  </td>

                  {showMoM && (
                    <td className="px-2 py-3 align-top text-right whitespace-nowrap">
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        {formatRupiahCompact(o.sepNetSales)} → {formatRupiahCompact(o.octNetSales)}
                      </div>
                      {o.momPct !== null ? (
                        <span
                          className={`mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-bold ${
                            o.momPct >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {o.momPct >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatPercent(o.momPct, true)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Baru di Okt
                        </span>
                      )}
                    </td>
                  )}

                  <td className="px-2 py-3 align-top text-center whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {o.invoiceCount} invoice
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <CalendarClock className="h-3 w-3" />
                      {formatDateId(o.lastOrderDate)}
                    </div>
                  </td>

                  <td className="py-3 pl-2 pr-3 align-top max-w-xs">
                    <div className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/60">
                      {o.weaknessReason}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {o.recommendation}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
