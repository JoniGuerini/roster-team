import type { PessoaExtra } from '../../types/pessoaExtra';
import { Badge } from '../ui/Badge';
import {
  formatarData,
  iniciaisDoNome,
  labelContrato,
  labelFuncao,
  labelLocal,
  labelStatus,
  toneStatus,
} from '../../utils/funcionarioLabels';
import '../funcionarios/FuncionariosList.css';

interface ExtrasListProps {
  extras: PessoaExtra[];
  onOpenPerfil: (extra: PessoaExtra) => void;
  onEdit: (extra: PessoaExtra) => void;
  onDelete: (extra: PessoaExtra) => void;
}

export function ExtrasList({ extras, onOpenPerfil, onEdit, onDelete }: ExtrasListProps) {
  if (extras.length === 0) {
    return (
      <div className="brisa-empty">
        <div className="brisa-empty__icon">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h3 className="brisa-empty__title">Nenhum extra cadastrado</h3>
        <p className="brisa-empty__hint">
          Clique em <strong>Novo extra</strong> para cadastrar ou use o botão
          Extra ao alocar vagas no modelo de turno.
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
              <th>Extra</th>
              <th>Função</th>
              <th>Local</th>
              <th>Contrato</th>
              <th>Admissão</th>
              <th>Status</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
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
                      <button
                        type="button"
                        className="brisa-icon-btn"
                        onClick={() => onEdit(extra)}
                        aria-label={`Editar ${extra.nome}`}
                        title="Editar"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="brisa-icon-btn brisa-icon-btn--danger"
                        onClick={() => onDelete(extra)}
                        aria-label={`Excluir ${extra.nome}`}
                        title="Excluir"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
