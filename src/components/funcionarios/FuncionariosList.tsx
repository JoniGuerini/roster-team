import type { Funcionario } from '../../types/funcionario';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import {
  formatarData,
  iniciaisDoNome,
  labelContrato,
  labelFuncao,
  labelLocal,
  labelStatus,
  toneStatus,
} from '../../utils/funcionarioLabels';
import './FuncionariosList.css';

interface FuncionariosListProps {
  funcionarios: Funcionario[];
  onOpenPerfil: (funcionario: Funcionario) => void;
  onEdit: (funcionario: Funcionario) => void;
  onDelete: (funcionario: Funcionario) => void;
}

export function FuncionariosList({
  funcionarios,
  onOpenPerfil,
  onEdit,
  onDelete,
}: FuncionariosListProps) {
  if (funcionarios.length === 0) {
    return (
      <div className="brisa-empty">
        <div className="brisa-empty__icon">
          <Icon name="users" size={36} />
        </div>
        <h3 className="brisa-empty__title">Nenhum funcionário cadastrado</h3>
        <p className="brisa-empty__hint">
          Clique em <strong>Novo funcionário</strong> para começar a montar a equipe da Brisa.
        </p>
      </div>
    );
  }

  return (
    <div className="brisa-table-card">
      <div className="brisa-table-wrapper">
        <table className="brisa-table">
          <colgroup>
            <col className="brisa-table__col brisa-table__col--person" />
            <col className="brisa-table__col brisa-table__col--funcao" />
            <col className="brisa-table__col brisa-table__col--local" />
            <col className="brisa-table__col brisa-table__col--contrato" />
            <col className="brisa-table__col brisa-table__col--admissao" />
            <col className="brisa-table__col brisa-table__col--status" />
            <col className="brisa-table__col brisa-table__col--actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Função</th>
              <th>Local</th>
              <th>Contrato</th>
              <th>Admissão</th>
              <th>Status</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((funcionario, indice) => (
              <tr
                key={funcionario.id}
                className="brisa-table__row--clickable"
                tabIndex={0}
                role="button"
                aria-label={`Abrir perfil de ${funcionario.nome}`}
                onClick={() => onOpenPerfil(funcionario)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenPerfil(funcionario);
                  }
                }}
              >
                <td className="brisa-table__td brisa-table__td--person">
                  <div className="brisa-table__person">
                    <div
                      className={`brisa-avatar ${indice % 2 === 1 ? 'brisa-avatar--accent' : ''}`}
                      aria-hidden="true"
                    >
                      {iniciaisDoNome(funcionario.nome)}
                    </div>
                    <div className="brisa-table__person-info">
                      <span className="brisa-table__name">{funcionario.nome}</span>
                      {funcionario.funcoesSecundarias.length > 0 && (
                        <span className="brisa-table__secondary">
                          + {funcionario.funcoesSecundarias
                            .map(labelFuncao)
                            .join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  {labelFuncao(funcionario.funcaoPrincipal)}
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  {labelLocal(funcionario.localTrabalho)}
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  {labelContrato(funcionario.tipoContrato)}
                </td>
                <td className="brisa-table__td brisa-table__td--clip">
                  {formatarData(funcionario.dataAdmissao)}
                </td>
                <td className="brisa-table__td brisa-table__td--status">
                  <Badge tone={toneStatus(funcionario.status)}>
                    {labelStatus(funcionario.status)}
                  </Badge>
                </td>
                <td
                  className="brisa-table__td brisa-table__td--actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="brisa-table__actions">
                    <button
                      type="button"
                      className="brisa-icon-btn"
                      onClick={() => onEdit(funcionario)}
                      aria-label={`Editar ${funcionario.nome}`}
                      title="Editar"
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      type="button"
                      className="brisa-icon-btn brisa-icon-btn--danger"
                      onClick={() => onDelete(funcionario)}
                      aria-label={`Excluir ${funcionario.nome}`}
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
