/** Mantém apenas os dígitos do CPF (máximo de 11). */
export function cpfDigitos(valor: string): string {
  return (valor ?? '').replace(/\D/g, '').slice(0, 11);
}

/** Aplica a máscara 000.000.000-00 conforme o usuário digita. */
export function formatarCpf(valor: string): string {
  const d = cpfDigitos(valor);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);

  let saida = p1;
  if (p2) saida += `.${p2}`;
  if (p3) saida += `.${p3}`;
  if (p4) saida += `-${p4}`;
  return saida;
}

function digitoVerificador(digitos: string, fatorInicial: number): number {
  let soma = 0;
  for (let i = 0; i < fatorInicial - 1; i++) {
    soma += Number(digitos[i]) * (fatorInicial - i);
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

/** Valida CPF (11 dígitos + dígitos verificadores, rejeita sequências repetidas). */
export function cpfValido(valor: string): boolean {
  const d = cpfDigitos(valor);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const dv1 = digitoVerificador(d, 10);
  if (dv1 !== Number(d[9])) return false;

  const dv2 = digitoVerificador(d, 11);
  return dv2 === Number(d[10]);
}

/** Gera um CPF válido (apenas para dados de demonstração). */
export function gerarCpfValido(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const parcial = base.join('');
  const dv1 = digitoVerificador(`${parcial}0`, 10);
  const dv2 = digitoVerificador(`${parcial}${dv1}`, 11);
  return formatarCpf(`${parcial}${dv1}${dv2}`);
}
