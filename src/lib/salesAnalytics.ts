import Papa from 'papaparse';
import type {
  BranchSummary,
  BrandSummary,
  CleanSalesRow,
  DashboardMetrics,
  DataQualityReport,
  DuplicateRecord,
  FilterState,
  OutletPerformance,
  RawSalesRow,
  RegionSummary,
} from '../types/sales';
import {
  formatDateId,
  formatMonthLabel,
  formatNumber,
  formatPercent,
  formatRupiahCompact,
  formatRupiahFull,
} from './format';

const REGION_CANONICAL_MAP: Record<string, string> = {
  jabodetabek: 'Jabodetabek',
  'jawa barat': 'Jawa Barat',
  jabar: 'Jawa Barat',
  'jawa tengah': 'Jawa Tengah',
  jateng: 'Jawa Tengah',
  'jawa timur': 'Jawa Timur',
  jatim: 'Jawa Timur',
  sumatera: 'Sumatera',
  sumatra: 'Sumatera',
  kalimantan: 'Kalimantan',
  sulawesi: 'Sulawesi',
  'bali & nusa tenggara': 'Bali & Nusa Tenggara',
};

function normalizeRegion(raw: string): { value: string; changed: boolean } {
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase();
  const mapped = REGION_CANONICAL_MAP[key];
  if (mapped) {
    return { value: mapped, changed: mapped !== trimmed };
  }
  return { value: trimmed, changed: false };
}

