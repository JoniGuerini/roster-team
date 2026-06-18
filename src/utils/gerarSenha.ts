const MINUSCULAS = 'abcdefghijkmnpqrstuvwxyz';
const MAIUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMEROS = '23456789';
const SIMBOLOS = '!@#$%&*?';

const TODOS = MINUSCULAS + MAIUSCULAS + NUMEROS + SIMBOLOS;

function inteiroAleatorio(max: number): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function escolher(conjunto: string): string {
  return conjunto[inteiroAleatorio(conjunto.length)];
}

/**
 * Gera uma senha provisória aleatória (aplicada via RPC no Supabase Auth).
 * Garante pelo menos um caractere de cada grupo e embaralha o resultado.
 */
export function gerarSenha(tamanho = 12): string {
  const comprimento = Math.max(8, tamanho);
  const obrigatorios = [
    escolher(MINUSCULAS),
    escolher(MAIUSCULAS),
    escolher(NUMEROS),
    escolher(SIMBOLOS),
  ];

  const restantes: string[] = [];
  for (let i = obrigatorios.length; i < comprimento; i += 1) {
    restantes.push(escolher(TODOS));
  }

  const todos = [...obrigatorios, ...restantes];
  for (let i = todos.length - 1; i > 0; i -= 1) {
    const j = inteiroAleatorio(i + 1);
    [todos[i], todos[j]] = [todos[j], todos[i]];
  }

  return todos.join('');
}
