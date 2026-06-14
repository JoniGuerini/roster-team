import type { Usuario } from '../../types/usuario';
import { TODAS_PERMISSOES } from '../../types/usuario';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { iniciaisDoNome } from '../../utils/funcionarioLabels';
import {
  formatarDataHora,
  labelPapel,
  labelStatusUsuario,
  tonePapel,
  toneStatusUsuario,
} from '../../utils/usuarioLabels';
import '../funcionarios/FuncionariosList.css';
import './UsuariosList.css';

interface UsuariosListProps {
  usuarios: Usuario[];
  onEdit: (usuario: Usuario) => void;
  onGerarSenha: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
}

export function UsuariosList({
  usuarios,
  onEdit,
  onGerarSenha,
  onDelete,
}: UsuariosListProps) {
  if (usuarios.length === 0) {
    return (
      <div className="brisa-empty">
        <div className="brisa-empty__icon">
          <Icon name="users" size={36} />
        </div>
        <h3 className="brisa-empty__title">Nenhum usuário encontrado</h3>
        <p className="brisa-empty__hint">
          Clique em <strong>Novo usuário</strong> para criar um acesso e gerar
          uma senha.
        </p>
      </div>
    );
  }

  return (
    <div className="brisa-table-card">
      <div className="brisa-table-wrapper">
        <table className="brisa-table">
          <colgroup>
            <col className="brisa-ucol brisa-ucol--user" />
            <col className="brisa-ucol brisa-ucol--papel" />
            <col className="brisa-ucol brisa-ucol--perm" />
            <col className="brisa-ucol brisa-ucol--status" />
            <col className="brisa-ucol brisa-ucol--acesso" />
            <col className="brisa-ucol brisa-ucol--actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Papel</th>
              <th>Permissões</th>
              <th>Status</th>
              <th>Último acesso</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, indice) => (
              <tr key={usuario.id}>
                <td className="brisa-table__td brisa-table__td--person">
                  <div className="brisa-table__person">
                    <div
                      className={`brisa-avatar ${indice % 2 === 1 ? 'brisa-avatar--accent' : ''}`}
                      aria-hidden="true"
                    >
                      {iniciaisDoNome(usuario.nome)}
                    </div>
                    <div className="brisa-table__person-info">
                      <span className="brisa-table__name">{usuario.nome}</span>
                      <span className="brisa-table__secondary">
                        {usuario.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  <Badge tone={tonePapel(usuario.papel)}>
                    {labelPapel(usuario.papel)}
                  </Badge>
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  <span className="brisa-usuarios__perm">
                    {usuario.permissoes.length} de {TODAS_PERMISSOES.length}
                  </span>
                </td>
                <td className="brisa-table__td brisa-table__td--status">
                  <Badge tone={toneStatusUsuario(usuario.status)}>
                    {labelStatusUsuario(usuario.status)}
                  </Badge>
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  {formatarDataHora(usuario.ultimoAcesso)}
                </td>
                <td className="brisa-table__td brisa-table__td--actions">
                  <div className="brisa-table__actions">
                    <button
                      type="button"
                      className="brisa-icon-btn"
                      onClick={() => onGerarSenha(usuario)}
                      aria-label={`Gerar nova senha para ${usuario.nome}`}
                      title="Gerar nova senha"
                    >
                      <Icon name="key" size={16} />
                    </button>
                    <button
                      type="button"
                      className="brisa-icon-btn"
                      onClick={() => onEdit(usuario)}
                      aria-label={`Editar ${usuario.nome}`}
                      title="Editar"
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      type="button"
                      className="brisa-icon-btn brisa-icon-btn--danger"
                      onClick={() => onDelete(usuario)}
                      aria-label={`Excluir ${usuario.nome}`}
                      title="Excluir"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
