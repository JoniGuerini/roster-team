import { useEffect, useMemo, useState } from 'react';
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
import { usuariosStorage } from '../services/usuariosStorage';
import {
  PAPEIS_USUARIO,
  STATUS_USUARIO,
  type PapelUsuario,
  type StatusUsuario,
  type Usuario,
  type UsuarioInput,
} from '../types/usuario';
import { gerarSenha } from '../utils/gerarSenha';
import { labelPapel, labelStatusUsuario } from '../utils/usuarioLabels';
import './FuncionariosPage.css';
import './UsuariosPage.css';

const OPCAO_TODOS = [{ value: '', label: 'Todos' }];

interface SenhaState {
  open: boolean;
  usuario: Usuario | null;
  senha: string;
}

const SENHA_INICIAL: SenhaState = { open: false, usuario: null, senha: '' };

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState<PapelUsuario | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusUsuario | ''>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Usuario | undefined>(undefined);
  const [senha, setSenha] = useState<SenhaState>(SENHA_INICIAL);

  useEffect(() => {
    setUsuarios(usuariosStorage.listar());
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroPapel && u.papel !== filtroPapel) return false;
      if (filtroStatus && u.status !== filtroStatus) return false;
      if (!termo) return true;
      const haystack = [
        u.nome,
        u.email,
        labelPapel(u.papel),
        labelStatusUsuario(u.status),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(termo);
    });
  }, [usuarios, busca, filtroPapel, filtroStatus]);

  const haFiltrosOuBusca =
    busca.trim() !== '' || filtroPapel !== '' || filtroStatus !== '';

  function limparFiltrosEBusca() {
    setBusca('');
    setFiltroPapel('');
    setFiltroStatus('');
  }

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(usuario: Usuario) {
    setEditando(usuario);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  function salvar(input: UsuarioInput) {
    if (editando) {
      usuariosStorage.atualizar(editando.id, input);
      setUsuarios(usuariosStorage.listar());
      fecharModal();
      return;
    }
    const novo = usuariosStorage.criar(input);
    setUsuarios(usuariosStorage.listar());
    fecharModal();
    setSenha({ open: true, usuario: novo, senha: gerarSenha() });
  }

  function gerarNovaSenha(usuario: Usuario) {
    const atualizado = usuariosStorage.registrarSenhaGerada(usuario.id);
    setUsuarios(usuariosStorage.listar());
    setSenha({
      open: true,
      usuario: atualizado ?? usuario,
      senha: gerarSenha(),
    });
  }

  function fecharSenha() {
    setSenha(SENHA_INICIAL);
  }

  function confirmarExclusao() {
    if (!paraExcluir) return;
    usuariosStorage.excluir(paraExcluir.id);
    setUsuarios(usuariosStorage.listar());
    setParaExcluir(undefined);
  }

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Administração</span>
          <h1 className="brisa-page__title">Usuários e permissões</h1>
          <p className="brisa-page__subtitle">
            Crie acessos para a equipe, defina papéis e permissões e gere senhas
            temporárias.
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

      <div className="brisa-usuarios__mock" role="note">
        <span className="brisa-usuarios__mock-badge">demo</span>
        <span className="brisa-usuarios__mock-text">
          Tela demonstrativa, ainda sem backend. Usuários, permissões e senhas
          são fictícios e ficam salvos apenas neste navegador.
        </span>
      </div>

      <section className="brisa-page__toolbar">
        <div className="brisa-usuarios__toolbar">
          <div className="brisa-search brisa-search--inline">
            <Icon name="search" size={16} />
            <Input
              id="busca-usuarios"
              placeholder="Buscar por nome, e-mail, papel…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar usuários"
            />
          </div>

          <Field label="Papel" htmlFor="filtro-usuario-papel">
            <Select
              id="filtro-usuario-papel"
              placeholder="Todos"
              options={[
                ...OPCAO_TODOS,
                ...PAPEIS_USUARIO.map((p) => ({
                  value: p.value,
                  label: p.label,
                })),
              ]}
              value={filtroPapel}
              onChange={(e) => setFiltroPapel(e.target.value as PapelUsuario | '')}
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

      {usuariosFiltrados.length === 0 && haFiltrosOuBusca ? (
        <div className="brisa-page__empty-filtro">
          <h3 className="brisa-page__empty-filtro-title">
            Nenhum resultado encontrado
          </h3>
          <p className="brisa-page__empty-filtro-hint">
            Ajuste a busca ou os filtros por papel e status.
          </p>
          <Button type="button" variant="secondary" onClick={limparFiltrosEBusca}>
            Limpar busca e filtros
          </Button>
        </div>
      ) : (
        <UsuariosList
          usuarios={usuariosFiltrados}
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
            ? 'Atualize os dados, o papel e as permissões deste acesso.'
            : 'Preencha os dados, defina as permissões e gere a senha de acesso.'
        }
        size="lg"
      >
        <UsuarioForm
          key={editando?.id ?? 'novo'}
          usuario={editando}
          onCancel={fecharModal}
          onSubmit={salvar}
        />
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
