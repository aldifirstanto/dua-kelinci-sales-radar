import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Grid3X3 } from 'lucide-react';
import type { BranchSummary, BrandSummary, RegionSummary } from '../types/sales';
import { formatNumber, formatPercent, formatRupiahCompact, formatRupiahFull } from '../lib/format';

interface RegionBrandChartsProps {
  byRegion: RegionSummary[];
  byBranch: BranchSummary[];
  byBrand: BrandSummary[];
  regionBrandMatrix: Record<string, Record<string, number>>;
  branchBrandMatrix: Record<string, Record<string, number>>;
  selectedRegions: string[];
  selectedBranches: string[];
  showMoM: boolean;
  isDark: boolean;
  onToggleRegion: (region: string) => void;
  onToggleBranch: (branch: string) => void;
}

const BRAND_COLORS = [
  '#C8102E',
  '#E04F33',
  '#D97706',
  '#0F766E',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#64748B',
];

export function RegionBrandCharts({
  byRegion,
  byBranch,
  byBrand,
  regionBrandMatrix,
  branchBrandMatrix,
  selectedRegions,
  selectedBranches,
  showMoM,
  isDark,
  onToggleRegion,
  onToggleBranch,
}: RegionBrandChartsProps) {
  const [breakdownLevel, setBreakdownLevel] = useState<'region' | 'branch'>('region');
  const [showMatrix, setShowMatrix] = useState(true);

  const isBranchMode = breakdownLevel === 'branch';

  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const yTickColor = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipStyle = {
    borderRadius: '10px',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    fontSize: '12px',
  };
  const tooltipItemStyle = {
    color: isDark ? '#e2e8f0' : '#1e293b',
  };
  const tooltipLabelStyle = {
    color: isDark ? '#f8fafc' : '#0f172a',
    fontWeight: 700,
    marginBottom: '2px',
  };

  const areaRows = isBranchMode
    ? byBranch.map((b) => ({
        key: b.branch,
        label: b.branch,
        parentRegion: b.region,
        netSales: b.netSales,
        sepNetSales: b.sepNetSales,
        octNetSales: b.octNetSales,
        qtyCarton: b.qtyCarton,
        outletCount: b.outletCount,
        momPct: b.momPct,
        sharePct: b.sharePct,
      }))
    : byRegion.map((r) => ({
        key: r.region,
        label: r.region,
        parentRegion: null as string | null,
        netSales: r.netSales,
        sepNetSales: r.sepNetSales,
        octNetSales: r.octNetSales,
        qtyCarton: r.qtyCarton,
        outletCount: r.outletCount,
        momPct: r.momPct,
        sharePct: r.sharePct,
      }));

  const areaChartData = areaRows.map((a) => ({
    name: a.label,
    September: Math.round(a.sepNetSales / 1_000_000),
    Oktober: Math.round(a.octNetSales / 1_000_000),
    TotalJt: Number((a.netSales / 1_000_000).toFixed(1)),
    netSales: a.netSales,
    momPct: a.momPct,
    sharePct: a.sharePct,
  }));

  const brandChartData = byBrand.map((b, idx) => ({
    brand: b.brand,
    netSalesJt: Number((b.netSales / 1_000_000).toFixed(1)),
    netSales: b.netSales,
    qtyCarton: b.qtyCarton,
    sharePct: b.sharePct,
    color: BRAND_COLORS[idx % BRAND_COLORS.length],
  }));

  const activeMatrix = isBranchMode ? branchBrandMatrix : regionBrandMatrix;
  let maxCell = 0;
  for (const areaKey of Object.keys(activeMatrix)) {
    for (const br of Object.keys(activeMatrix[areaKey])) {
      if (activeMatrix[areaKey][br] > maxCell) maxCell = activeMatrix[areaKey][br];
    }
  }

  const areaChartHeight = isBranchMode ? Math.max(320, areaRows.length * 34) : 288;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Penjualan per Region / Cabang */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isBranchMode ? 'Penjualan per Cabang' : 'Penjualan per Region'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {showMoM
                  ? `Perbandingan Net Sales Sep vs Okt 2026 (Rp Juta). Klik ${isBranchMode ? 'cabang' : 'region'} untuk toggle filter.`
                  : `Net Sales per ${isBranchMode ? 'cabang' : 'region'} pada periode terpilih (Rp Juta).`}
              </p>
            </div>

            <div
              role="group"
              aria-label="Level Breakdown Wilayah"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => setBreakdownLevel('region')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  !isBranchMode
                    ? 'bg-white text-[#C8102E] shadow-sm dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Region ({byRegion.length})
              </button>
              <button
                type="button"
                onClick={() => setBreakdownLevel('branch')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  isBranchMode
                    ? 'bg-white text-[#C8102E] shadow-sm dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Cabang ({byBranch.length})
              </button>
            </div>
          </div>

          <div style={{ height: `${areaChartHeight}px` }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              {showMoM ? (
                <BarChart
                  data={areaChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: tickColor }}
                    tickFormatter={(v) => `${v} Jt`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={104}
                    tick={{ fontSize: 11, fill: yTickColor, fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `Rp ${value.toLocaleString('id-ID')} Jt`,
                      name,
                    ]}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="September"
                    fill={isDark ? '#64748b' : '#94A3B8'}
                    radius={[0, 4, 4, 0]}
                    barSize={isBranchMode ? 8 : 11}
                  />
                  <Bar
                    dataKey="Oktober"
                    fill="#C8102E"
                    radius={[0, 4, 4, 0]}
                    barSize={isBranchMode ? 8 : 11}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={areaChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: tickColor }}
                    tickFormatter={(v) => `${v} Jt`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={104}
                    tick={{ fontSize: 11, fill: yTickColor, fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `Rp ${value.toLocaleString('id-ID')} Jt`,
                      'Net Sales',
                    ]}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Bar
                    dataKey="TotalJt"
                    fill="#C8102E"
                    radius={[0, 6, 6, 0]}
                    barSize={isBranchMode ? 14 : 20}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {areaRows.map((a) => {
              const isSelected = isBranchMode
                ? selectedBranches.includes(a.key)
                : selectedRegions.includes(a.key);
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => (isBranchMode ? onToggleBranch(a.key) : onToggleRegion(a.key))}
                  className={`flex w-full items-center justify-between py-2 px-2 text-left text-xs transition rounded-lg cursor-pointer ${
                    isSelected
                      ? 'bg-red-50 text-red-900 font-semibold dark:bg-red-950/50 dark:text-red-200'
                      : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800/70 dark:text-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {a.label}
                    </span>
                    {a.parentRegion && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {a.parentRegion}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {a.outletCount} outlet · {formatNumber(a.qtyCarton)} ktn
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatRupiahCompact(a.netSales)}
                    </span>
                    <span className="w-12 text-right text-[11px] text-slate-500 dark:text-slate-400">
                      {formatPercent(a.sharePct)}
                    </span>
                    {showMoM && a.momPct !== null && (
                      <span
                        className={`inline-flex w-16 items-center justify-end gap-0.5 text-[11px] font-semibold ${
                          a.momPct >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {a.momPct >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatPercent(a.momPct, true)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Penjualan per Brand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Penjualan per Brand
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kontribusi Net Sales dan volume karton per lini produk Dua Kelinci.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {byBrand.length} Brand
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandChartData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickFormatter={(v) => `${v} Jt`}
                />
                <YAxis
                  type="category"
                  dataKey="brand"
                  width={132}
                  tick={{ fontSize: 12, fill: yTickColor, fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(
                    _value: number,
                    _name: string,
                    props: {
                      payload?: { netSales: number; qtyCarton: number; sharePct: number };
                    }
                  ) => {
                    const p = props.payload;
                    if (!p) return ['', ''];
                    return [
                      `${formatRupiahFull(p.netSales)} (${formatNumber(p.qtyCarton)} karton · ${formatPercent(p.sharePct)})`,
                      'Net Sales',
                    ];
                  }}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                />
                <Bar dataKey="netSalesJt" radius={[0, 6, 6, 0]} barSize={18}>
                  {brandChartData.map((entry) => (
                    <Cell key={entry.brand} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {byBrand.map((b, idx) => (
              <div
                key={b.brand}
                className="flex items-center justify-between py-2 px-1 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: BRAND_COLORS[idx % BRAND_COLORS.length] }}
                  />
                  <span className="font-semibold text-slate-900 dark:text-white">{b.brand}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatNumber(b.qtyCarton)} ktn
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatRupiahCompact(b.netSales)}
                  </span>
                  <span className="w-12 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {formatPercent(b.sharePct)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matriks Region/Cabang x Brand */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-[#C8102E]" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isBranchMode
                  ? 'Matriks Penjualan: Cabang × Brand'
                  : 'Matriks Penjualan: Region × Brand'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peta distribusi omzet bersih tiap brand per {isBranchMode ? 'cabang' : 'region'}. Warna lebih pekat menandakan penjualan lebih tinggi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setBreakdownLevel('region')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  !isBranchMode
                    ? 'bg-white text-[#C8102E] shadow-sm dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Region
              </button>
              <button
                type="button"
                onClick={() => setBreakdownLevel('branch')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                  isBranchMode
                    ? 'bg-white text-[#C8102E] shadow-sm dark:bg-slate-900 dark:text-red-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Cabang
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMatrix((v) => !v)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              {showMatrix ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
        </div>

        {showMatrix && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2.5 pr-3 font-semibold">
                    {isBranchMode ? 'Cabang' : 'Region'}
                  </th>
                  {byBrand.map((b) => (
                    <th key={b.brand} className="px-2 py-2.5 text-right font-semibold">
                      {b.brand.replace('Kacang Dua Kelinci', 'Dua Kelinci')}
                    </th>
                  ))}
                  <th className="pl-3 py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {areaRows.map((a) => (
                  <tr key={a.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          isBranchMode ? onToggleBranch(a.key) : onToggleRegion(a.key)
                        }
                        className="hover:text-[#C8102E] dark:hover:text-red-400 underline-offset-2 hover:underline cursor-pointer"
                      >
                        {a.label}
                      </button>
                      {a.parentRegion && (
                        <span className="ml-1.5 text-[10px] font-normal text-slate-400 dark:text-slate-500">
                          {a.parentRegion}
                        </span>
                      )}
                    </td>
                    {byBrand.map((b) => {
                      const val = activeMatrix[a.key]?.[b.brand] ?? 0;
                      const ratio = maxCell > 0 ? val / maxCell : 0;
                      const bgAlpha = Math.max(isDark ? 0.14 : 0.05, Math.min(0.88, ratio * 0.88));
                      const useLightText = isDark ? true : ratio > 0.52;
                      return (
                        <td key={b.brand} className="p-1 text-right">
                          <div
                            title={`${a.label} · ${b.brand}: ${formatRupiahFull(val)}`}
                            className={`rounded-md px-2 py-1.5 font-medium tabular-nums ${
                              val > 0
                                ? useLightText
                                  ? 'text-white'
                                  : 'text-slate-800'
                                : 'text-slate-400 dark:text-slate-600'
                            }`}
                            style={{
                              backgroundColor:
                                val > 0
                                  ? `rgba(200, 16, 46, ${bgAlpha.toFixed(2)})`
                                  : isDark
                                    ? 'rgba(30, 41, 59, 0.5)'
                                    : '#f8fafc',
                            }}
                          >
                            {val > 0 ? formatRupiahCompact(val).replace('Rp ', '') : '-'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="pl-3 py-2 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatRupiahCompact(a.netSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
