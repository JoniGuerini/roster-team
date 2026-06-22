import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { FuncionarioForm } from '../components/funcionarios/FuncionarioForm';
import { ListaEquipePaginacao } from '../components/equipe/ListaEquipePaginacao';
import { ExtrasList } from '../components/extras/ExtrasList';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { extrasStorage } from '../services/extrasStorage';
import type { Sessao } from '../services/authSession';
import { podeEditarModulo } from '../utils/rotaPermissoes';
import type { PessoaExtra, PessoaExtraInput } from '../types/pessoaExtra';
import {
  FUNCOES,
  LOCAIS_TRABALHO,
  STATUS_FUNCIONARIO,
  TIPOS_CONTRATO,
} from '../types/funcionario';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import {
  buscaEquipeMatch,
  extraPassaFiltrosColuna,
  FILTRO_SEM_CAMPO,
  haystackExtra,
  type FiltroColunasExtra,
} from '../utils/filtroListaEquipe';
import './FuncionariosPage.css';

interface ExtrasPageProps {
  sessao: Sessao;
  onAbrirPerfil: (id: string) => void;
}

const FILTRO_INICIAL: FiltroColunasExtra = {
  funcao: '',
  local: '',
  contrato: '',
  status: '',
};

const OPCAO_TODOS = [{ value: '', label: 'Todos' }];

const OPCAO_SEM = (rotulo: string) => ({
  value: FILTRO_SEM_CAMPO,
  label: rotulo,
});

