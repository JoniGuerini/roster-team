import type {
  FuncionarioInput,
  Funcao,
  DiaFolgaSemanal,
  LocalTrabalho,
  StatusFuncionario,
  TipoContrato,
} from '../types/funcionario';
import { funcionariosStorage } from '../services/funcionariosStorage';
import { gerarCpfValido } from '../utils/cpf';

const NOMES = [
  'Ana',
  'Beatriz',
  'Carla',
  'Daniela',
  'Eduarda',
  'Fernanda',
  'Gabriela',
  'Helena',
  'Isabela',
  'Juliana',
  'Larissa',
  'Marina',
  'Natália',
  'Olivia',
  'Patrícia',
  'Rafael',
  'Ricardo',
  'Rodrigo',
  'Samuel',
  'Thiago',
  'Vinícius',
  'Wagner',
  'Yuri',
  'André',
  'Bruno',
  'Caio',
  'Diego',
  'Eduardo',
  'Felipe',
  'Gustavo',
];

const SOBRENOMES = [
  'Almeida',
  'Barbosa',
  'Cardoso',
  'Dias',
  'Ferreira',
  'Gomes',
  'Lima',
  'Martins',
  'Melo',
  'Oliveira',
  'Pereira',
  'Ribeiro',
  'Rodrigues',
  'Santos',
  'Silva',
  'Souza',
  'Teixeira',
  'Vieira',
  'Nunes',
  'Carvalho',
];

const FUNCOES_CICLO: Funcao[] = [
  'atendente',
  'barista',
  'chapeiro',
  'gerente',
  'supervisor',
];

const LOCAIS: LocalTrabalho[] = ['posto-6', 'leme'];
const CONTRATOS: TipoContrato[] = ['experimental', 'efetivo'];
const STATUS: StatusFuncionario[] = [
  'ativo',
  'ativo',
  'ativo',
  'ativo',
  'ferias',
  'afastado',
  'inativo',
];

function rid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function gerarFuncionarioDemo(indice: number): FuncionarioInput {
  const nome = `${NOMES[indice % NOMES.length]} ${SOBRENOMES[(indice * 5) % SOBRENOMES.length]} ${indice + 1}`;
  const funcaoPrincipal = FUNCOES_CICLO[indice % FUNCOES_CICLO.length];
  const outras = FUNCOES_CICLO.filter((f) => f !== funcaoPrincipal);
  const secCount = indice % 3;
  const funcoesSecundarias =
    secCount === 0 ? [] : outras.slice(0, Math.min(secCount, outras.length));

  const mes = String((indice % 12) + 1).padStart(2, '0');
  const ano = 2019 + (indice % 6);
  const dataAdmissao = `${ano}-${mes}-10`;

  const ausencias =
    indice % 7 === 0
      ? [
          {
            id: rid(),
            motivo: 'ferias' as const,
            inicio: `${ano + 1}-01-05`,
            fim: `${ano + 1}-01-20`,
            observacao: 'Período de teste (demo)',
          },
        ]
      : [];

  return {
    nome,
    cpf: gerarCpfValido(),
    localTrabalho: LOCAIS[indice % LOCAIS.length],
    tipoContrato: CONTRATOS[indice % CONTRATOS.length],
    funcaoPrincipal,
    funcoesSecundarias,
    dataAdmissao,
    status: STATUS[indice % STATUS.length],
    diaFolgaSemanal: (indice % 7) as DiaFolgaSemanal,
    descricao:
      indice % 4 === 0
        ? `Cadastro gerado automaticamente para testes de layout (#${indice + 1}).`
        : undefined,
    documentos: [],
    ausencias,
  };
}

export type SeedFuncionariosOpcoes = {
  quantidade?: number;
  modo?: 'append' | 'replace';
};

/**
 * Preenche o Supabase com funcionários fictícios (apenas para desenvolvimento / testes de UI).
 */
export async function seedFuncionarios(
  opcoes: SeedFuncionariosOpcoes = {},
): Promise<number> {
  const quantidade = Math.min(
    200,
    Math.max(1, Math.floor(opcoes.quantidade ?? 28)),
  );
  const modo = opcoes.modo ?? 'append';

  if (modo === 'replace') {
    const lista = await funcionariosStorage.listar();
    for (const f of lista) {
      await funcionariosStorage.excluir(f.id);
    }
  }

  const existentes =
    modo === 'append' ? (await funcionariosStorage.listar()).length : 0;

  for (let i = 0; i < quantidade; i++) {
    await funcionariosStorage.criar(gerarFuncionarioDemo(existentes + i));
  }

  return quantidade;
}

export async function limparTodosFuncionarios(): Promise<number> {
  const lista = await funcionariosStorage.listar();
  for (const f of lista) {
    await funcionariosStorage.excluir(f.id);
  }
  return lista.length;
}
