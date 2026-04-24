import type { RotaId } from '../../hooks/useHashRoute';
import './Sidebar.css';

interface SidebarProps {
  rotaAtiva: RotaId;
  onNavegar: (rota: RotaId) => void;
}

interface ItemMenu {
  id: RotaId;
  label: string;
  icon: React.ReactNode;
}

const ITENS: ItemMenu[] = [
  {
    id: 'escala',
    label: 'Escala',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'turnos',
    label: 'Turnos',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    id: 'funcionarios',
    label: 'Funcionários',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function Sidebar({ rotaAtiva, onNavegar }: SidebarProps) {
  return (
    <aside className="brisa-sidebar">
      <div className="brisa-sidebar__brand">
        <div className="brisa-logo" aria-hidden="true">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 28h28v8a14 14 0 0 1-14 14h0a14 14 0 0 1-14-14v-8z" />
            <path d="M42 30h6a6 6 0 0 1 0 12h-6" />
            <path d="M22 18c0-3 4-3 4-6M30 18c0-3 4-3 4-6" />
          </svg>
        </div>
        <div className="brisa-sidebar__brand-text">
          <span className="brisa-sidebar__title">Brisa</span>
          <span className="brisa-sidebar__subtitle">Café</span>
        </div>
      </div>

      <nav className="brisa-sidebar__nav" aria-label="Navegação principal">
        <span className="brisa-sidebar__section">Geral</span>
        {ITENS.map((item) => {
          const ativo = item.id === rotaAtiva;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`brisa-sidebar__item ${ativo ? 'brisa-sidebar__item--active' : ''}`}
              aria-current={ativo ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                onNavegar(item.id);
              }}
            >
              <span className="brisa-sidebar__icon">{item.icon}</span>
              <span className="brisa-sidebar__label">{item.label}</span>
            </a>
          );
        })}
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