export function ExtrasPage({ sessao, onAbrirPerfil }: ExtrasPageProps) {
  const podeEditar = podeEditarModulo(sessao.permissoes, 'extras');
  const [extras, setExtras] = useState<PessoaExtra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtrosColuna, setFiltrosColuna] =
    useState<FiltroColunasExtra>(FILTRO_INICIAL);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<PessoaExtra | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<PessoaExtra | undefined>(
    undefined,
  );
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const carregar = useCallback(async () => {
    if (!sessao.empresaId) return;
    setCarregando(true);
    try {
      const lista = await extrasStorage.listar();
      setExtras(lista);
      setErro(null);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível carregar os extras.',
      );
    } finally {
      setCarregando(false);
    }
  }, [sessao.empresaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const extrasFiltrados = useMemo(() => {
    return extras.filter((e) => {
      if (!extraPassaFiltrosColuna(e, filtrosColuna)) return false;
      return buscaEquipeMatch(haystackExtra(e), busca);
    });
  }, [busca, extras, filtrosColuna]);

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(extrasFiltrados.length / itensPorPagina)),
    [extrasFiltrados.length, itensPorPagina],
  );

  useEffect(() => {
    setPagina(1);
  }, [busca, filtrosColuna]);

  useEffect(() => {
    setPagina((p) => Math.min(p, totalPaginas));
  }, [totalPaginas]);

  const extrasPagina = useMemo(() => {
    const inicio = (pagina - 1) * itensPorPagina;
    return extrasFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [extrasFiltrados, pagina, itensPorPagina]);

  function handleItensPorPaginaChange(n: number) {
    setItensPorPagina(n);
    setPagina(1);
  }

  const haFiltrosOuBusca =
    busca.trim() !== '' ||
    filtrosColuna.funcao !== '' ||
    filtrosColuna.local !== '' ||
    filtrosColuna.contrato !== '' ||
    filtrosColuna.status !== '';

  function limparFiltrosEBusca() {
    setBusca('');
    setFiltrosColuna(FILTRO_INICIAL);
  }

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(extra: PessoaExtra) {
    setEditando(extra);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  async function salvar(input: PessoaExtraInput) {
    try {
      if (editando) {
        await extrasStorage.atualizar(editando.id, input);
      } else {
        await extrasStorage.criar(input);
      }
      await carregar();
      disparoNotificacoes();
      fecharModal();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível salvar o extra.',
      );
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await extrasStorage.excluir(paraExcluir.id);
      await carregar();
      disparoNotificacoes();
      setParaExcluir(undefined);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível excluir o extra.',
      );
    }
  }

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Equipe</span>
          <h1 className="brisa-page__title">Extras</h1>
          <p className="brisa-page__subtitle">
            Cadastro de quem cobre pontualmente, fora do quadro de funcionários.
            Mesmo fluxo da lista de funcionários: busca, filtros e formulário no
            modal.
          </p>
        </div>
      </header>

      <div className="brisa-page__body">
        {erro ? (
          <div className="brisa-funcionarios__erro" role="alert">
            {erro}
          </div>
        ) : null}

        <section className="brisa-page__toolbar">
          <div className="brisa-page__toolbar-head">
            <p className="brisa-page__list-count" aria-live="polite">
              {extrasFiltrados.length}{' '}
              {extrasFiltrados.length === 1 ? 'extra' : 'extras'}
              {haFiltrosOuBusca && extras.length > 0 ? (
                <span className="brisa-page__count-total"> de {extras.length}</span>
              ) : null}
            </p>
            {podeEditar ? (
              <Button onClick={abrirNovo} leftIcon={<Icon name="plus" size={16} />}>
                Novo extra
              </Button>
            ) : null}
          </div>

          <div className="brisa-page__toolbar-filters">
        <div className="brisa-page__toolbar-equipe">
          <div className="brisa-search brisa-search--inline">
            <Icon name="search" size={16} />
            <Input
              id="busca-extras"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              title="Pesquisa em todas as colunas: nome, funções, local, contrato, admissão e status"
              aria-label="Buscar em todas as colunas da tabela"
            />
          </div>

          <div className="brisa-page__filtros brisa-page__filtros--inline">
            <Field label="Função principal" htmlFor="filtro-extra-funcao">
              <Select
                id="filtro-extra-funcao"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...FUNCOES.map((o) => ({ value: o.value, label: o.label })),
                  OPCAO_SEM('Sem função principal'),
                ]}
                value={filtrosColuna.funcao}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    funcao: e.target.value as FiltroColunasExtra['funcao'],
                  }))
                }
              />
            </Field>
            <Field label="Local" htmlFor="filtro-extra-local">
              <Select
                id="filtro-extra-local"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...LOCAIS_TRABALHO.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                  OPCAO_SEM('Sem local'),
                ]}
                value={filtrosColuna.local}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    local: e.target.value as FiltroColunasExtra['local'],
                  }))
                }
              />
            </Field>
            <Field label="Contrato" htmlFor="filtro-extra-contrato">
              <Select
                id="filtro-extra-contrato"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...TIPOS_CONTRATO.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                  OPCAO_SEM('Sem contrato'),
                ]}
                value={filtrosColuna.contrato}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    contrato: e.target.value as FiltroColunasExtra['contrato'],
                  }))
                }
              />
            </Field>
            <Field label="Status" htmlFor="filtro-extra-status">
              <Select
                id="filtro-extra-status"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...STATUS_FUNCIONARIO.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                  OPCAO_SEM('Sem status'),
                ]}
                value={filtrosColuna.status}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    status: e.target.value as FiltroColunasExtra['status'],
                  }))
                }
              />
            </Field>
          </div>

          <div className="brisa-page__toolbar-reset">
            <Field label=" " htmlFor="reset-filtros-extras">
              <Button
                id="reset-filtros-extras"
                type="button"
                variant="secondary"
                onClick={limparFiltrosEBusca}
                disabled={!haFiltrosOuBusca}
                aria-label="Limpar busca e todos os filtros"
              >
                Limpar
              </Button>
            </Field>
          </div>
        </div>
          </div>
        </section>

        {carregando ? (
          <p className="brisa-funcionarios__loading">Carregando extras…</p>
        ) : null}

      {!carregando && extras.length === 0 ? (
        <ExtrasList
          extras={[]}
          onOpenPerfil={(e) => onAbrirPerfil(e.id)}
          onEdit={podeEditar ? abrirEdicao : undefined}
          onDelete={podeEditar ? (e) => setParaExcluir(e) : undefined}
        />
      ) : !carregando && extrasFiltrados.length === 0 ? (
        <div className="brisa-empty-shell">
          <div className="brisa-page__empty-filtro">
            <h3 className="brisa-page__empty-filtro-title">
              Nenhum resultado encontrado
            </h3>
            <p className="brisa-page__empty-filtro-hint">
              Ajuste a busca ou os filtros — a pesquisa inclui nome, funções,
              local, contrato, admissão e status (e o marcador &quot;extra&quot;).
            </p>
            <Button type="button" variant="secondary" onClick={limparFiltrosEBusca}>
              Limpar busca e filtros
            </Button>
          </div>
        </div>
      ) : !carregando ? (
        <>
          <ExtrasList
            extras={extrasPagina}
            onOpenPerfil={(e) => onAbrirPerfil(e.id)}
            onEdit={podeEditar ? abrirEdicao : undefined}
            onDelete={podeEditar ? (e) => setParaExcluir(e) : undefined}
          />
          <ListaEquipePaginacao
            pagina={pagina}
            totalPaginas={totalPaginas}
            itensPorPagina={itensPorPagina}
            totalItens={extrasFiltrados.length}
            onPaginaChange={setPagina}
            onItensPorPaginaChange={handleItensPorPaginaChange}
          />
        </>
      ) : null}

      </div>

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar Extra' : 'Registrar Novo Extra'}
        description={
          editando
            ? 'Atualize as informações abaixo conforme necessário.'
            : 'Nome obrigatório; os demais campos podem ficar em branco e ser preenchidos depois.'
        }
        size="lg"
      >
        <FuncionarioForm
          key={editando?.id ?? 'novo'}
          variant="extra"
          extra={editando}
          onCancel={fecharModal}
          onSubmit={(input) => void salvar(input)}
        />
      </Modal>

      <ConfirmDeleteModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        titulo="Excluir extra"
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={() => void confirmarExclusao()}
      >
        <p className="brisa-confirm__text">
          Remover <strong>{paraExcluir?.nome}</strong>? Se ainda estiver em
          algum turno ou escala, o nome pode aparecer como &quot;Pessoa
          removida&quot; até você ajustar a alocação.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}
