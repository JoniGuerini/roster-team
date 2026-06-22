import type { EstadoHashRota, RotaId } from '../hooks/useHashRoute';

const ROTULOS: Record<RotaId, string> = {
  escala: 'Escala',
  turnos: 'Turnos',
  funcionarios: 'Funcionários',
  extras: 'Extras',
  notificacoes: 'Notificações',
  usuarios: 'Usuários',
  configuracoes: 'Configurações',
  atividades: 'Atividades',
  empresas: 'Empresas',
};

export function tituloPagina(estado: EstadoHashRota): string {
  if (estado.perfilFuncionarioId) return 'Funcionário';
  if (estado.perfilExtraId) return 'Extra';
  if (estado.empresaDetalheId) return 'Detalhe da empresa';
  return ROTULOS[estado.rota] ?? 'Roster Team';
}