function toNumber(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseAndCleanSalesCsv(csvText: string): {
  rows: CleanSalesRow[];
  quality: DataQualityReport;
} {
  const parsed = Papa.parse<RawSalesRow>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const rawRows = parsed.data;
  let whitespaceFixed = 0;
  let regionsNormalized = 0;
  const regionNormCounts = new Map<string, { from: string; to: string; count: number }>();

  const seenKeys = new Set<string>();
  const duplicateDetails: DuplicateRecord[] = [];
  const tempRows: CleanSalesRow[] = [];
  const outletSalesmanFreq = new Map<string, Map<string, number>>();

  for (const r of rawRows) {
    if (!r.date || !r.invoice_no) continue;

    const cleanField = (val: string | undefined): string => {
      const s = val ?? '';
      const t = s.trim();
      if (s !== t) whitespaceFixed += 1;
      return t;
    };

    const date = cleanField(r.date);
    const invoiceNo = cleanField(r.invoice_no);
    const rawRegion = cleanField(r.region);
    const { value: region, changed: regionChanged } = normalizeRegion(rawRegion);
    const branch = cleanField(r.branch);
    const outletId = cleanField(r.outlet_id);
    const outletName = cleanField(r.outlet_name);
    const outletType = cleanField(r.outlet_type);
    const salesman = cleanField(r.salesman);
    const brand = cleanField(r.brand);
    const sku = cleanField(r.sku);

    const qtyCarton = toNumber(r.qty_carton);
    const pricePerCarton = toNumber(r.price_per_carton_idr);
    const grossSales = toNumber(r.gross_sales_idr);
    const discount = toNumber(r.discount_idr);
    const netSales = toNumber(r.net_sales_idr);

    const rowSignature = [
      date,
      invoiceNo,
      region,
      branch,
      outletId,
      outletName,
      outletType,
      salesman,
      brand,
      sku,
      qtyCarton,
      pricePerCarton,
      grossSales,
      discount,
      netSales,
    ].join('|');

    if (seenKeys.has(rowSignature)) {
      duplicateDetails.push({ date, invoiceNo, outletId, sku, netSales });
      continue;
    }
    seenKeys.add(rowSignature);

    if (regionChanged) {
      regionsNormalized += 1;
      const mapKey = `${rawRegion}->${region}`;
      const existing = regionNormCounts.get(mapKey);
      if (existing) {
        existing.count += 1;
      } else {
        regionNormCounts.set(mapKey, { from: rawRegion, to: region, count: 1 });
      }
    }

    if (salesman) {
      let freq = outletSalesmanFreq.get(outletId);
      if (!freq) {
        freq = new Map<string, number>();
        outletSalesmanFreq.set(outletId, freq);
      }
      freq.set(salesman, (freq.get(salesman) ?? 0) + 1);
    }

    const isReturn = qtyCarton < 0 || netSales < 0 || invoiceNo.toUpperCase().startsWith('RTR');

    tempRows.push({
      date,
      month: date.slice(0, 7),
      invoiceNo,
      region,
      branch,
      outletId,
      outletName,
      outletType,
      salesman,
      brand,
      sku,
      qtyCarton,
      pricePerCarton,
      grossSales,
      discount,
      netSales,
      isReturn,
    });
  }

  let salesmanImputed = 0;
  let returnCount = 0;
  let returnNetSales = 0;

  const rows = tempRows.map((row) => {
    if (row.isReturn) {
      returnCount += 1;
      returnNetSales += row.netSales;
    }
    if (!row.salesman) {
      const freq = outletSalesmanFreq.get(row.outletId);
      let bestSalesman = 'Belum Ditugaskan';
      let bestCount = 0;
      if (freq) {
        for (const [name, cnt] of freq.entries()) {
          if (cnt > bestCount) {
            bestCount = cnt;
            bestSalesman = name;
          }
        }
      }
      salesmanImputed += 1;
      return { ...row, salesman: bestSalesman };
    }
    return row;
  });

  return {
    rows,
    quality: {
      rawRowCount: rawRows.length,
      cleanRowCount: rows.length,
      duplicatesRemoved: duplicateDetails.length,
      duplicateDetails,
      regionsNormalized,
      regionNormalizations: Array.from(regionNormCounts.values()).sort((a, b) => b.count - a.count),
      whitespaceFixed,
      salesmanImputed,
      returnCount,
      returnNetSales,
    },
  };
}

function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

function buildOutletDiagnosis(o: {
  netSales: number;
  invoiceCount: number;
  sepNetSales: number;
  octNetSales: number;
  momPct: number | null;
  daysSinceLastOrder: number;
  avgOrderValue: number;
  salesman: string;
}): { weaknessReason: string; recommendation: string } {
  const reasons: string[] = [];
  if (o.invoiceCount <= 4) {
    reasons.push(`frekuensi order rendah (${o.invoiceCount} invoice)`);
  }
  if (o.avgOrderValue < 250_000) {
    reasons.push(`nilai order kecil (${formatRupiahCompact(o.avgOrderValue)}/inv)`);
  }
  if (o.momPct !== null && o.momPct <= -25) {
    reasons.push(`turun ${formatPercent(o.momPct)} di Okt`);
  }
  if (o.daysSinceLastOrder >= 7) {
    reasons.push(`belum order ${o.daysSinceLastOrder} hari`);
  }

  const weaknessReason =
    reasons.length > 0 ? reasons.join(' · ') : 'omzet kumulatif paling rendah di area';

  let recommendation = `Jadwalkan kunjungan bersama ${o.salesman} untuk audit pajangan & dorong paket SKU terlaris.`;
  if (o.momPct !== null && o.momPct <= -25) {
    recommendation = `Konfirmasi ke ${o.salesman} penyebab penurunan Oktober; cek stok kompetitor & tawarkan promo repeat order.`;
  } else if (o.invoiceCount <= 4 || o.daysSinceLastOrder >= 7) {
    recommendation = `Minta ${o.salesman} lakukan follow-up kunjungan minggu ini untuk aktifkan kembali jadwal order rutin.`;
  } else if (o.avgOrderValue < 250_000) {
    recommendation = `Arahkan ${o.salesman} cross-sell Tos Tos/Sukro selain Kacang Kulit untuk naikkan nilai per invoice.`;
  }

  return { weaknessReason, recommendation };
}

export function computeDashboardMetrics(
  allRows: CleanSalesRow[],
  filters: FilterState
): DashboardMetrics {
  const matchesNonMonth = (r: CleanSalesRow): boolean => {
    if (filters.regions.length > 0 && !filters.regions.includes(r.region)) return false;
    if (filters.branches.length > 0 && !filters.branches.includes(r.branch)) return false;
    if (filters.outletTypes.length > 0 && !filters.outletTypes.includes(r.outletType)) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(r.brand)) return false;
    if (filters.skus.length > 0 && !filters.skus.includes(r.sku)) return false;
    return true;
  };

  const momScopeRows = allRows.filter(matchesNonMonth);
  const filtered = momScopeRows.filter(
    (r) => filters.months.length === 0 || filters.months.includes(r.month)
  );

  let totalNetSales = 0;
  let totalGrossSales = 0;
  let totalDiscount = 0;
  let totalCartons = 0;
  let returnCount = 0;
  let returnNetSales = 0;
  let minDate = '';
  let maxDate = '';

  const outletSet = new Set<string>();
  const invoiceSet = new Set<string>();

  const regionMap = new Map<
    string,
    {
      netSales: number;
      grossSales: number;
      discount: number;
      qtyCarton: number;
      sepNetSales: number;
      octNetSales: number;
      outlets: Set<string>;
      invoices: Set<string>;
    }
  >();

  const brandMap = new Map<
    string,
    {
      netSales: number;
      grossSales: number;
      qtyCarton: number;
      sepNetSales: number;
      octNetSales: number;
    }
  >();

  const branchMap = new Map<
    string,
    {
      branch: string;
      region: string;
      netSales: number;
      grossSales: number;
      discount: number;
      qtyCarton: number;
      sepNetSales: number;
      octNetSales: number;
      outlets: Set<string>;
      invoices: Set<string>;
    }
  >();

  const regionBrandMatrix: Record<string, Record<string, number>> = {};
  const branchBrandMatrix: Record<string, Record<string, number>> = {};

  const outletMap = new Map<
    string,
    {
      outletId: string;
      outletName: string;
      outletType: string;
      region: string;
      branch: string;
      salesman: string;
      netSales: number;
      grossSales: number;
      discount: number;
      qtyCarton: number;
      invoices: Set<string>;
      skus: Set<string>;
      sepNetSales: number;
      octNetSales: number;
      lastOrderDate: string;
    }
  >();

  for (const r of filtered) {
    totalNetSales += r.netSales;
    totalGrossSales += r.grossSales;
    totalDiscount += r.discount;
    totalCartons += r.qtyCarton;
    if (r.isReturn) {
      returnCount += 1;
      returnNetSales += r.netSales;
    }
    if (!minDate || r.date < minDate) minDate = r.date;
    if (!maxDate || r.date > maxDate) maxDate = r.date;

    outletSet.add(r.outletId);
    if (!r.isReturn) invoiceSet.add(r.invoiceNo);

    let reg = regionMap.get(r.region);
    if (!reg) {
      reg = {
        netSales: 0,
        grossSales: 0,
        discount: 0,
        qtyCarton: 0,
        sepNetSales: 0,
        octNetSales: 0,
        outlets: new Set(),
        invoices: new Set(),
      };
      regionMap.set(r.region, reg);
    }
    reg.netSales += r.netSales;
    reg.grossSales += r.grossSales;
    reg.discount += r.discount;
    reg.qtyCarton += r.qtyCarton;
    if (r.month === '2026-09') reg.sepNetSales += r.netSales;
    if (r.month === '2026-10') reg.octNetSales += r.netSales;
    reg.outlets.add(r.outletId);
    if (!r.isReturn) reg.invoices.add(r.invoiceNo);

    let br = brandMap.get(r.brand);
    if (!br) {
      br = { netSales: 0, grossSales: 0, qtyCarton: 0, sepNetSales: 0, octNetSales: 0 };
      brandMap.set(r.brand, br);
    }
    br.netSales += r.netSales;
    br.grossSales += r.grossSales;
    br.qtyCarton += r.qtyCarton;
    if (r.month === '2026-09') br.sepNetSales += r.netSales;
    if (r.month === '2026-10') br.octNetSales += r.netSales;

    const branchKey = `${r.region}|${r.branch}`;
    let brn = branchMap.get(branchKey);
    if (!brn) {
      brn = {
        branch: r.branch,
        region: r.region,
        netSales: 0,
        grossSales: 0,
        discount: 0,
        qtyCarton: 0,
        sepNetSales: 0,
        octNetSales: 0,
        outlets: new Set(),
        invoices: new Set(),
      };
      branchMap.set(branchKey, brn);
    }
    brn.netSales += r.netSales;
    brn.grossSales += r.grossSales;
    brn.discount += r.discount;
    brn.qtyCarton += r.qtyCarton;
    if (r.month === '2026-09') brn.sepNetSales += r.netSales;
    if (r.month === '2026-10') brn.octNetSales += r.netSales;
    brn.outlets.add(r.outletId);
    if (!r.isReturn) brn.invoices.add(r.invoiceNo);

    if (!regionBrandMatrix[r.region]) regionBrandMatrix[r.region] = {};
    regionBrandMatrix[r.region][r.brand] =
      (regionBrandMatrix[r.region][r.brand] ?? 0) + r.netSales;

    if (!branchBrandMatrix[r.branch]) branchBrandMatrix[r.branch] = {};
    branchBrandMatrix[r.branch][r.brand] =
      (branchBrandMatrix[r.branch][r.brand] ?? 0) + r.netSales;

    let out = outletMap.get(r.outletId);
    if (!out) {
      out = {
        outletId: r.outletId,
        outletName: r.outletName,
        outletType: r.outletType,
        region: r.region,
        branch: r.branch,
        salesman: r.salesman,
        netSales: 0,
        grossSales: 0,
        discount: 0,
        qtyCarton: 0,
        invoices: new Set(),
        skus: new Set(),
        sepNetSales: 0,
        octNetSales: 0,
        lastOrderDate: r.date,
      };
      outletMap.set(r.outletId, out);
    }
    out.netSales += r.netSales;
    out.grossSales += r.grossSales;
    out.discount += r.discount;
    out.qtyCarton += r.qtyCarton;
    if (!r.isReturn) out.invoices.add(r.invoiceNo);
    out.skus.add(r.sku);
    if (r.month === '2026-09') out.sepNetSales += r.netSales;
    if (r.month === '2026-10') out.octNetSales += r.netSales;
    if (r.date > out.lastOrderDate) out.lastOrderDate = r.date;
  }

  let sepNetSales = 0;
  let octNetSales = 0;
  let referenceMaxDate = maxDate || '2026-10-31';
  for (const r of momScopeRows) {
    if (r.month === '2026-09') sepNetSales += r.netSales;
    if (r.month === '2026-10') octNetSales += r.netSales;
    if (r.date > referenceMaxDate) referenceMaxDate = r.date;
  }

  const momGrowthPct = sepNetSales > 0 ? ((octNetSales - sepNetSales) / sepNetSales) * 100 : null;
  const discountRatePct = totalGrossSales > 0 ? (totalDiscount / totalGrossSales) * 100 : 0;
  const avgInvoiceValue = invoiceSet.size > 0 ? totalNetSales / invoiceSet.size : 0;

  const byRegion: RegionSummary[] = Array.from(regionMap.entries())
    .map(([region, d]) => ({
      region,
      netSales: d.netSales,
      grossSales: d.grossSales,
      discount: d.discount,
      qtyCarton: d.qtyCarton,
      sepNetSales: d.sepNetSales,
      octNetSales: d.octNetSales,
      momPct: d.sepNetSales > 0 ? ((d.octNetSales - d.sepNetSales) / d.sepNetSales) * 100 : null,
      sharePct: totalNetSales > 0 ? (d.netSales / totalNetSales) * 100 : 0,
      outletCount: d.outlets.size,
      invoiceCount: d.invoices.size,
    }))
    .sort((a, b) => b.netSales - a.netSales);

  const byBrand: BrandSummary[] = Array.from(brandMap.entries())
    .map(([brand, d]) => ({
      brand,
      netSales: d.netSales,
      grossSales: d.grossSales,
      qtyCarton: d.qtyCarton,
      sepNetSales: d.sepNetSales,
      octNetSales: d.octNetSales,
      momPct: d.sepNetSales > 0 ? ((d.octNetSales - d.sepNetSales) / d.sepNetSales) * 100 : null,
      sharePct: totalNetSales > 0 ? (d.netSales / totalNetSales) * 100 : 0,
    }))
    .sort((a, b) => b.netSales - a.netSales);

  const byBranch: BranchSummary[] = Array.from(branchMap.values())
    .map((d) => ({
      branch: d.branch,
      region: d.region,
      netSales: d.netSales,
      grossSales: d.grossSales,
      discount: d.discount,
      qtyCarton: d.qtyCarton,
      sepNetSales: d.sepNetSales,
      octNetSales: d.octNetSales,
      momPct: d.sepNetSales > 0 ? ((d.octNetSales - d.sepNetSales) / d.sepNetSales) * 100 : null,
      sharePct: totalNetSales > 0 ? (d.netSales / totalNetSales) * 100 : 0,
      outletCount: d.outlets.size,
      invoiceCount: d.invoices.size,
    }))
    .sort((a, b) => b.netSales - a.netSales);

  const allOutlets: OutletPerformance[] = Array.from(outletMap.values()).map((o) => {
    const invoiceCount = o.invoices.size;
    const avgOrderValue = invoiceCount > 0 ? o.netSales / invoiceCount : o.netSales;
    const momDelta = o.octNetSales - o.sepNetSales;
    const momPct = o.sepNetSales > 0 ? (momDelta / o.sepNetSales) * 100 : null;
    const daysSinceLastOrder = diffDays(o.lastOrderDate, referenceMaxDate);
    const { weaknessReason, recommendation } = buildOutletDiagnosis({
      netSales: o.netSales,
      invoiceCount,
      sepNetSales: o.sepNetSales,
      octNetSales: o.octNetSales,
      momPct,
      daysSinceLastOrder,
      avgOrderValue,
      salesman: o.salesman,
    });

    return {
      outletId: o.outletId,
      outletName: o.outletName,
      outletType: o.outletType,
      region: o.region,
      branch: o.branch,
      salesman: o.salesman,
      netSales: o.netSales,
      grossSales: o.grossSales,
      discount: o.discount,
      qtyCarton: o.qtyCarton,
      invoiceCount,
      skuCount: o.skus.size,
      sepNetSales: o.sepNetSales,
      octNetSales: o.octNetSales,
      momDelta,
      momPct,
      lastOrderDate: o.lastOrderDate,
      daysSinceLastOrder,
      avgOrderValue,
      weaknessReason,
      recommendation,
    };
  });

  const weakestOutlets = [...allOutlets]
    .sort((a, b) => a.netSales - b.netSales)
    .slice(0, 5);

  const biggestDrops = [...allOutlets]
    .filter((o) => o.sepNetSales > 0 && o.momDelta < 0)
    .sort((a, b) => a.momDelta - b.momDelta)
    .slice(0, 5);

  return {
    totalNetSales,
    totalGrossSales,
    totalDiscount,
    discountRatePct,
    totalCartons,
    uniqueOutlets: outletSet.size,
    uniqueInvoices: invoiceSet.size,
    avgInvoiceValue,
    sepNetSales,
    octNetSales,
    momGrowthPct,
    returnCount,
    returnNetSales,
    minDate,
    maxDate,
    byRegion,
    byBrand,
    byBranch,
    regionBrandMatrix,
    branchBrandMatrix,
    weakestOutlets,
    biggestDrops,
    allOutlets,
  };
}

