export const NOMES_DIAS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

export const NOMES_DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function hojeISO(): string {
  return toISO(new Date());
}

export function toISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function fromISO(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1);
}

export function adicionarDias(iso: string, dias: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + dias);
  return toISO(d);
}

export function adicionarMeses(iso: string, meses: number): string {
  const d = fromISO(iso);
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + meses);
  const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, ultimoDia));
  return toISO(d);
}

export function inicioSemana(iso: string): string {
  const d = fromISO(iso);
  const diaSemana = d.getDay();
  d.setDate(d.getDate() - diaSemana);
  return toISO(d);
}

export function diasDaSemana(iso: string): string[] {
  const inicio = inicioSemana(iso);
  return Array.from({ length: 7 }, (_, i) => adicionarDias(inicio, i));
}

export function diasDoMesGrade(iso: string): string[] {
  const referencia = fromISO(iso);
  const primeiro = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const inicioGrade = new Date(primeiro);
  inicioGrade.setDate(primeiro.getDate() - primeiro.getDay());

  const dias: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrade);
    d.setDate(inicioGrade.getDate() + i);
    dias.push(toISO(d));
  }
  return dias;
}

export function ehHoje(iso: string): boolean {
  return iso === hojeISO();
}

export function ehMesmoMes(iso: string, referencia: string): boolean {
  return iso.slice(0, 7) === referencia.slice(0, 7);
}

export function diaSemanaDe(iso: string): number {
  return fromISO(iso).getDay();
}

export function rotuloDataLonga(iso: string): string {
  const d = fromISO(iso);
  return `${NOMES_DIAS[d.getDay()]}, ${d.getDate()} de ${NOMES_MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function rotuloDataCurta(iso: string): string {
  const d = fromISO(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function rotuloMesAno(iso: string): string {
  const d = fromISO(iso);
  return `${NOMES_MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function rotuloIntervalo(inicio: string, fim: string): string {
  const dI = fromISO(inicio);
  const dF = fromISO(fim);
  const mesmoMes =
    dI.getFullYear() === dF.getFullYear() && dI.getMonth() === dF.getMonth();
  if (mesmoMes) {
    return `${dI.getDate()} – ${dF.getDate()} de ${NOMES_MESES[dI.getMonth()]} de ${dI.getFullYear()}`;
  }
  const mesmoAno = dI.getFullYear() === dF.getFullYear();
  if (mesmoAno) {
    return `${dI.getDate()} de ${NOMES_MESES[dI.getMonth()]} – ${dF.getDate()} de ${NOMES_MESES[dF.getMonth()]} de ${dI.getFullYear()}`;
  }
  return `${rotuloDataLonga(inicio)} – ${rotuloDataLonga(fim)}`;
}
