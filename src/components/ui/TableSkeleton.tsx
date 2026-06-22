import { Skeleton } from './Skeleton';
import '../funcionarios/FuncionariosList.css';
import '../usuarios/UsuariosList.css';
import './TableSkeleton.css';

export type TableSkeletonVariant = 'usuarios' | 'equipe';

interface TableSkeletonProps {
  variant?: TableSkeletonVariant;
  rows?: number;
}

const CONFIG: Record<
  TableSkeletonVariant,
  {
    headers: string[];
    colgroup: string[];
    cells: Array<'person' | 'badge' | 'text' | 'text-sm' | 'actions'>;
  }
> = {
  usuarios: {
    headers: ['Usuário', 'Permissões', 'Detalhe', 'Status', 'Último acesso', ''],
    colgroup: [
      'brisa-ucol brisa-ucol--user',
      'brisa-ucol brisa-ucol--papel',
      'brisa-ucol brisa-ucol--perm',
      'brisa-ucol brisa-ucol--status',
      'brisa-ucol brisa-ucol--acesso',
      'brisa-ucol brisa-ucol--actions',
    ],
    cells: ['person', 'badge', 'text', 'badge', 'text-sm', 'actions'],
  },
  equipe: {
    headers: [
      'Funcionário',
      'Função',
      'Local',
      'Contrato',
      'Admissão',
      'Status',
      '',
    ],
    colgroup: [
      'brisa-table__col brisa-table__col--person',
      'brisa-table__col brisa-table__col--funcao',
      'brisa-table__col brisa-table__col--local',
      'brisa-table__col brisa-table__col--contrato',
      'brisa-table__col brisa-table__col--admissao',
      'brisa-table__col brisa-table__col--status',
      'brisa-table__col brisa-table__col--actions',
    ],
    cells: ['person', 'text', 'text', 'text', 'text-sm', 'badge', 'actions'],
  },
};

function SkeletonCell({ type }: { type: (typeof CONFIG)['usuarios']['cells'][number] }) {
  switch (type) {
    case 'person':
      return (
        <div className="brisa-table-skeleton__person">
          <Skeleton rounded="lg" width={36} height={36} />
          <div className="brisa-table-skeleton__person-lines">
            <Skeleton height={14} width="72%" />
            <Skeleton height={12} width="48%" />
          </div>
        </div>
      );
    case 'badge':
      return <Skeleton height={24} width={84} rounded="pill" />;
    case 'text-sm':
      return <Skeleton height={13} width="68%" />;
    case 'actions':
      return (
        <div className="brisa-table-skeleton__actions">
          <Skeleton rounded="pill" width={28} height={28} />
          <Skeleton rounded="pill" width={28} height={28} />
        </div>
      );
    case 'text':
    default:
      return <Skeleton height={14} width="78%" />;
  }
}

export function TableSkeleton({
  variant = 'usuarios',
  rows = 6,
}: TableSkeletonProps) {
  const { headers, colgroup, cells } = CONFIG[variant];

  return (
    <div
      className="brisa-table-shell brisa-table-skeleton"
      aria-busy="true"
      aria-label="Carregando tabela"
    >
      <div className="brisa-table-header-wrap">
        <table className="brisa-table brisa-table--layout">
          <colgroup>
            {colgroup.map((cls) => (
              <col key={cls} className={cls} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {headers.map((label, index) => (
                <th key={`${label}-${index}`}>{label}</th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      <div className="brisa-table-card brisa-table-card--body">
        <div className="brisa-table-wrapper">
          <table className="brisa-table">
            <colgroup>
              {colgroup.map((cls) => (
                <col key={`body-${cls}`} className={cls} />
              ))}
            </colgroup>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {cells.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`}>
                      <SkeletonCell type={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
