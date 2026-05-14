import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { TurnoForm } from '../components/turnos/TurnoForm';
import { TurnosList } from '../components/turnos/TurnosList';
import { ConfirmDeleteTurnoModal } from '../components/turnos/ConfirmDeleteTurnoModal';
import { turnosStorage } from '../services/turnosStorage';
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
import './TurnosPage.css';

const FILTRO_TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  ...TIPOS_TURNO.map((t) => ({ value: t.value, label: t.label })),
];

export function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [extras, setExtras] = useState<PessoaExtra[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Turno | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Turno | undefined>(undefined);

  useEffect(() => {
    setTurnos(turnosStorage.listar());
    setFuncionarios(funcionariosStorage.listar());
    setExtras(extrasStorage.listar());
  }, []);

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

  function salvar(input: TurnoInput) {
    if (editando) {
      turnosStorage.atualizar(editando.id, input);
    } else {
      turnosStorage.criar(input);
    }
    setTurnos(turnosStorage.listar());
    disparoNotificacoes();
    fecharModal();
  }

  function confirmarExclusao() {
    if (!paraExcluir) return;
    turnosStorage.excluir(paraExcluir.id);
    setTurnos(turnosStorage.listar());
    disparoNotificacoes();
    setParaExcluir(undefined);
  }

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Escala</span>
          <h1 className="brisa-page__title">Turnos</h1>
          <p className="brisa-page__subtitle">
            Crie e gerencie os modelos de turno da Brisa — regulares,
            feriados e ocasiões especiais.
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
          Novo turno
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

        <div className="brisa-page__count">
          {turnosFiltrados.length}{' '}
          {turnosFiltrados.length === 1 ? 'turno' : 'turnos'}
        </div>
      </section>

      <TurnosList
        turnos={turnosFiltrados}
        funcionarios={funcionarios}
        extras={extras}
        onEdit={abrirEdicao}
        onDelete={(t) => setParaExcluir(t)}
      />

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
          onSubmit={salvar}
          onExtrasChange={() => {
            setExtras(extrasStorage.listar());
            disparoNotificacoes();
          }}
        />
      </Modal>

      <ConfirmDeleteTurnoModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={confirmarExclusao}
      />
    </div>
  );
}
