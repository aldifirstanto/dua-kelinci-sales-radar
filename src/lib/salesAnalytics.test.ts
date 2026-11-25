import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeDashboardMetrics,
  generateTelegramSummary,
  parseAndCleanSalesCsv,
} from './salesAnalytics';
import type { FilterState } from '../types/sales';

const csvPath = path.resolve(process.cwd(), 'public/sales.csv');
const csvText = fs.readFileSync(csvPath, 'utf-8');

const ALL_FILTERS: FilterState = {
  regions: [],
  branches: [],
  months: [],
  outletTypes: [],
  brands: [],
  skus: [],
};

describe('salesAnalytics on Dua Kelinci sample sales.csv', () => {
  const { rows, quality } = parseAndCleanSalesCsv(csvText);

  it('cleans messy ERP data accurately', () => {
    expect(quality.rawRowCount).toBe(1891);
    expect(quality.duplicatesRemoved).toBe(3);
    expect(quality.cleanRowCount).toBe(1888);
    expect(quality.regionsNormalized).toBe(10);
    expect(quality.regionNormalizations.length).toBe(4);
    expect(quality.whitespaceFixed).toBe(4);
    expect(quality.salesmanImputed).toBe(5);
    expect(quality.returnCount).toBe(1);
    expect(quality.returnNetSales).toBe(-528000);
  });

  it('normalizes regions into 6 canonical Indonesian regions', () => {
    const metrics = computeDashboardMetrics(rows, ALL_FILTERS);
    expect(metrics.byRegion.map((r) => r.region)).toEqual([
      'Jabodetabek',
      'Sumatera',
      'Jawa Barat',
      'Jawa Tengah',
      'Jawa Timur',
      'Kalimantan',
    ]);
    expect(metrics.byBrand.length).toBe(8);
    expect(metrics.byBrand[0].brand).toBe('Kacang Dua Kelinci');
  });

  it('identifies the exact 5 weakest outlets by outlet_id without name collisions', () => {
    const metrics = computeDashboardMetrics(rows, ALL_FILTERS);
    expect(metrics.weakestOutlets.map((o) => o.outletId)).toEqual([
      'OUT1003',
      'OUT1026',
      'OUT1035',
      'OUT1045',
      'OUT1042',
    ]);
  });

  it('supports multi-select filtering across region, branch, brand, and SKU', () => {
    const multiFilter: FilterState = {
      regions: ['Jabodetabek', 'Jawa Tengah'],
      branches: ['Jakarta Barat', 'Solo'],
      months: ['2026-10'],
      outletTypes: ['Grosir', 'Minimarket'],
      brands: ['Tos Tos', 'Sukro'],
      skus: ['Tos Tos Tortilla BBQ 140g', 'Sukro Original 100g'],
    };
    const metrics = computeDashboardMetrics(rows, multiFilter);
    expect(metrics.byRegion.every((r) => multiFilter.regions.includes(r.region))).toBe(true);
    expect(metrics.byBranch.every((b) => multiFilter.branches.includes(b.branch))).toBe(true);
    expect(metrics.byBrand.every((b) => multiFilter.brands.includes(b.brand))).toBe(true);
    expect(metrics.totalNetSales).toBeGreaterThan(0);

    const summary = generateTelegramSummary(metrics, multiFilter);
    expect(summary).not.toContain('\n');
    expect(summary).toContain('Jakarta Barat');
  });

  it('computes full branch-level breakdown and branch x brand matrix (13 branches)', () => {
    const metrics = computeDashboardMetrics(rows, ALL_FILTERS);
    expect(metrics.byBranch.length).toBe(13);
    expect(Object.keys(metrics.branchBrandMatrix).length).toBe(13);
    const totalBranchNet = metrics.byBranch.reduce((acc, b) => acc + b.netSales, 0);
    expect(totalBranchNet).toBe(metrics.totalNetSales);
  });

  it('generates a single-paragraph Indonesian Telegram summary', () => {
    const metrics = computeDashboardMetrics(rows, ALL_FILTERS);
    const summary = generateTelegramSummary(metrics, ALL_FILTERS);
    expect(summary).not.toContain('\n');
    expect(summary).toContain('Dua Kelinci');
    expect(summary).toContain('Toko Sinar Abadi');
    expect(summary).toContain('Kacang Dua Kelinci');
  });
});
