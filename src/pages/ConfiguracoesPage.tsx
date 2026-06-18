import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { PerfilAcessoForm } from '../components/perfis/PerfilAcessoForm';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { perfisAcessoStorage } from '../services/perfisAcessoStorage';
import type { Sessao } from '../services/authSession';
import type { PerfilAcesso, PerfilAcessoInput } from '../types/perfilAcesso';
import { TODAS_PERMISSOES } from '../types/usuario';
import './ConfiguracoesPage.css';

interface ConfiguracoesPageProps {
  sessao: Sessao;
}

export function ConfiguracoesPage({ sessao }: ConfiguracoesPageProps) {
  const empresaId = sessao.empresaId;
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<PerfilAcesso | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<PerfilAcesso | undefined>(
    undefined,
  );
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    if (!empresaId) return;
    setCarregando(true);
    try {
      await perfisAcessoStorage.garantirSeed(empresaId);
      const lista = await perfisAcessoStorage.listarPorEmpresa(empresaId);
      setPerfis(lista);
      setErro(null);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível carregar os perfis.',
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(perfil: PerfilAcesso) {
    setEditando(perfil);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  async function salvar(input: PerfilAcessoInput) {
    if (!empresaId) return;
    setSalvando(true);
    setErro(null);
    try {
      if (editando) {
        await perfisAcessoStorage.atualizar(empresaId, editando.id, input);
      } else {
        await perfisAcessoStorage.criar(empresaId, input);
      }
      await carregar();
      fecharModal();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!empresaId || !paraExcluir) return;
    setErro(null);
    try {
      await perfisAcessoStorage.excluir(empresaId, paraExcluir.id);
      await carregar();
      setParaExcluir(undefined);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.');
      setParaExcluir(undefined);
    }
  }

  if (!empresaId) {
    return (
      <div className="brisa-page">
        <p className="brisa-page__subtitle">Empresa não configurada.</p>
      </div>
    );
  }

  return (
    <div className="brisa-page brisa-configuracoes">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Administração</span>
          <h1 className="brisa-page__title">Configurações</h1>
          <p className="brisa-page__subtitle">
            Crie perfis de acesso e defina o que cada um pode ver e fazer no
            sistema. Ao cadastrar um usuário, basta escolher um perfil.
          </p>
        </div>
        <Button onClick={abrirNovo} leftIcon={<Icon name="plus" size={16} />}>
          Novo perfil
        </Button>
      </header>

      {erro ? (
        <p className="brisa-configuracoes__erro" role="alert">
          {erro}
        </p>
      ) : null}

      {carregando ? (
        <p className="brisa-page__subtitle">Carregando perfis…</p>
      ) : perfis.length === 0 ? (
        <div className="brisa-empty">
          <div className="brisa-empty__icon">
            <Icon name="shield-lock" size={36} />
          </div>
          <h3 className="brisa-empty__title">Nenhum perfil cadastrado</h3>
          <p className="brisa-empty__hint">
            Crie perfis como Visualizador, Editor ou Gerente para agilizar o
            cadastro de usuários.
          </p>
        </div>
      ) : (
        <div className="brisa-configuracoes__lista">
          {perfis.map((perfil) => (
            <article className="brisa-configuracoes__card" key={perfil.id}>
              <div className="brisa-configuracoes__card-head">
                <div>
                  <div className="brisa-configuracoes__card-titulos">
                    <h2 className="brisa-configuracoes__card-nome">
                      {perfil.nome}
                    </h2>
                    {perfil.ehSistema ? (
                      <Badge tone="neutral">Padrão</Badge>
                    ) : null}
                  </div>
                  {perfil.descricao ? (
                    <p className="brisa-configuracoes__card-desc">
                      {perfil.descricao}
                    </p>
                  ) : null}
                </div>
                <div className="brisa-table__actions">
                  <button
                    type="button"
                    className="brisa-icon-btn"
                    onClick={() => abrirEdicao(perfil)}
                    aria-label={`Editar perfil ${perfil.nome}`}
                    title="Editar"
                  >
                    <Icon name="pencil" size={16} />
                  </button>
                  {!perfil.ehSistema ? (
                    <button
                      type="button"
                      className="brisa-icon-btn brisa-icon-btn--danger"
                      onClick={() => setParaExcluir(perfil)}
                      aria-label={`Excluir perfil ${perfil.nome}`}
                      title="Excluir"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="brisa-configuracoes__card-perms">
                {perfil.permissoes.length} de {TODAS_PERMISSOES.length}{' '}
                permissões ativas
              </p>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar perfil de acesso' : 'Novo perfil de acesso'}
        description="Defina o nome e as permissões deste perfil. Usuários herdam este conjunto ao serem cadastrados."
        size="lg"
      >
        <PerfilAcessoForm
          key={editando?.id ?? 'novo'}
          perfil={editando}
          onCancel={fecharModal}
          onSubmit={salvar}
        />
        {salvando ? (
          <p className="brisa-configuracoes__salvando" aria-live="polite">
            Salvando…
          </p>
        ) : null}
      </Modal>

      <ConfirmDeleteModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        titulo="Excluir perfil"
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={confirmarExclusao}
      >
        <p className="brisa-confirm__text">
          Excluir o perfil <strong>{paraExcluir?.nome}</strong>? Só é possível se
          nenhum usuário estiver usando este perfil.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}
