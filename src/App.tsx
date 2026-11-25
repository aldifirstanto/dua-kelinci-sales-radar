import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Moon,
  Package,
  Percent,
  RotateCcw,
  Sun,
  Upload,
  Wallet,
} from 'lucide-react';
import {
  computeDashboardMetrics,
  generateTelegramSummary,
  parseAndCleanSalesCsv,
} from './lib/salesAnalytics';
import {
  formatMonthLabel,
  formatNumber,
  formatPercent,
  formatRupiahCompact,
  formatRupiahFull,
} from './lib/format';
import type { CleanSalesRow, DataQualityReport, FilterState } from './types/sales';
import { TelegramDigestCard } from './components/TelegramDigestCard';
import { RegionBrandCharts } from './components/RegionBrandCharts';
import { WeakestOutletsSection } from './components/WeakestOutletsSection';
import { DataQualityDrawer } from './components/DataQualityDrawer';
import { MultiSelectSlicer } from './components/MultiSelectSlicer';

const INITIAL_FILTERS: FilterState = {
  regions: [],
  branches: [],
  months: [],
  outletTypes: [],
  brands: [],
  skus: [],
};

export function App() {
  const [rows, setRows] = useState<CleanSalesRow[]>([]);
  const [quality, setQuality] = useState<DataQualityReport | null>(null);
  const [fileName, setFileName] = useState('sales.csv');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dk-theme') === 'dark';
    } catch {
      return false;
    }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('dk-theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  const loadDefaultCsv = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/sales.csv');
      if (!res.ok) throw new Error('Gagal memuat file sales.csv bawaan.');
      const text = await res.text();
      const result = parseAndCleanSalesCsv(text);
      setRows(result.rows);
      setQuality(result.quality);
      setFileName('sales.csv (Bawaan)');
      setFilters(INITIAL_FILTERS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDefaultCsv();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const result = parseAndCleanSalesCsv(text);
        if (result.rows.length === 0) {
          setError('File CSV tidak memiliki baris data penjualan yang valid.');
          return;
        }
        setRows(result.rows);
        setQuality(result.quality);
        setFileName(file.name);
        setFilters(INITIAL_FILTERS);
        setError(null);
      } catch {
        setError('Format file CSV tidak dapat dibaca. Pastikan kolom sesuai template sales.csv.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.region)))
        .sort()
        .map((r) => ({ value: r, label: r })),
    [rows]
  );

  const monthOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.month)))
        .sort()
        .map((m) => ({ value: m, label: formatMonthLabel(m) })),
    [rows]
  );

  const outletTypeOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.outletType)))
        .sort()
        .map((t) => ({ value: t, label: t })),
    [rows]
  );

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.brand)))
        .sort()
        .map((b) => ({ value: b, label: b })),
    [rows]
  );

  // SKU options cascade with selected brands while preserving brand sublabel for searchability
  const skuOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (filters.brands.length > 0 && !filters.brands.includes(r.brand)) continue;
      if (!map.has(r.sku)) map.set(r.sku, r.brand);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([sku, brand]) => ({ value: sku, label: sku, sublabel: brand }));
  }, [rows, filters.brands]);

  const handleBrandsChange = (nextBrands: string[]) => {
    setFilters((prev) => {
      if (nextBrands.length === 0) {
        return { ...prev, brands: nextBrands };
      }
      const allowedSkus = new Set(
        rows.filter((r) => nextBrands.includes(r.brand)).map((r) => r.sku)
      );
      return {
        ...prev,
        brands: nextBrands,
        skus: prev.skus.filter((s) => allowedSkus.has(s)),
      };
    });
  };

  const handleRegionsChange = (nextRegions: string[]) => {
    setFilters((prev) => {
      if (nextRegions.length === 0) {
        return { ...prev, regions: nextRegions };
      }
      const allowedBranches = new Set(
        rows.filter((r) => nextRegions.includes(r.region)).map((r) => r.branch)
      );
      return {
        ...prev,
        regions: nextRegions,
        branches: prev.branches.filter((b) => allowedBranches.has(b)),
      };
    });
  };

  const handleToggleRegion = (region: string) => {
    const exists = filters.regions.includes(region);
    handleRegionsChange(
      exists ? filters.regions.filter((r) => r !== region) : [...filters.regions, region]
    );
  };

  const handleToggleBranch = (branch: string) => {
    setFilters((prev) => {
      const exists = prev.branches.includes(branch);
      return {
        ...prev,
        branches: exists
          ? prev.branches.filter((b) => b !== branch)
          : [...prev.branches, branch],
      };
    });
  };

  const metrics = useMemo(() => computeDashboardMetrics(rows, filters), [rows, filters]);
  const telegramSummary = useMemo(
    () => generateTelegramSummary(metrics, filters),
    [metrics, filters]
  );

  const showMoM =
    filters.months.length === 0 ||
    (filters.months.includes('2026-09') && filters.months.includes('2026-10'));

  const activeFilterCount =
    filters.regions.length +
    filters.branches.length +
    filters.months.length +
    filters.outletTypes.length +
    filters.brands.length +
    filters.skus.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8102E] text-white font-extrabold text-sm shadow-sm">
              DK
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Radar Penjualan Area — PT Dua Kelinci
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dashboard Area Sales Manager · Monitoring Region, Brand, 5 Outlet Terlemah &amp; Ringkasan Telegram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Ubah ke Mode Terang' : 'Ubah ke Mode Gelap'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  Mode Terang
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-600" />
                  Mode Gelap
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-[#C8102E] dark:text-red-400" />
              Unggah CSV Baru
            </button>
            {fileName !== 'sales.csv (Bawaan)' && (
              <button
                type="button"
                onClick={() => void loadDefaultCsv()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Data Bawaan
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Memuat dan membersihkan data penjualan...
          </div>
        ) : (
          <>
            {/* Filter Bar Multi-Select untuk Area Sales Manager */}
            <section
              aria-label="Filter Area Sales Manager"
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-1 flex-wrap items-end gap-3">
                  <MultiSelectSlicer
                    id="slicer-region"
                    label="Wilayah / Region"
                    placeholder="Semua Region"
                    options={regionOptions}
                    selected={filters.regions}
                    onChange={handleRegionsChange}
                  />

                  <MultiSelectSlicer
                    id="slicer-month"
                    label="Periode"
                    placeholder="Semua Periode"
                    options={monthOptions}
                    selected={filters.months}
                    onChange={(months) => setFilters((f) => ({ ...f, months }))}
                  />

                  <MultiSelectSlicer
                    id="slicer-outlet-type"
                    label="Tipe Outlet"
                    placeholder="Semua Tipe"
                    options={outletTypeOptions}
                    selected={filters.outletTypes}
                    onChange={(outletTypes) => setFilters((f) => ({ ...f, outletTypes }))}
                  />

                  <MultiSelectSlicer
                    id="slicer-brand"
                    label="Brand"
                    placeholder="Semua Brand"
                    options={brandOptions}
                    selected={filters.brands}
                    onChange={handleBrandsChange}
                  />

                  <MultiSelectSlicer
                    id="slicer-sku"
                    label="SKU"
                    placeholder="Semua SKU"
                    options={skuOptions}
                    selected={filters.skus}
                    onChange={(skus) => setFilters((f) => ({ ...f, skus }))}
                    searchable
                    searchPlaceholder="Cari nama SKU atau brand..."
                  />
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(INITIAL_FILTERS)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Filter ({activeFilterCount})
                  </button>
                )}
              </div>
            </section>

            {/* Audit Data ERP */}
            {quality && <DataQualityDrawer quality={quality} fileName={fileName} />}

            {/* KPI Cards */}
            <section
              aria-label="Indikator Kinerja Utama"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Total Net Sales</span>
                  <Wallet className="h-4 w-4 text-[#C8102E] dark:text-red-400" />
                </div>
                <div
                  className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white"
                  title={formatRupiahFull(metrics.totalNetSales)}
                >
                  {formatRupiahCompact(metrics.totalNetSales)}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {metrics.momGrowthPct !== null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 font-bold ${
                        metrics.momGrowthPct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {metrics.momGrowthPct >= 0 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {formatPercent(metrics.momGrowthPct, true)}
                    </span>
                  ) : null}
                  <span className="text-slate-500 dark:text-slate-400">Okt vs Sep</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Volume Terjual</span>
                  <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatNumber(metrics.totalCartons)}{' '}
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    karton
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Rata-rata{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {formatRupiahCompact(
                      metrics.totalCartons > 0
                        ? metrics.totalNetSales / metrics.totalCartons
                        : 0
                    )}
                  </strong>{' '}
                  / karton
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Outlet Aktif &amp; Invoice</span>
                  <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatNumber(metrics.uniqueOutlets)}{' '}
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    outlet
                  </span>
                </div>
                <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatNumber(metrics.uniqueInvoices)} invoice · rata-rata{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {formatRupiahCompact(metrics.avgInvoiceValue)}
                  </strong>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Diskon &amp; Retur</span>
                  <Percent className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatPercent(metrics.discountRatePct)}
                </div>
                <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Diskon {formatRupiahCompact(metrics.totalDiscount)} · {metrics.returnCount} retur
                </div>
              </div>
            </section>

            {/* Ringkasan 1 Paragraf Telegram */}
            <TelegramDigestCard summary={telegramSummary} filters={filters} />

            {/* 5 Outlet Terlemah */}
            <WeakestOutletsSection
              weakestOutlets={metrics.weakestOutlets}
              biggestDrops={metrics.biggestDrops}
              showMoM={showMoM}
            />

            {/* Penjualan per Region / Cabang & Brand + Matriks */}
            <RegionBrandCharts
              byRegion={metrics.byRegion}
              byBranch={metrics.byBranch}
              byBrand={metrics.byBrand}
              regionBrandMatrix={metrics.regionBrandMatrix}
              branchBrandMatrix={metrics.branchBrandMatrix}
              selectedRegions={filters.regions}
              selectedBranches={filters.branches}
              showMoM={showMoM}
              isDark={isDark}
              onToggleRegion={handleToggleRegion}
              onToggleBranch={handleToggleBranch}
            />
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Radar Penjualan Area PT Dua Kelinci · Dibuat untuk Tes AI Builder (Vibe Coder) · Data periode September–Oktober 2026
      </footer>
    </div>
  );
}

export default App;
