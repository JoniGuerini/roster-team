import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { UsuariosList } from '../components/usuarios/UsuariosList';
import { UsuarioForm } from '../components/usuarios/UsuarioForm';
import { SenhaGeradaModal } from '../components/usuarios/SenhaGeradaModal';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { profilesStorage } from '../services/profilesStorage';
import { perfisAcessoStorage } from '../services/perfisAcessoStorage';
import type { Sessao } from '../services/authSession';
import { STATUS_USUARIO, type StatusUsuario, type Usuario, type UsuarioInput } from '../types/usuario';
import type { PerfilAcesso } from '../types/perfilAcesso';
import { labelPapel, labelStatusUsuario } from '../utils/usuarioLabels';
import './UsuariosPage.css';

const OPCAO_TODOS = [{ value: '', label: 'Todos' }];

interface SenhaState {
  open: boolean;
  usuario: Usuario | null;
  senha: string;
}

const SENHA_INICIAL: SenhaState = { open: false, usuario: null, senha: '' };

interface UsuariosPageProps {
  sessao: Sessao;
}

export function UsuariosPage({ sessao }: UsuariosPageProps) {
  const empresaId = sessao.empresaId;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfisAcesso, setPerfisAcesso] = useState<PerfilAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusUsuario | ''>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Usuario | undefined>(undefined);
  const [senha, setSenha] = useState<SenhaState>(SENHA_INICIAL);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!empresaId) return;
    setCarregando(true);
    try {
      await perfisAcessoStorage.garantirSeed(empresaId);
      const [lista, perfis] = await Promise.all([
        profilesStorage.listarPorEmpresa(empresaId),
        perfisAcessoStorage.listarPorEmpresa(empresaId),
      ]);
      setUsuarios(lista);
      setPerfisAcesso(perfis);
      setErro(null);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível carregar os usuários.',
      );
    } finally {
      setCarregando(false);
    }
  }, [empresaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroPerfil && u.perfilAcessoId !== filtroPerfil) return false;
      if (filtroStatus && u.status !== filtroStatus) return false;
      if (!termo) return true;
      const haystack = [
        u.nome,
        u.email,
        u.perfilAcessoNome,
        labelPapel(u.papel),
        labelStatusUsuario(u.status),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(termo);
    });
  }, [usuarios, busca, filtroPerfil, filtroStatus]);

  const haFiltrosOuBusca =
    busca.trim() !== '' || filtroPerfil !== '' || filtroStatus !== '';

  function limparFiltrosEBusca() {
    setBusca('');
    setFiltroPerfil('');
    setFiltroStatus('');
  }

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
    setErro(null);
  }

  function abrirEdicao(usuario: Usuario) {
    if (usuario.id === sessao.userId) return;
    setEditando(usuario);
    setModalAberto(true);
    setErro(null);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  async function salvar(input: UsuarioInput, senhaProvisoria?: string) {
    if (!empresaId) return;
    setSalvando(true);
    setErro(null);
    try {
      if (editando) {
        await profilesStorage.atualizarNaEmpresa(empresaId, editando.id, input);
        await carregar();
        fecharModal();
        return;
      }

      if (!senhaProvisoria) {
        setErro('Informe uma senha para o novo usuário.');
        return;
      }

      const novo = await profilesStorage.criarNaEmpresa(
        empresaId,
        input,
        senhaProvisoria,
      );
      await carregar();
      fecharModal();
      setSenha({ open: true, usuario: novo, senha: senhaProvisoria });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function gerarNovaSenha(usuario: Usuario) {
    if (!empresaId || usuario.id === sessao.userId) return;
    setErro(null);
    try {
      const novaSenha = await profilesStorage.gerarNovaSenha(empresaId, usuario.id);
      setSenha({ open: true, usuario, senha: novaSenha });
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível gerar uma nova senha.',
      );
    }
  }

  function fecharSenha() {
    setSenha(SENHA_INICIAL);
  }

  async function confirmarExclusao() {
    if (!empresaId || !paraExcluir) return;
    setErro(null);
    try {
      await profilesStorage.excluirDaEmpresa(empresaId, paraExcluir.id);
      await carregar();
      setParaExcluir(undefined);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível remover.');
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
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Administração</span>
          <h1 className="brisa-page__title">Usuários</h1>
          <p className="brisa-page__subtitle">
            Crie acessos para a equipe, defina permissões e gere senhas
            provisórias.
          </p>
          <p className="brisa-page__list-count" aria-live="polite">
            {usuariosFiltrados.length}{' '}
            {usuariosFiltrados.length === 1 ? 'usuário' : 'usuários'}
            {haFiltrosOuBusca && usuarios.length > 0 ? (
              <span className="brisa-page__count-total"> de {usuarios.length}</span>
            ) : null}
          </p>
        </div>
        <Button onClick={abrirNovo} leftIcon={<Icon name="plus" size={16} />}>
          Novo usuário
        </Button>
      </header>

      {erro ? (
        <p className="brisa-usuarios__erro" role="alert">
          {erro}
        </p>
      ) : null}

      <section className="brisa-page__toolbar">
        <div className="brisa-usuarios__toolbar">
          <div className="brisa-search brisa-search--inline">
            <Icon name="search" size={16} />
            <Input
              id="busca-usuarios"
              placeholder="Buscar por nome, e-mail ou perfil…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar usuários"
            />
          </div>

          <Field label="Permissões" htmlFor="filtro-usuario-perfil">
            <Select
              id="filtro-usuario-perfil"
              placeholder="Todos"
              options={[
                ...OPCAO_TODOS,
                ...perfisAcesso.map((p) => ({
                  value: p.id,
                  label: p.nome,
                })),
              ]}
              value={filtroPerfil}
              onChange={(e) => setFiltroPerfil(e.target.value)}
            />
          </Field>
          <Field label="Status" htmlFor="filtro-usuario-status">
            <Select
              id="filtro-usuario-status"
              placeholder="Todos"
              options={[
                ...OPCAO_TODOS,
                ...STATUS_USUARIO.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              ]}
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value as StatusUsuario | '')
              }
            />
          </Field>

          <div className="brisa-usuarios__toolbar-reset">
            <Field label=" " htmlFor="reset-filtros-usuarios">
              <Button
                id="reset-filtros-usuarios"
                type="button"
                variant="secondary"
                onClick={limparFiltrosEBusca}
                disabled={!haFiltrosOuBusca}
                aria-label="Limpar busca e filtros"
              >
                Limpar
              </Button>
            </Field>
          </div>
        </div>
      </section>

      {carregando ? (
        <p className="brisa-page__subtitle">Carregando usuários…</p>
      ) : usuariosFiltrados.length === 0 && haFiltrosOuBusca ? (
        <div className="brisa-page__empty-filtro">
          <h3 className="brisa-page__empty-filtro-title">
            Nenhum resultado encontrado
          </h3>
          <p className="brisa-page__empty-filtro-hint">
            Ajuste a busca ou os filtros por perfil e status.
          </p>
          <Button type="button" variant="secondary" onClick={limparFiltrosEBusca}>
            Limpar busca e filtros
          </Button>
        </div>
      ) : (
        <UsuariosList
          usuarios={usuariosFiltrados}
          usuarioAtualId={sessao.userId}
          onEdit={abrirEdicao}
          onGerarSenha={gerarNovaSenha}
          onDelete={(u) => setParaExcluir(u)}
        />
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar usuário' : 'Novo usuário'}
        description={
          editando
            ? 'Atualize permissões e status deste acesso.'
            : 'Preencha os dados, defina as permissões e gere a senha de acesso.'
        }
        size="lg"
      >
        <UsuarioForm
          key={editando?.id ?? 'novo'}
          usuario={editando}
          perfisAcesso={perfisAcesso}
          emailSomenteLeitura={Boolean(editando)}
          onCancel={fecharModal}
          onSubmit={salvar}
        />
        {salvando ? (
          <p className="brisa-usuarios__salvando" aria-live="polite">
            Salvando…
          </p>
        ) : null}
      </Modal>

      <SenhaGeradaModal
        open={senha.open}
        nomeUsuario={senha.usuario?.nome ?? ''}
        email={senha.usuario?.email ?? ''}
        senha={senha.senha}
        onClose={fecharSenha}
      />

      <ConfirmDeleteModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        titulo="Excluir usuário"
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={confirmarExclusao}
      >
        <p className="brisa-confirm__text">
          Remover o acesso de <strong>{paraExcluir?.nome}</strong>? A pessoa
          perderá o login. Esta ação não pode ser desfeita.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}
