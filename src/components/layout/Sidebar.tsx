import type { RotaId } from '../../hooks/useHashRoute';
import type { Sessao } from '../../services/authSession';
import type { Empresa } from '../../types/empresa';
import { podeAcessarRota, recursoDaRota } from '../../utils/rotaPermissoes';
import { authSession } from '../../services/authSession';
import { Icon } from '../ui/Icon';
import { iniciaisEmpresa } from '../empresas/EmpresaLogo';
import './Sidebar.css';

interface SidebarProps {
  rotaAtiva: RotaId;
  onNavegar: (rota: RotaId) => void;
  sessao: Sessao;
  onSair: () => void;
  empresa?: Empresa;
}

interface ItemMenu {
  id: RotaId;
  label: string;
  icon: string;
}

const ITENS: ItemMenu[] = [
  { id: 'escala', label: 'Escala', icon: 'calendar-event' },
  { id: 'turnos', label: 'Turnos', icon: 'clock' },
  { id: 'funcionarios', label: 'Funcionários', icon: 'users' },
  { id: 'extras', label: 'Extras', icon: 'user-plus' },
];

const ITENS_ADMIN: ItemMenu[] = [
  { id: 'usuarios', label: 'Usuários', icon: 'user-cog' },
  { id: 'configuracoes', label: 'Configurações', icon: 'settings' },
  { id: 'atividades', label: 'Atividades', icon: 'history' },
  { id: 'empresas', label: 'Empresas', icon: 'building-store' },
];

function renderItem(
  item: ItemMenu,
  rotaAtiva: RotaId,
  onNavegar: (rota: RotaId) => void,
) {
  const ativo = item.id === rotaAtiva;
  return (
    <button
      key={item.id}
      type="button"
      className={`brisa-sidebar__item ${ativo ? 'brisa-sidebar__item--active' : ''}`}
      aria-current={ativo ? 'page' : undefined}
      onClick={() => onNavegar(item.id)}
    >
      <span className="brisa-sidebar__icon">
        <Icon name={item.icon} size={19} />
      </span>
      <span className="brisa-sidebar__label">{item.label}</span>
    </button>
  );
}

export function Sidebar({
  rotaAtiva,
  onNavegar,
  sessao,
  onSair,
  empresa,
}: SidebarProps) {
  const inicial = sessao.nome.trim().charAt(0).toUpperCase() || '?';
  const rotuloPermissoes = authSession.rotuloPermissoes(sessao) ?? 'Usuário';

  const nomeEmpresa = sessao.isPlatformAdmin
    ? 'Gestão de equipes'
    : (empresa?.nome ?? 'Empresa');
  const segmentoEmpresa = sessao.isPlatformAdmin
    ? 'Painel administrativo'
    : (empresa?.segmento ?? '');
  const logoEmpresa = sessao.isPlatformAdmin
    ? null
    : (empresa?.logoUrl ?? null);

  function itemVisivel(item: ItemMenu): boolean {
    const recurso = recursoDaRota(item.id);
    const recursoAtivo = recurso ? empresa?.recursos[recurso] !== false : true;

    return podeAcessarRota(item.id, sessao.permissoes, {
      recursoAtivo,
      isPlatformAdmin: sessao.isPlatformAdmin,
    });
  }

  const itensGeral = sessao.isPlatformAdmin
    ? []
    : ITENS.filter(itemVisivel);
  const itensAdmin = sessao.isPlatformAdmin
    ? ITENS_ADMIN.filter((item) => item.id === 'empresas')
    : ITENS_ADMIN.filter(itemVisivel);

  return (
    <aside className="brisa-sidebar">
      <div className="brisa-sidebar__brand">
        <div
          className="brisa-logo"
          aria-hidden="true"
          style={
            !logoEmpresa && empresa?.corPrimaria
              ? { background: empresa.corPrimaria }
              : undefined
          }
        >
          {logoEmpresa ? (
            <img src={logoEmpresa} width={42} height={42} alt="" decoding="async" />
          ) : (
            <span className="brisa-logo__iniciais">
              {iniciaisEmpresa(nomeEmpresa)}
            </span>
          )}
        </div>
        <div className="brisa-sidebar__brand-text">
          <span className="brisa-sidebar__title">{nomeEmpresa}</span>
          <span className="brisa-sidebar__subtitle">{segmentoEmpresa}</span>
        </div>
      </div>

      <nav className="brisa-sidebar__nav" aria-label="Navegação principal">
        {itensGeral.length > 0 ? (
          <>
            <span className="brisa-sidebar__section">Geral</span>
            {itensGeral.map((item) => renderItem(item, rotaAtiva, onNavegar))}
          </>
        ) : null}

        {itensAdmin.length > 0 ? (
          <>
            <span className="brisa-sidebar__section brisa-sidebar__section--gap">
              {sessao.isPlatformAdmin ? 'Plataforma' : 'Administração'}
            </span>
            {itensAdmin.map((item) => renderItem(item, rotaAtiva, onNavegar))}
          </>
        ) : null}
      </nav>

      <div className="brisa-sidebar__footer">
        <div
          className={`brisa-sidebar__user ${rotaAtiva === 'perfil' ? 'brisa-sidebar__user--active' : ''}`}
        >
          <button
            type="button"
            className="brisa-sidebar__user-main"
            onClick={() => onNavegar('perfil')}
            aria-current={rotaAtiva === 'perfil' ? 'page' : undefined}
            title="Meu perfil"
          >
            <div className="brisa-sidebar__avatar">{inicial}</div>
            <div className="brisa-sidebar__user-info">
              <span className="brisa-sidebar__user-name">{sessao.nome}</span>
              <span className="brisa-sidebar__user-role">{rotuloPermissoes}</span>
            </div>
          </button>
          <button
            type="button"
            className="brisa-sidebar__logout"
            onClick={onSair}
            aria-label="Sair"
            title="Sair"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
