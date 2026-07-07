type BarDatum = { label: string; value: number };

/**
 * Barras verticales de una sola serie (magnitud a lo largo del tiempo).
 * Una sola serie no necesita leyenda — el título del card ya la nombra.
 * Estilo: barra delgada, extremo superior redondeado, anclada a la base,
 * separación entre barras, etiqueta de valor directa (cardinalidad baja).
 */
export function SimpleBarChart({
  data,
  colorVar = "--chart-1",
  formatValue = (v) => String(v),
  height = 140,
}: {
  data: BarDatum[];
  colorVar?: string;
  formatValue?: (value: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => {
        const barHeight = Math.max(2, (d.value / max) * (height - 28));
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-medium text-foreground">{formatValue(d.value)}</span>
            <div
              className="w-full rounded-t-md"
              style={{ height: barHeight, background: `var(${colorVar})` }}
            />
            <span className="text-[11px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
