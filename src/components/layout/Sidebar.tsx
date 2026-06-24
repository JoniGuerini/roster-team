import type { RotaId } from '../../hooks/useHashRoute';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { Sessao } from '../../services/authSession';
import type { Empresa } from '../../types/empresa';
import { podeAcessarRota, recursoDaRota } from '../../utils/rotaPermissoes';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';
import { SidebarUserMenu } from './SidebarUserMenu';
import { iniciaisEmpresa } from '../empresas/EmpresaLogo';
import './Sidebar.css';

interface SidebarProps {
  rotaAtiva: RotaId;
  onNavegar: (rota: RotaId) => void;
  sessao: Sessao;
  empresa?: Empresa;
  recolhida?: boolean;
  onAbrirConta: () => void;
}

interface ItemMenu {
  id: RotaId;
  label: string;
  icon: string;
}

const ITENS: ItemMenu[] = [
  { id: 'inicio', label: 'Início', icon: 'home' },
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
  { id: 'planos', label: 'Planos', icon: 'badge' },
];

function renderItem(
  item: ItemMenu,
  rotaAtiva: RotaId,
  onNavegar: (rota: RotaId) => void,
  mostrarTooltip: boolean,
) {
  const ativo = item.id === rotaAtiva;
  const botao = (
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

  if (!mostrarTooltip) return botao;

  return (
    <Tooltip key={item.id} content={item.label} side="right">
      {botao}
    </Tooltip>
  );
}

export function Sidebar({
  rotaAtiva,
  onNavegar,
  sessao,
  empresa,
  recolhida = false,
  onAbrirConta,
}: SidebarProps) {
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
    ? ITENS_ADMIN.filter((item) => item.id === 'empresas' || item.id === 'planos')
    : ITENS_ADMIN.filter(itemVisivel);
  const isMobile = useMediaQuery('(max-width: 880px)');
  const mostrarTooltip = recolhida && !isMobile;

  return (
    <aside
      className={`brisa-sidebar ${recolhida ? 'brisa-sidebar--collapsed' : ''}`}
    >
      <div className="brisa-sidebar__inner">
      <div className="brisa-sidebar__brand">
        <div
          className={`brisa-logo${logoEmpresa ? ' brisa-logo--imagem' : ''}`}
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
            {itensGeral.map((item) => renderItem(item, rotaAtiva, onNavegar, mostrarTooltip))}
          </>
        ) : null}

        {itensAdmin.length > 0 ? (
          <>
            <span className="brisa-sidebar__section brisa-sidebar__section--gap">
              {sessao.isPlatformAdmin ? 'Plataforma' : 'Administração'}
            </span>
            {itensAdmin.map((item) => renderItem(item, rotaAtiva, onNavegar, mostrarTooltip))}
          </>
        ) : null}
      </nav>

      <div className="brisa-sidebar__footer">
        <SidebarUserMenu
          sessao={sessao}
          recolhida={recolhida}
          mostrarTooltip={mostrarTooltip}
          onAbrirConta={onAbrirConta}
        />
      </div>
      </div>
    </aside>
  );
}

