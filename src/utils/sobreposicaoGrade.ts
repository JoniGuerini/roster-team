/** Layout de turnos sobrepostos na grade horária (estilo agenda). */

export type ItemGradeTempo = {
  id: string;
  inicioMin: number;
  fimMin: number;
};

export type LayoutSobreposicao = {
  /** 0 = largura total; cada sobreposição empilha mais à direita e mais estreito. */
  nivel: number;
};

export function turnosSobrepostos(
  a: Pick<ItemGradeTempo, 'inicioMin' | 'fimMin'>,
  b: Pick<ItemGradeTempo, 'inicioMin' | 'fimMin'>,
): boolean {
  return a.inicioMin < b.fimMin && b.inicioMin < a.fimMin;
}

/**
 * Turnos sem conflito ficam em largura total.
 * Cada turno que sobrepõe outro(s) anterior(es) recebe nível > 0 e fica mais estreito.
 */
export function calcularLayoutSobreposicao(
  itens: ItemGradeTempo[],
): Map<string, LayoutSobreposicao> {
  const resultado = new Map<string, LayoutSobreposicao>();
  if (itens.length === 0) return resultado;

  const ordenados = [...itens].sort(
    (a, b) =>
      a.inicioMin - b.inicioMin ||
      a.fimMin - b.fimMin ||
      a.id.localeCompare(b.id),
  );

  for (const item of ordenados) {
    const anterioresSobrepostos = ordenados.filter(
      (outro) =>
        outro.id !== item.id &&
        turnosSobrepostos(outro, item) &&
        (outro.inicioMin < item.inicioMin ||
          (outro.inicioMin === item.inicioMin && outro.id < item.id)),
    );
    resultado.set(item.id, { nivel: anterioresSobrepostos.length });
  }

  return resultado;
}

const PADDING_LATERAL_PX = 4;
/** Deslocamento à direita por cada camada de sobreposição. */
const OFFSET_NIVEL_PCT = 12;

/** Converte layout em estilos inline para o card na coluna do dia. */
export function estiloBlocoSobreposicao(layout: LayoutSobreposicao): {
  left: string;
  width: string;
  zIndex: number;
} {
  const { nivel } = layout;

  if (nivel <= 0) {
    return {
      left: `${PADDING_LATERAL_PX}px`,
      width: `calc(100% - ${PADDING_LATERAL_PX * 2}px)`,
      zIndex: 1,
    };
  }

  const offsetPct = nivel * OFFSET_NIVEL_PCT;
  const larguraPct = 100 - offsetPct;

  return {
    left: `calc(${offsetPct}% + ${PADDING_LATERAL_PX}px)`,
    width: `calc(${larguraPct}% - ${PADDING_LATERAL_PX * 2}px)`,
    zIndex: nivel + 1,
  };
}
