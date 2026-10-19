// Arqueo del corte de caja: lo que la cajera contó vs lo que registró el sistema.
export interface CorteArqueoFields {
  total_efectivo_usd: number;
  total_efectivo_bs: number;
  total_tarjeta_bs: number;
  total_pagomovil_bs: number;
  counted_efectivo_usd?: number | null;
  counted_efectivo_bs?: number | null;
  counted_tarjeta_bs?: number | null;
  counted_pagomovil_bs?: number | null;
}

export interface ArqueoRow {
  label: string;
  currency: 'USD' | 'BS';
  esperado: number;
  contado: number;
  diferencia: number;
}

const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatArqueo = (r: ArqueoRow, v: number) => (r.currency === 'USD' ? `$${v.toFixed(2)}` : `Bs ${formatBs(v)}`);

// Cortes anteriores a la migración 00022 no tienen conteo: devuelve null
export function corteArqueo(c: CorteArqueoFields): ArqueoRow[] | null {
  if (c.counted_efectivo_usd == null) return null;
  const rows: [string, 'USD' | 'BS', number, number | null | undefined][] = [
    ['Efectivo $', 'USD', c.total_efectivo_usd, c.counted_efectivo_usd],
    ['Efectivo Bs', 'BS', c.total_efectivo_bs, c.counted_efectivo_bs],
    ['Tarjeta', 'BS', c.total_tarjeta_bs, c.counted_tarjeta_bs],
    ['Pago Móvil', 'BS', c.total_pagomovil_bs, c.counted_pagomovil_bs],
  ];
  return rows.map(([label, currency, e, k]) => {
    const esperado = Number(e) || 0;
    const contado = Number(k) || 0;
    return { label, currency, esperado, contado, diferencia: Math.round((contado - esperado) * 100) / 100 };
  });
}

// Tolerancia por billetes/monedas sueltas
export const cuadra = (r: ArqueoRow) => Math.abs(r.diferencia) < (r.currency === 'USD' ? 0.5 : 50);

export function arqueoHtml(c: CorteArqueoFields): string {
  const rows = corteArqueo(c);
  if (!rows) return '';
  return `<div class="divider"></div>
<div class="section-title">ARQUEO (CONTADO vs SISTEMA)</div>
<table>
  <tr><td></td><td class="r">Sistema</td><td class="r">Contado</td><td class="r">Dif.</td></tr>
${rows.map(r => `  <tr><td>${r.label}</td><td class="r">${formatArqueo(r, r.esperado)}</td><td class="r">${formatArqueo(r, r.contado)}</td><td class="r bold">${r.diferencia > 0 ? '+' : ''}${formatArqueo(r, r.diferencia)}</td></tr>`).join('\n')}
</table>`;
}
