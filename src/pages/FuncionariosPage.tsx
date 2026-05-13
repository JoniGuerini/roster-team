import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { FuncionarioForm } from '../components/funcionarios/FuncionarioForm';
import { FuncionariosList } from '../components/funcionarios/FuncionariosList';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { funcionariosStorage } from '../services/funcionariosStorage';
import type { Funcionario, FuncionarioInput } from '../types/funcionario';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import './FuncionariosPage.css';

export function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Funcionario | undefined>(
    undefined,
  );

  useEffect(() => {
    setFuncionarios(funcionariosStorage.listar());
  }, []);

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return funcionarios;
    return funcionarios.filter((f) =>
      f.nome.toLowerCase().includes(termo) ||
      f.funcaoPrincipal.toLowerCase().includes(termo),
    );
  }, [busca, funcionarios]);

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
        </div>
        <Button
          onClick={abrirNovo}
          leftIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Novo funcionário
        </Button>
      </header>

      <section className="brisa-page__toolbar">
        <div className="brisa-search">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <Input
            placeholder="Buscar por nome ou função…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="brisa-page__count">
          {funcionariosFiltrados.length}{' '}
          {funcionariosFiltrados.length === 1 ? 'funcionário' : 'funcionários'}
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

      <FuncionariosList
        funcionarios={funcionariosFiltrados}
        onEdit={abrirEdicao}
        onDelete={(f) => setParaExcluir(f)}
      />

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
