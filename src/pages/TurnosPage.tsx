import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { TurnoForm } from '../components/turnos/TurnoForm';
import { TurnosList } from '../components/turnos/TurnosList';
import { ConfirmDeleteTurnoModal } from '../components/turnos/ConfirmDeleteTurnoModal';
import { PageToolbarHead } from '../components/layout/PageToolbarHead';
import { TurnosListSkeleton } from '../components/ui/PageSkeletons';
import { turnosStorage } from '../services/turnosStorage';
import type { Sessao } from '../services/authSession';
import { podeEditarModulo } from '../utils/rotaPermissoes';
import { escalaStorage } from '../services/escalaStorage';
import { funcionariosStorage } from '../services/funcionariosStorage';
import {
  TIPOS_TURNO,
  type TipoTurno,
  type Turno,
  type TurnoInput,
} from '../types/turno';
import type { Funcionario } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import { extrasStorage } from '../services/extrasStorage';
import './FuncionariosPage.css';

const FILTRO_TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  ...TIPOS_TURNO.map((t) => ({ value: t.value, label: t.label })),
];

interface TurnosPageProps {
  sessao: Sessao;
}

export function TurnosPage({ sessao }: TurnosPageProps) {
  const podeEditar = podeEditarModulo(sessao.permissoes, 'turnos');
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [extras, setExtras] = useState<PessoaExtra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Turno | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Turno | undefined>(undefined);

  const carregar = useCallback(async () => {
    if (!sessao.empresaId) return;
    setCarregando(true);
    try {
      const [lista, funcs, ext] = await Promise.all([
        turnosStorage.listar(),
        funcionariosStorage.listar(),
        extrasStorage.listar(),
      ]);
      setTurnos(lista);
      setFuncionarios(funcs);
      setExtras(ext);
      setErro(null);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível carregar os turnos.',
      );
      setTurnos([]);
      setFuncionarios([]);
      setExtras([]);
    } finally {
      setCarregando(false);
    }
  }, [sessao.empresaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const turnosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return turnos.filter((t) => {
      const passaTipo =
        filtroTipo === 'todos' || t.tipo === (filtroTipo as TipoTurno);
      if (!passaTipo) return false;
      if (!termo) return true;
      return (
        t.nome.toLowerCase().includes(termo) ||
        t.observacoes?.toLowerCase().includes(termo) ||
        t.localTrabalho.toLowerCase().includes(termo)
      );
    });
  }, [turnos, busca, filtroTipo]);

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(turno: Turno) {
    setEditando(turno);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  async function salvar(input: TurnoInput) {
    try {
      if (editando) {
        await turnosStorage.atualizar(editando.id, input);
      } else {
        await turnosStorage.criar(input);
      }
      await carregar();
      disparoNotificacoes();
      fecharModal();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível salvar o turno.',
      );
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await turnosStorage.excluir(paraExcluir.id);
      await escalaStorage.removerReferenciasTurno(paraExcluir.id);
      await carregar();
      disparoNotificacoes();
      setParaExcluir(undefined);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : 'Não foi possível excluir o turno.',
      );
    }
  }

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Escala</span>
          <h1 className="brisa-page__title">Turnos</h1>
          <p className="brisa-page__subtitle">
            Crie e gerencie os modelos de turno — regulares,
            feriados e ocasiões especiais.
          </p>
        </div>
      </header>

      {erro ? (
        <div className="brisa-funcionarios__erro" role="alert">
          {erro}
        </div>
      ) : null}

      <section className="brisa-page__toolbar">
        <PageToolbarHead
          titulo="Turnos"
          quantidade={turnosFiltrados.length}
          rotuloSingular="turno"
          rotuloPlural="turnos"
        >
          {podeEditar ? (
            <Button onClick={abrirNovo} leftIcon={<Icon name="plus" size={16} />}>
              Novo turno
            </Button>
          ) : null}
        </PageToolbarHead>

        <div className="brisa-page__toolbar-filters">
        <div className="brisa-search">
          <Icon name="search" size={16} />
          <Input
            placeholder="Buscar por nome, local ou observação…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="brisa-page__filter">
          <Select
            options={FILTRO_TIPO_OPTIONS}
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          />
        </div>
        </div>
      </section>

      {carregando ? (
        <TurnosListSkeleton />
      ) : null}

      {!carregando ? (
        <TurnosList
          turnos={turnosFiltrados}
          funcionarios={funcionarios}
          extras={extras}
          onEdit={podeEditar ? abrirEdicao : undefined}
          onDelete={podeEditar ? (t) => setParaExcluir(t) : undefined}
        />
      ) : null}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar turno' : 'Criar novo turno'}
        description={
          editando
            ? 'Atualize as informações do turno conforme necessário.'
            : 'Defina o modelo de turno: tipo, horário, equipe necessária e quem normalmente cobre.'
        }
        size="lg"
      >
        <TurnoForm
          key={editando?.id ?? 'novo'}
          turno={editando}
          funcionarios={funcionarios}
          extras={extras}
          onCancel={fecharModal}
          onSubmit={(input) => void salvar(input)}
          onExtrasChange={() => {
            void extrasStorage.listar().then(setExtras).catch(() => setExtras([]));
            disparoNotificacoes();
          }}
        />
      </Modal>

      <ConfirmDeleteTurnoModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={() => void confirmarExclusao()}
      />
    </div>
  );
}
