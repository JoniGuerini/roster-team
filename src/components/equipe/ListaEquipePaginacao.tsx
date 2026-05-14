import { Select } from '../ui/Select';
import './ListaEquipePaginacao.css';

export const ITENS_POR_PAGINA_OPCOES = [10, 25, 50, 100] as const;

const OPCOES_ITENS_POR_PAGINA = ITENS_POR_PAGINA_OPCOES.map((n) => ({
  value: String(n),
  label: String(n),
}));

export interface ListaEquipePaginacaoProps {
  pagina: number;
  totalPaginas: number;
  itensPorPagina: number;
  totalItens: number;
  onPaginaChange: (pagina: number) => void;
  onItensPorPaginaChange: (n: number) => void;
}

export function ListaEquipePaginacao({
  pagina,
  totalPaginas,
  itensPorPagina,
  totalItens,
  onPaginaChange,
  onItensPorPaginaChange,
}: ListaEquipePaginacaoProps) {
  if (totalItens === 0) return null;

  const primeiro = (pagina - 1) * itensPorPagina + 1;
  const ultimo = Math.min(pagina * itensPorPagina, totalItens);

  return (
    <nav
      className="brisa-lista-paginacao"
      aria-label="Paginação da lista"
    >
      <p className="brisa-lista-paginacao__intervalo">
        <span className="brisa-lista-paginacao__intervalo-numeros">
          {primeiro}–{ultimo}
        </span>
        <span className="brisa-lista-paginacao__intervalo-de"> de </span>
        <span>{totalItens}</span>
      </p>

      <div className="brisa-lista-paginacao__navegacao">
        <button
          type="button"
          className="brisa-lista-paginacao__btn"
          disabled={pagina <= 1}
          onClick={() => onPaginaChange(pagina - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </button>
        <span className="brisa-lista-paginacao__paginas">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          className="brisa-lista-paginacao__btn"
          disabled={pagina >= totalPaginas}
          onClick={() => onPaginaChange(pagina + 1)}
          aria-label="Próxima página"
        >
          Próxima
        </button>
      </div>

      <div
        className="brisa-lista-paginacao__tamanho"
        role="group"
        aria-labelledby="label-itens-por-pagina"
      >
        <span className="brisa-lista-paginacao__tamanho-label" id="label-itens-por-pagina">
          Por página
        </span>
        <div className="brisa-lista-paginacao__select-wrap">
          <Select
            id="lista-equipe-itens-por-pagina"
            menuPlacement="top"
            options={OPCOES_ITENS_POR_PAGINA}
            value={String(itensPorPagina)}
            onChange={(e) => onItensPorPaginaChange(Number(e.target.value))}
          />
        </div>
      </div>
    </nav>
  );
}
