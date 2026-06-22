import type { PessoaExtra } from '../../types/pessoaExtra';
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
import { EmptyState } from '../ui/EmptyState';
import '../funcionarios/FuncionariosList.css';

interface ExtrasListProps {
  extras: PessoaExtra[];
  onOpenPerfil: (extra: PessoaExtra) => void;
  onEdit?: (extra: PessoaExtra) => void;
  onDelete?: (extra: PessoaExtra) => void;
}

export function ExtrasList({ extras, onOpenPerfil, onEdit, onDelete }: ExtrasListProps) {
  if (extras.length === 0) {
    return (
      <EmptyState>
        <div className="brisa-empty__icon">
          <Icon name="user-plus" size={20} />
        </div>
        <h3 className="brisa-empty__title">Nenhum extra cadastrado</h3>
        <p className="brisa-empty__hint">
          Clique em <strong>Novo extra</strong> para cadastrar ou use o botão
          Extra ao alocar vagas no modelo de turno.
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="brisa-table-shell">
      <div className="brisa-table-header-wrap">
        <table className="brisa-table brisa-table--layout">
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
              <th>Extra</th>
              <th>Função</th>
              <th>Local</th>
              <th>Contrato</th>
              <th>Admissão</th>
              <th>Status</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
        </table>
      </div>

      <div className="brisa-table-card brisa-table-card--body">
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
            <tbody>
            {extras.map((extra, indice) => {
              const secundarias = extra.funcoesSecundarias ?? [];
              return (
                <tr
                  key={extra.id}
                  className="brisa-table__row--clickable"
                  tabIndex={0}
                  role="button"
                  aria-label={`Abrir perfil de ${extra.nome}`}
                  onClick={() => onOpenPerfil(extra)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenPerfil(extra);
                    }
                  }}
                >
                  <td className="brisa-table__td brisa-table__td--person">
                    <div className="brisa-table__person">
                      <div
                        className={`brisa-avatar ${indice % 2 === 1 ? 'brisa-avatar--accent' : ''}`}
                        aria-hidden="true"
                      >
                        {iniciaisDoNome(extra.nome)}
                      </div>
                      <div className="brisa-table__person-info">
                        <span className="brisa-table__name">{extra.nome}</span>
                        {secundarias.length > 0 && (
                          <span className="brisa-table__secondary">
                            + {secundarias.map(labelFuncao).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="brisa-table__td brisa-table__td--clip">
                    {extra.funcaoPrincipal
                      ? labelFuncao(extra.funcaoPrincipal)
                      : '—'}
                  </td>
                  <td className="brisa-table__td brisa-table__td--clip">
                    {extra.localTrabalho
                      ? labelLocal(extra.localTrabalho)
                      : '—'}
                  </td>
                  <td className="brisa-table__td brisa-table__td--clip">
                    {extra.tipoContrato
                      ? labelContrato(extra.tipoContrato)
                      : '—'}
                  </td>
                  <td className="brisa-table__td brisa-table__td--clip">
                    {formatarData(extra.dataAdmissao ?? '')}
                  </td>
                  <td className="brisa-table__td brisa-table__td--status">
                    {extra.status ? (
                      <Badge tone={toneStatus(extra.status)}>
                        {labelStatus(extra.status)}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td
                    className="brisa-table__td brisa-table__td--actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="brisa-table__actions">
                      {onEdit ? (
                        <button
                          type="button"
                          className="brisa-icon-btn"
                          onClick={() => onEdit(extra)}
                          aria-label={`Editar ${extra.nome}`}
                          title="Editar"
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          className="brisa-icon-btn brisa-icon-btn--danger"
                          onClick={() => onDelete(extra)}
                          aria-label={`Excluir ${extra.nome}`}
                          title="Excluir"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