function summarizeSelection(items: string[], maxInline = 2): string {
  if (items.length <= maxInline) return items.join(', ');
  return `${items.slice(0, maxInline).join(', ')} (+${items.length - maxInline} lainnya)`;
}

/**
 * Menghasilkan ringkasan SATU PARAGRAF dalam Bahasa Indonesia yang siap dibaca
 * Area Sales Manager di Telegram (dinamis mengikuti seluruh filter multi-select).
 */
export function generateTelegramSummary(
  metrics: DashboardMetrics,
  filters: FilterState
): string {
  if (metrics.uniqueOutlets === 0) {
    return 'Belum ada data transaksi penjualan pada kombinasi filter yang dipilih. Silakan ubah filter wilayah, periode, tipe outlet, brand, atau SKU untuk melihat ringkasan Telegram.';
  }

  const scopeLabel =
    filters.branches.length > 0
      ? `Cabang ${summarizeSelection(filters.branches, 3)}`
      : filters.regions.length === 0
        ? 'Nasional (6 region)'
        : `Region ${summarizeSelection(filters.regions, 3)}`;

  const showMultiMonthComparison =
    filters.months.length === 0 ||
    (filters.months.includes('2026-09') && filters.months.includes('2026-10'));

  const periodLabel =
    filters.months.length === 0
      ? `periode ${formatDateId(metrics.minDate)}–${formatDateId(metrics.maxDate)}`
      : filters.months.length === 1
        ? `periode ${formatMonthLabel(filters.months[0])}`
        : `periode ${filters.months.map(formatMonthLabel).join(' & ')}`;

  const extraFilters: string[] = [];
  if (filters.outletTypes.length > 0) {
    extraFilters.push(`segmen ${summarizeSelection(filters.outletTypes)}`);
  }
  if (filters.brands.length > 0) {
    extraFilters.push(`brand ${summarizeSelection(filters.brands)}`);
  }
  if (filters.skus.length > 0) {
    extraFilters.push(`SKU ${summarizeSelection(filters.skus, 1)}`);
  }
  const filterSuffix = extraFilters.length > 0 ? ` (${extraFilters.join('; ')})` : '';

  const momClause =
    showMultiMonthComparison && metrics.momGrowthPct !== null
      ? ` dengan pertumbuhan Oktober vs September sebesar ${formatPercent(metrics.momGrowthPct, true)} (${formatRupiahCompact(metrics.sepNetSales)} menjadi ${formatRupiahCompact(metrics.octNetSales)})`
      : '';

  const topAreaClause =
    metrics.byRegion.length > 1
      ? `Kontributor wilayah terbesar adalah ${metrics.byRegion[0].region} (${formatRupiahCompact(metrics.byRegion[0].netSales)}, ${formatPercent(metrics.byRegion[0].sharePct)} share) sementara ${metrics.byRegion[metrics.byRegion.length - 1].region} paling kecil (${formatRupiahCompact(metrics.byRegion[metrics.byRegion.length - 1].netSales)})`
      : metrics.byBranch.length > 0
        ? `Cabang terkuat di area ini adalah ${metrics.byBranch[0].branch} (${formatRupiahCompact(metrics.byBranch[0].netSales)})`
        : '';

  const topBrand = metrics.byBrand[0];
  const secondBrand = metrics.byBrand[1];
  const brandClause = topBrand
    ? secondBrand
      ? `Dari sisi produk, ${topBrand.brand} memimpin (${formatPercent(topBrand.sharePct)} share / ${formatRupiahCompact(topBrand.netSales)}), diikuti ${secondBrand.brand} (${formatPercent(secondBrand.sharePct)}).`
      : `Dari sisi produk, ${topBrand.brand} menjadi kontributor utama sebesar ${formatRupiahCompact(topBrand.netSales)}.`
    : '';

  const weakList = metrics.weakestOutlets
    .map(
      (o) =>
        `${o.outletName} ${o.branch} (${formatRupiahFull(o.netSales)}, PIC ${o.salesman})`
    )
    .join('; ');

  const dropHighlight =
    showMultiMonthComparison && metrics.biggestDrops.length > 0
      ? ` Selain itu, perlu pantauan khusus pada ${metrics.biggestDrops[0].outletName} (${metrics.biggestDrops[0].branch}) yang omzetnya turun ${formatPercent(metrics.biggestDrops[0].momPct)} di Oktober.`
      : '';

  return (
    `Update Penjualan Dua Kelinci ${scopeLabel}${filterSuffix} (${periodLabel}): ` +
    `total net sales mencapai ${formatRupiahCompact(metrics.totalNetSales)} (${formatNumber(metrics.totalCartons)} karton dari ${metrics.uniqueOutlets} outlet aktif)${momClause}. ` +
    `${topAreaClause ? `${topAreaClause}. ` : ''}` +
    `${brandClause} ` +
    `Prioritas tindak lanjut tim lapangan minggu ini adalah ${metrics.weakestOutlets.length} outlet terlemah: ${weakList}. Mohon koordinasi dengan masing-masing salesman PIC untuk kunjungan evaluasi dan dorong repeat order.` +
    dropHighlight
  );
}
