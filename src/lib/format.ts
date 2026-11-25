export function formatRupiahFull(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.round(Math.abs(value));
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

export function formatRupiahCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} Rb`;
  }
  return `${sign}Rp ${Math.round(abs).toLocaleString('id-ID')}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('id-ID');
}

export function formatPercent(value: number | null, withSign = false): string {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1).replace('.', ',')}%`;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
};

const MONTH_FULL_LABELS: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

export function formatDateId(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${parseInt(d, 10)} ${MONTH_LABELS[m] ?? m} ${y}`;
}

export function formatMonthLabel(ym: string): string {
  if (ym === 'ALL') return 'Sep–Okt 2026 (Semua)';
  const [y, m] = ym.split('-');
  return `${MONTH_FULL_LABELS[m] ?? m} ${y}`;
}
