import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmpresaLogo } from '../components/empresas/EmpresaLogo';
import { EmpresaForm } from '../components/empresas/EmpresaForm';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { UsuariosList } from '../components/usuarios/UsuariosList';
import { UsuarioForm } from '../components/usuarios/UsuarioForm';
import { SenhaGeradaModal } from '../components/usuarios/SenhaGeradaModal';
import { empresasStorage } from '../services/empresasStorage';
import { profilesStorage } from '../services/profilesStorage';
import { perfisAcessoStorage } from '../services/perfisAcessoStorage';
import {
  RECURSOS_EMPRESA,
  type Empresa,
  type EmpresaInput,
  type RecursoEmpresa,
} from '../types/empresa';
import type { Usuario, UsuarioInput } from '../types/usuario';
import type { PerfilAcesso } from '../types/perfilAcesso';
import { formatarDataHora } from '../utils/usuarioLabels';
import './EmpresaDetalhePage.css';

interface EmpresaDetalhePageProps {
  id: string;
  onVoltar: () => void;
}

type AbaDetalhe = 'detalhes' | 'funcionalidades' | 'usuarios';

export function EmpresaDetalhePage({ id, onVoltar }: EmpresaDetalhePageProps) {
  const [empresa, setEmpresa] = useState<Empresa | undefined>(undefined);
  const [ativaId, setAtivaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalEdit, setModalEdit] = useState(false);
  const [aba, setAba] = useState<AbaDetalhe>('detalhes');
  const [usuarioExcluir, setUsuarioExcluir] = useState<Usuario | undefined>(
    undefined,
  );
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | undefined>(
    undefined,
  );
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [erroUsuarios, setErroUsuarios] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{
    usuario: Usuario;
    senha: string;
  } | null>(null);
  const [perfisAcesso, setPerfisAcesso] = useState<PerfilAcesso[]>([]);

  async function carregarPerfisAcesso() {
    try {
      await perfisAcessoStorage.garantirSeed(id);
      const lista = await perfisAcessoStorage.listarPorEmpresa(id);
      setPerfisAcesso(lista);
    } catch {
      setPerfisAcesso([]);
    }
  }

  async function carregarUsuarios() {
    try {
      const lista = await profilesStorage.listarPorEmpresa(id);
      setUsuarios(lista);
      setErroUsuarios(null);
    } catch (erro) {
      setErroUsuarios(
        erro instanceof Error ? erro.message : 'Erro ao carregar usuários.',
      );
    }
  }

  async function recarregar() {
    setCarregando(true);
    const dados = await empresasStorage.obter(id);
    setEmpresa(dados);
    setAtivaId(empresasStorage.obterAtivaId());
    await carregarUsuarios();
    await carregarPerfisAcesso();
    setCarregando(false);
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (carregando) {
    return (
      <div className="brisa-page brisa-empresa-detalhe">
        <p className="brisa-page__subtitle">Carregando empresa…</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="brisa-page brisa-empresa-detalhe">
        <button type="button" className="brisa-detalhe__back" onClick={onVoltar}>
          <Icon name="arrow-left" size={18} />
          Voltar para empresas
        </button>
        <div className="brisa-empty">
          <div className="brisa-empty__icon">
            <Icon name="building" size={36} />
          </div>
          <h3 className="brisa-empty__title">Empresa não encontrada</h3>
          <p className="brisa-empty__hint">
            Ela pode ter sido removida. Volte e selecione outra.
          </p>
        </div>
      </div>
    );
  }

  const ativa = empresa.id === ativaId;

  async function alternarRecurso(recurso: RecursoEmpresa, valor: boolean) {
    const atualizada = await empresasStorage.atualizarRecurso(id, recurso, valor);
    setEmpresa(atualizada);
  }

  function tornarAtiva() {
    empresasStorage.definirAtiva(id);
    setAtivaId(empresasStorage.obterAtivaId());
  }

  async function salvarEdicao(input: EmpresaInput) {
    await empresasStorage.atualizar(id, input);
    await recarregar();
    setModalEdit(false);
  }

  function abrirNovoUsuario() {
    setEditandoUsuario(undefined);
    void carregarPerfisAcesso();
    setModalUsuario(true);
    setErroUsuarios(null);
  }

  function abrirEditarUsuario(usuario: Usuario) {
    setEditandoUsuario(usuario);
    void carregarPerfisAcesso();
    setModalUsuario(true);
    setErroUsuarios(null);
  }

  function fecharModalUsuario() {
    setModalUsuario(false);
    setEditandoUsuario(undefined);
  }

  async function salvarUsuario(input: UsuarioInput, senha?: string) {
    setSalvandoUsuario(true);
    setErroUsuarios(null);
    try {
      if (editandoUsuario) {
        await profilesStorage.atualizarNaEmpresa(id, editandoUsuario.id, input);
        await carregarUsuarios();
        fecharModalUsuario();
        return;
      }

      if (!senha) {
        setErroUsuarios('Informe uma senha para o novo usuário.');
        return;
      }

      const novo = await profilesStorage.criarNaEmpresa(id, input, senha);
      await carregarUsuarios();
      fecharModalUsuario();
      setSenhaGerada({ usuario: novo, senha });
    } catch (erro) {
      setErroUsuarios(
        erro instanceof Error ? erro.message : 'Não foi possível salvar.',
      );
    } finally {
      setSalvandoUsuario(false);
    }
  }

  async function confirmarExclusaoUsuario() {
    if (!usuarioExcluir) return;
    setErroUsuarios(null);
    try {
      await profilesStorage.excluirDaEmpresa(id, usuarioExcluir.id);
      await carregarUsuarios();
      setUsuarioExcluir(undefined);
    } catch (erro) {
      setErroUsuarios(
        erro instanceof Error ? erro.message : 'Não foi possível remover.',
      );
      setUsuarioExcluir(undefined);
    }
  }

  async function limparUsuarios() {
    setErroUsuarios(null);
    try {
      await profilesStorage.excluirTodosDaEmpresa(id);
      await carregarUsuarios();
      setConfirmarLimpar(false);
    } catch (erro) {
      setErroUsuarios(
        erro instanceof Error ? erro.message : 'Não foi possível remover.',
      );
      setConfirmarLimpar(false);
    }
  }

  async function redefinirSenhaUsuario(usuario: Usuario) {
    setErroUsuarios(null);
    try {
      const senha = await profilesStorage.gerarNovaSenha(id, usuario.id);
      setSenhaGerada({ usuario, senha });
    } catch (erro) {
      setErroUsuarios(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível gerar uma nova senha.',
      );
    }
  }

  const recursosAtivos = RECURSOS_EMPRESA.filter(
    (r) => empresa.recursos[r.value],
  ).length;

  const abasOpcoes = [
    {
      value: 'detalhes' as const,
      label: 'Detalhes',
      icon: <Icon name="info-circle" size={16} />,
    },
    {
      value: 'funcionalidades' as const,
      label: 'Funcionalidades',
      icon: <Icon name="adjustments" size={16} />,
      badge: `${recursosAtivos}/${RECURSOS_EMPRESA.length}`,
    },
    {
      value: 'usuarios' as const,
      label: 'Usuários',
      icon: <Icon name="users" size={16} />,
      badge: usuarios.length > 0 ? usuarios.length : undefined,
    },
  ];

  return (
    <div className="brisa-page brisa-empresa-detalhe">
      <button type="button" className="brisa-detalhe__back" onClick={onVoltar}>
        <Icon name="arrow-left" size={18} />
        Voltar para empresas
      </button>

      <header className="brisa-detalhe__header">
        <EmpresaLogo
          nome={empresa.nome}
          logoUrl={empresa.logoUrl}
          corPrimaria={empresa.corPrimaria}
          size={72}
        />
        <div className="brisa-detalhe__id">
          <div className="brisa-detalhe__title-row">
            <h1 className="brisa-detalhe__nome">{empresa.nome}</h1>
            <Badge tone={empresa.status === 'ativa' ? 'success' : 'neutral'}>
              {empresa.status === 'ativa' ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          {empresa.segmento ? (
            <span className="brisa-detalhe__segmento">{empresa.segmento}</span>
          ) : null}
        </div>
        <div className="brisa-detalhe__header-acoes">
          <Button
            variant="secondary"
            leftIcon={<Icon name="check" size={16} />}
            onClick={tornarAtiva}
            disabled={ativa}
          >
            {ativa ? 'Empresa ativa' : 'Tornar ativa'}
          </Button>
          <Button
            leftIcon={<Icon name="pencil" size={16} />}
            onClick={() => setModalEdit(true)}
          >
            Editar
          </Button>
        </div>
      </header>

      <SegmentedControl
        value={aba}
        options={abasOpcoes}
        onChange={setAba}
        ariaLabel="Seções da empresa"
      />

      {aba === 'detalhes' ? (
        <section className="brisa-detalhe__card" role="tabpanel">
          <div className="brisa-detalhe__owner">
            <span
              className="brisa-detalhe__owner-avatar"
              style={{ background: empresa.corPrimaria }}
            >
              {empresa.ownerNome.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <div className="brisa-detalhe__owner-info">
              <span className="brisa-detalhe__dado-label">Owner</span>
              <span className="brisa-detalhe__owner-nome">
                {empresa.ownerNome}
              </span>
              <span className="brisa-detalhe__owner-email">
                {empresa.ownerEmail}
              </span>
            </div>
          </div>

          <dl className="brisa-detalhe__dados-lista">
            <div className="brisa-detalhe__dado">
              <dt className="brisa-detalhe__dado-label">Cor da marca</dt>
              <dd className="brisa-detalhe__dado-valor brisa-detalhe__cor">
                <span
                  className="brisa-detalhe__cor-swatch"
                  style={{ background: empresa.corPrimaria }}
                />
                {empresa.corPrimaria.toUpperCase()}
              </dd>
            </div>
            <div className="brisa-detalhe__dado">
              <dt className="brisa-detalhe__dado-label">Criada em</dt>
              <dd className="brisa-detalhe__dado-valor">
                {formatarDataHora(empresa.criadaEm)}
              </dd>
            </div>
            <div className="brisa-detalhe__dado">
              <dt className="brisa-detalhe__dado-label">Atualizada em</dt>
              <dd className="brisa-detalhe__dado-valor">
                {formatarDataHora(empresa.atualizadaEm)}
              </dd>
            </div>
            <div className="brisa-detalhe__dado">
              <dt className="brisa-detalhe__dado-label">ID</dt>
              <dd className="brisa-detalhe__dado-valor brisa-detalhe__mono">
                {empresa.id}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {aba === 'funcionalidades' ? (
        <section className="brisa-detalhe__card" role="tabpanel">
          <div className="brisa-detalhe__card-head">
            <div>
              <h2 className="brisa-detalhe__card-title">Funcionalidades</h2>
              <p className="brisa-detalhe__card-sub">
                Ligue ou desligue módulos para esta empresa. A empresa ativa
                reflete isso no menu do app.
              </p>
            </div>
            <span className="brisa-detalhe__recursos-contagem">
              {recursosAtivos}/{RECURSOS_EMPRESA.length}
            </span>
          </div>

          <ul className="brisa-detalhe__recursos-lista">
            {RECURSOS_EMPRESA.map((recurso) => {
              const ativo = empresa.recursos[recurso.value];
              return (
                <li key={recurso.value} className="brisa-detalhe__recurso">
                  <span
                    className={`brisa-detalhe__recurso-icon ${ativo ? 'brisa-detalhe__recurso-icon--on' : ''}`}
                  >
                    <Icon name={recurso.icon} size={18} />
                  </span>
                  <div className="brisa-detalhe__recurso-info">
                    <span className="brisa-detalhe__recurso-label">
                      {recurso.label}
                    </span>
                    <span className="brisa-detalhe__recurso-desc">
                      {recurso.descricao}
                    </span>
                  </div>
                  <Switch
                    checked={ativo}
                    onChange={(v) => alternarRecurso(recurso.value, v)}
                    label={`Ativar ${recurso.label}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {aba === 'usuarios' ? (
        <div className="brisa-detalhe__usuarios" role="tabpanel">
          <div className="brisa-detalhe__usuarios-head">
            <div>
              <h2 className="brisa-detalhe__card-title">Usuários da empresa</h2>
              <p className="brisa-detalhe__card-sub">
                {usuarios.length}{' '}
                {usuarios.length === 1
                  ? 'usuário vinculado'
                  : 'usuários vinculados'}{' '}
                a esta empresa.
              </p>
            </div>
            <div className="brisa-detalhe__usuarios-acoes">
              <Button
                size="sm"
                leftIcon={<Icon name="plus" size={15} />}
                onClick={abrirNovoUsuario}
              >
                Novo usuário
              </Button>
              {usuarios.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Icon name="trash" size={15} />}
                  onClick={() => setConfirmarLimpar(true)}
                >
                  Remover todos
                </Button>
              ) : null}
            </div>
          </div>

          {erroUsuarios ? (
            <p className="brisa-detalhe__erro" role="alert">
              {erroUsuarios}
            </p>
          ) : null}

          <UsuariosList
            usuarios={usuarios}
            onEdit={abrirEditarUsuario}
            onGerarSenha={redefinirSenhaUsuario}
            onDelete={(u) => setUsuarioExcluir(u)}
            emptyTitle="Nenhum usuário vinculado"
            emptyHint="Clique em Novo usuário para criar um acesso vinculado a esta empresa."
          />
        </div>
      ) : null}

      <Modal
        open={modalUsuario}
        onClose={fecharModalUsuario}
        title={editandoUsuario ? 'Editar usuário' : 'Novo usuário'}
        description={
          editandoUsuario
            ? 'Atualize permissões e status deste acesso.'
            : 'Crie um acesso com senha provisória para o primeiro login.'
        }
        size="lg"
      >
        <UsuarioForm
          usuario={editandoUsuario}
          perfisAcesso={perfisAcesso}
          emailSomenteLeitura={Boolean(editandoUsuario)}
          onCancel={fecharModalUsuario}
          onSubmit={salvarUsuario}
        />
        {salvandoUsuario ? (
          <p className="brisa-detalhe__salvando" aria-live="polite">
            Salvando…
          </p>
        ) : null}
      </Modal>

      <SenhaGeradaModal
        open={Boolean(senhaGerada)}
        nomeUsuario={senhaGerada?.usuario.nome ?? ''}
        email={senhaGerada?.usuario.email ?? ''}
        senha={senhaGerada?.senha ?? ''}
        onClose={() => setSenhaGerada(null)}
      />

      <Modal
        open={modalEdit}
        onClose={() => setModalEdit(false)}
        title="Editar empresa"
        description="Atualize a marca, o owner e o status desta empresa."
        size="lg"
      >
        <EmpresaForm
          empresa={empresa}
          onCancel={() => setModalEdit(false)}
          onSubmit={salvarEdicao}
        />
      </Modal>

      <ConfirmDeleteModal
        open={Boolean(usuarioExcluir)}
        nome={usuarioExcluir?.nome ?? ''}
        titulo="Excluir usuário"
        onCancel={() => setUsuarioExcluir(undefined)}
        onConfirm={confirmarExclusaoUsuario}
      >
        <p className="brisa-confirm__text">
          Remover <strong>{usuarioExcluir?.nome}</strong> desta empresa? Esta
          ação não pode ser desfeita.
        </p>
      </ConfirmDeleteModal>

      <ConfirmDeleteModal
        open={confirmarLimpar}
        nome=""
        titulo="Remover todos os usuários"
        onCancel={() => setConfirmarLimpar(false)}
        onConfirm={limparUsuarios}
      >
        <p className="brisa-confirm__text">
          Remover <strong>todos os {usuarios.length} usuários</strong> vinculados
          a esta empresa? Esta ação não pode ser desfeita.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}
