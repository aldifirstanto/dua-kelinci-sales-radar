export interface RawSalesRow {
  date: string;
  invoice_no: string;
  region: string;
  branch: string;
  outlet_id: string;
  outlet_name: string;
  outlet_type: string;
  salesman: string;
  brand: string;
  sku: string;
  qty_carton: string | number;
  price_per_carton_idr: string | number;
  gross_sales_idr: string | number;
  discount_idr: string | number;
  net_sales_idr: string | number;
}

export interface CleanSalesRow {
  date: string;
  month: string; // YYYY-MM
  invoiceNo: string;
  region: string;
  branch: string;
  outletId: string;
  outletName: string;
  outletType: string;
  salesman: string;
  brand: string;
  sku: string;
  qtyCarton: number;
  pricePerCarton: number;
  grossSales: number;
  discount: number;
  netSales: number;
  isReturn: boolean;
}

export interface DuplicateRecord {
  date: string;
  invoiceNo: string;
  outletId: string;
  sku: string;
  netSales: number;
}

export interface DataQualityReport {
  rawRowCount: number;
  cleanRowCount: number;
  duplicatesRemoved: number;
  duplicateDetails: DuplicateRecord[];
  regionsNormalized: number;
  regionNormalizations: Array<{ from: string; to: string; count: number }>;
  whitespaceFixed: number;
  salesmanImputed: number;
  returnCount: number;
  returnNetSales: number;
}

/**
 * Empty array means "Semua" (no restriction on that dimension).
 */
export interface FilterState {
  regions: string[];
  branches: string[];
  months: string[];
  outletTypes: string[];
  brands: string[];
  skus: string[];
}

export interface RegionSummary {
  region: string;
  netSales: number;
  grossSales: number;
  discount: number;
  qtyCarton: number;
  sepNetSales: number;
  octNetSales: number;
  momPct: number | null;
  sharePct: number;
  outletCount: number;
  invoiceCount: number;
}

export interface BrandSummary {
  brand: string;
  netSales: number;
  grossSales: number;
  qtyCarton: number;
  sepNetSales: number;
  octNetSales: number;
  momPct: number | null;
  sharePct: number;
}

export interface BranchSummary {
  branch: string;
  region: string;
  netSales: number;
  grossSales: number;
  discount: number;
  qtyCarton: number;
  sepNetSales: number;
  octNetSales: number;
  momPct: number | null;
  sharePct: number;
  outletCount: number;
  invoiceCount: number;
}

export interface OutletPerformance {
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
  invoiceCount: number;
  skuCount: number;
  sepNetSales: number;
  octNetSales: number;
  momDelta: number;
  momPct: number | null;
  lastOrderDate: string;
  daysSinceLastOrder: number;
  avgOrderValue: number;
  weaknessReason: string;
  recommendation: string;
}

export interface DashboardMetrics {
  totalNetSales: number;
  totalGrossSales: number;
  totalDiscount: number;
  discountRatePct: number;
  totalCartons: number;
  uniqueOutlets: number;
  uniqueInvoices: number;
  avgInvoiceValue: number;
  sepNetSales: number;
  octNetSales: number;
  momGrowthPct: number | null;
  returnCount: number;
  returnNetSales: number;
  maxDate: string;
  minDate: string;
  byRegion: RegionSummary[];
  byBrand: BrandSummary[];
  byBranch: BranchSummary[];
  regionBrandMatrix: Record<string, Record<string, number>>;
  branchBrandMatrix: Record<string, Record<string, number>>;
  weakestOutlets: OutletPerformance[];
  biggestDrops: OutletPerformance[];
  allOutlets: OutletPerformance[];
}
