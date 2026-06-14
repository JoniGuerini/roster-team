import type { RotaId } from '../../hooks/useHashRoute';
import { Icon } from '../ui/Icon';
import './Sidebar.css';

interface SidebarProps {
  rotaAtiva: RotaId;
  onNavegar: (rota: RotaId) => void;
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

export function Sidebar({ rotaAtiva, onNavegar }: SidebarProps) {
  return (
    <aside className="brisa-sidebar">
      <div className="brisa-sidebar__brand">
        <div className="brisa-logo" aria-hidden="true">
          <img
            src="/brisa-cafe-logo.svg"
            width={42}
            height={42}
            alt=""
            decoding="async"
          />
        </div>
        <div className="brisa-sidebar__brand-text">
          <span className="brisa-sidebar__title">Brisa</span>
          <span className="brisa-sidebar__subtitle">Café</span>
        </div>
      </div>

      <nav className="brisa-sidebar__nav" aria-label="Navegação principal">
        <span className="brisa-sidebar__section">Geral</span>
        {ITENS.map((item) => renderItem(item, rotaAtiva, onNavegar))}

        <span className="brisa-sidebar__section brisa-sidebar__section--gap">
          Administração
        </span>
        {ITENS_ADMIN.map((item) => renderItem(item, rotaAtiva, onNavegar))}
      </nav>

      <div className="brisa-sidebar__footer">
        <div className="brisa-sidebar__user">
          <div className="brisa-sidebar__avatar">B</div>
          <div className="brisa-sidebar__user-info">
            <span className="brisa-sidebar__user-name">Brisa Café</span>
            <span className="brisa-sidebar__user-role">Administradora</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
