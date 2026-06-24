import { authSession, type Sessao } from '../../services/authSession';
import { iniciaisDoNome } from '../../utils/funcionarioLabels';
import { Tooltip } from '../ui/Tooltip';
import './SidebarUserMenu.css';

interface SidebarUserMenuProps {
  sessao: Sessao;
  recolhida?: boolean;
  mostrarTooltip?: boolean;
  onAbrirConta: () => void;
}

export function SidebarUserMenu({
  sessao,
  recolhida = false,
  mostrarTooltip = false,
  onAbrirConta,
}: SidebarUserMenuProps) {
  const iniciais = iniciaisDoNome(sessao.nome);
  const perfilAcesso = authSession.rotuloPermissoes(sessao);

  const trigger = (
    <button
      type="button"
      className="brisa-sidebar-user__trigger"
      aria-label={`Abrir conta de ${sessao.nome}`}
      onClick={onAbrirConta}
    >
      <div className="brisa-sidebar-user__avatar" aria-hidden="true">
        {iniciais}
      </div>
      <div className="brisa-sidebar-user__info">
        <span className="brisa-sidebar-user__name">{sessao.nome}</span>
        {perfilAcesso ? (
          <span className="brisa-sidebar-user__perfil">{perfilAcesso}</span>
        ) : null}
      </div>
    </button>
  );

  return (
    <div
      className={`brisa-sidebar-user ${recolhida ? 'brisa-sidebar-user--collapsed' : ''}`}
    >
      {mostrarTooltip ? (
        <Tooltip content={sessao.nome} side="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
    </div>
  );
}
