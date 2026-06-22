import { useEffect, useRef, useState } from 'react';
import type { Sessao } from '../../services/authSession';
import { iniciaisDoNome } from '../../utils/funcionarioLabels';
import { Icon } from '../ui/Icon';
import './SidebarUserMenu.css';

interface SidebarUserMenuProps {
  sessao: Sessao;
  recolhida?: boolean;
  onAbrirConta: () => void;
  onSair: () => void;
}

export function SidebarUserMenu({
  sessao,
  recolhida = false,
  onAbrirConta,
  onSair,
}: SidebarUserMenuProps) {
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iniciais = iniciaisDoNome(sessao.nome);

  useEffect(() => {
    if (!aberto) return;
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAberto(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [aberto]);

  function abrirConta() {
    setAberto(false);
    onAbrirConta();
  }

  function sair() {
    setAberto(false);
    onSair();
  }

  return (
    <div
      className={`brisa-sidebar-user ${aberto ? 'brisa-sidebar-user--open' : ''} ${recolhida ? 'brisa-sidebar-user--collapsed' : ''}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="brisa-sidebar-user__trigger"
        aria-expanded={aberto}
        aria-haspopup="menu"
        title={recolhida ? sessao.nome : undefined}
        onClick={() => setAberto((v) => !v)}
      >
        <div className="brisa-sidebar-user__avatar" aria-hidden="true">
          {iniciais}
        </div>
        <div className="brisa-sidebar-user__info">
          <span className="brisa-sidebar-user__name">{sessao.nome}</span>
          <span className="brisa-sidebar-user__email">{sessao.email}</span>
        </div>
        <Icon
          name="selector"
          size={16}
          className="brisa-sidebar-user__chevron"
        />
      </button>

      {aberto ? (
        <div className="brisa-sidebar-user__menu" role="menu" aria-label="Conta">
          <div className="brisa-sidebar-user__menu-label" role="presentation">
            <div className="brisa-sidebar-user__avatar" aria-hidden="true">
              {iniciais}
            </div>
            <div className="brisa-sidebar-user__info">
              <span className="brisa-sidebar-user__name">{sessao.nome}</span>
              <span className="brisa-sidebar-user__email brisa-sidebar-user__email--muted">
                {sessao.email}
              </span>
            </div>
          </div>

          <div className="brisa-sidebar-user__separator" role="separator" />

          <button
            type="button"
            className="brisa-sidebar-user__item"
            role="menuitem"
            onClick={abrirConta}
          >
            <Icon name="badge" size={16} />
            Conta
          </button>

          <div className="brisa-sidebar-user__separator" role="separator" />

          <button
            type="button"
            className="brisa-sidebar-user__item"
            role="menuitem"
            onClick={sair}
          >
            <Icon name="logout" size={16} />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
