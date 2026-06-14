import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { FuncionarioForm } from '../components/funcionarios/FuncionarioForm';
import { ListaEquipePaginacao } from '../components/equipe/ListaEquipePaginacao';
import { FuncionariosList } from '../components/funcionarios/FuncionariosList';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { funcionariosStorage } from '../services/funcionariosStorage';
import type { Funcionario, FuncionarioInput } from '../types/funcionario';
import {
  FUNCOES,
  LOCAIS_TRABALHO,
  STATUS_FUNCIONARIO,
  TIPOS_CONTRATO,
} from '../types/funcionario';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import {
  buscaEquipeMatch,
  funcionarioPassaFiltrosColuna,
  haystackFuncionario,
  type FiltroColunasFuncionario,
} from '../utils/filtroListaEquipe';
import './FuncionariosPage.css';

interface FuncionariosPageProps {
  onAbrirPerfil: (id: string) => void;
}

const FILTRO_INICIAL: FiltroColunasFuncionario = {
  funcao: '',
  local: '',
  contrato: '',
  status: '',
};

const OPCAO_TODOS = [{ value: '', label: 'Todos' }];

export function FuncionariosPage({ onAbrirPerfil }: FuncionariosPageProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState('');
  const [filtrosColuna, setFiltrosColuna] =
    useState<FiltroColunasFuncionario>(FILTRO_INICIAL);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Funcionario | undefined>(
    undefined,
  );
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  useEffect(() => {
    setFuncionarios(funcionariosStorage.listar());
  }, []);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter((f) => {
      if (!funcionarioPassaFiltrosColuna(f, filtrosColuna)) return false;
      return buscaEquipeMatch(haystackFuncionario(f), busca);
    });
  }, [busca, funcionarios, filtrosColuna]);

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(funcionariosFiltrados.length / itensPorPagina)),
    [funcionariosFiltrados.length, itensPorPagina],
  );

  useEffect(() => {
    setPagina(1);
  }, [busca, filtrosColuna]);

  useEffect(() => {
    setPagina((p) => Math.min(p, totalPaginas));
  }, [totalPaginas]);

  const funcionariosPagina = useMemo(() => {
    const inicio = (pagina - 1) * itensPorPagina;
    return funcionariosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [funcionariosFiltrados, pagina, itensPorPagina]);

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

  function abrirEdicao(funcionario: Funcionario) {
    setEditando(funcionario);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  function salvar(input: FuncionarioInput) {
    if (editando) {
      funcionariosStorage.atualizar(editando.id, input);
    } else {
      funcionariosStorage.criar(input);
    }
    setFuncionarios(funcionariosStorage.listar());
    disparoNotificacoes();
    fecharModal();
  }

  function confirmarExclusao() {
    if (!paraExcluir) return;
    funcionariosStorage.excluir(paraExcluir.id);
    setFuncionarios(funcionariosStorage.listar());
    disparoNotificacoes();
    setParaExcluir(undefined);
  }

  async function handleSeed(quantidade: number, modo: 'append' | 'replace') {
    const { seedFuncionarios } = await import('../dev/seedFuncionarios');
    seedFuncionarios({ quantidade, modo });
    setFuncionarios(funcionariosStorage.listar());
    disparoNotificacoes();
  }

  async function handleLimparDemo() {
    if (
      !window.confirm(
        'Remover todos os funcionários deste dispositivo? Esta ação não pode ser desfeita.',
      )
    ) {
      return;
    }
    const { limparTodosFuncionarios } = await import('../dev/seedFuncionarios');
    limparTodosFuncionarios();
    setFuncionarios(funcionariosStorage.listar());
    disparoNotificacoes();
  }

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Equipe</span>
          <h1 className="brisa-page__title">Funcionários</h1>
          <p className="brisa-page__subtitle">
            Cadastre, edite e mantenha as informações da equipe da cafeteria.
          </p>
          <p className="brisa-page__list-count" aria-live="polite">
            {funcionariosFiltrados.length}{' '}
            {funcionariosFiltrados.length === 1 ? 'funcionário' : 'funcionários'}
            {haFiltrosOuBusca && funcionarios.length > 0 ? (
              <span className="brisa-page__count-total">
                {' '}
                de {funcionarios.length}
              </span>
            ) : null}
          </p>
        </div>
        <Button onClick={abrirNovo} leftIcon={<Icon name="plus" size={16} />}>
          Novo funcionário
        </Button>
      </header>

      <section className="brisa-page__toolbar">
        <div className="brisa-page__toolbar-equipe">
          <div className="brisa-search brisa-search--inline">
            <Icon name="search" size={16} />
            <Input
              id="busca-funcionarios"
              placeholder="Buscar"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              title="Pesquisa em todas as colunas: nome, funções, local, contrato, admissão e status"
              aria-label="Buscar em todas as colunas da tabela"
            />
          </div>

          <div className="brisa-page__filtros brisa-page__filtros--inline">
            <Field label="Função" htmlFor="filtro-func-funcao">
              <Select
                id="filtro-func-funcao"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...FUNCOES.map((o) => ({ value: o.value, label: o.label })),
                ]}
                value={filtrosColuna.funcao}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    funcao: e.target.value as FiltroColunasFuncionario['funcao'],
                  }))
                }
              />
            </Field>
            <Field label="Local" htmlFor="filtro-func-local">
              <Select
                id="filtro-func-local"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...LOCAIS_TRABALHO.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
                value={filtrosColuna.local}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    local: e.target.value as FiltroColunasFuncionario['local'],
                  }))
                }
              />
            </Field>
            <Field label="Contrato" htmlFor="filtro-func-contrato">
              <Select
                id="filtro-func-contrato"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...TIPOS_CONTRATO.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
                value={filtrosColuna.contrato}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    contrato: e.target.value as FiltroColunasFuncionario['contrato'],
                  }))
                }
              />
            </Field>
            <Field label="Status" htmlFor="filtro-func-status">
              <Select
                id="filtro-func-status"
                placeholder="Todos"
                options={[
                  ...OPCAO_TODOS,
                  ...STATUS_FUNCIONARIO.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
                value={filtrosColuna.status}
                onChange={(e) =>
                  setFiltrosColuna((p) => ({
                    ...p,
                    status: e.target.value as FiltroColunasFuncionario['status'],
                  }))
                }
              />
            </Field>
          </div>

          <div className="brisa-page__toolbar-reset">
            <Field label=" " htmlFor="reset-filtros-funcionarios">
              <Button
                id="reset-filtros-funcionarios"
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
      </section>

      {import.meta.env.DEV ? (
        <section
          className="brisa-dev-seed"
          aria-label="Dados fictícios para teste de layout (somente em desenvolvimento)"
        >
          <span className="brisa-dev-seed__badge">dev</span>
          <span className="brisa-dev-seed__hint">
            Preencher lista para testar tabela e busca (localStorage).
          </span>
          <div className="brisa-dev-seed__actions">
            <button
              type="button"
              className="brisa-dev-seed__btn"
              onClick={() => void handleSeed(25, 'append')}
            >
              +25 fictícios
            </button>
            <button
              type="button"
              className="brisa-dev-seed__btn"
              onClick={() => void handleSeed(60, 'append')}
            >
              +60 fictícios
            </button>
            <button
              type="button"
              className="brisa-dev-seed__btn brisa-dev-seed__btn--warn"
              onClick={() => {
                if (
                  window.confirm(
                    'Substituir todos os funcionários atuais por 40 registros de teste?',
                  )
                ) {
                  void handleSeed(40, 'replace');
                }
              }}
            >
              Trocar tudo por 40 de teste
            </button>
            <button
              type="button"
              className="brisa-dev-seed__btn brisa-dev-seed__btn--danger"
              onClick={() => void handleLimparDemo()}
            >
              Limpar lista
            </button>
          </div>
        </section>
      ) : null}

      {funcionarios.length === 0 ? (
        <FuncionariosList
          funcionarios={[]}
          onOpenPerfil={(f) => onAbrirPerfil(f.id)}
          onEdit={abrirEdicao}
          onDelete={(f) => setParaExcluir(f)}
        />
      ) : funcionariosFiltrados.length === 0 ? (
        <div className="brisa-page__empty-filtro">
          <h3 className="brisa-page__empty-filtro-title">
            Nenhum resultado encontrado
          </h3>
          <p className="brisa-page__empty-filtro-hint">
            Ajuste a busca ou os filtros por coluna — a pesquisa considera nome,
            funções, local, contrato, data de admissão e status.
          </p>
          <Button type="button" variant="secondary" onClick={limparFiltrosEBusca}>
            Limpar busca e filtros
          </Button>
        </div>
      ) : (
        <>
          <FuncionariosList
            funcionarios={funcionariosPagina}
            onOpenPerfil={(f) => onAbrirPerfil(f.id)}
            onEdit={abrirEdicao}
            onDelete={(f) => setParaExcluir(f)}
          />
          <ListaEquipePaginacao
            pagina={pagina}
            totalPaginas={totalPaginas}
            itensPorPagina={itensPorPagina}
            totalItens={funcionariosFiltrados.length}
            onPaginaChange={setPagina}
            onItensPorPaginaChange={handleItensPorPaginaChange}
          />
        </>
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar Funcionário' : 'Registrar Novo Funcionário'}
        description={
          editando
            ? 'Atualize as informações abaixo conforme necessário.'
            : 'Preencha os dados abaixo para adicionar um novo membro à equipe.'
        }
        size="lg"
      >
        <FuncionarioForm
          funcionario={editando}
          onCancel={fecharModal}
          onSubmit={salvar}
        />
      </Modal>

      <ConfirmDeleteModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
