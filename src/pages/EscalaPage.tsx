import { useEffect, useMemo, useState } from 'react';
import {
  EscalaToolbar,
  type FiltroLocal,
  type ModoVisualizacao,
} from '../components/escala/EscalaToolbar';
import { SemanaView } from '../components/escala/SemanaView';
import { DiaView } from '../components/escala/DiaView';
import { MesView } from '../components/escala/MesView';
import { AdicionarTurnoModal } from '../components/escala/AdicionarTurnoModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TurnoForm } from '../components/turnos/TurnoForm';
import { escalaStorage } from '../services/escalaStorage';
import { turnosStorage } from '../services/turnosStorage';
import { funcionariosStorage } from '../services/funcionariosStorage';
import { extrasStorage } from '../services/extrasStorage';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import type { EscalaDia } from '../types/escala';
import type { Funcionario } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import type { Turno, TurnoInput } from '../types/turno';
import {
  adicionarDias,
  adicionarMeses,
  diasDaSemana,
  diasDoMesGrade,
  hojeISO,
  rotuloDataLonga,
} from '../utils/datas';
import {
  montarAlocacoesAPartirDoInputTurno,
  montarAlocacoesIniciaisDoTurno,
} from '../utils/alocacoesIniciaisTurno';
import './EscalaPage.css';

interface ModalEdicaoTurnoEscala {
  turno: Turno;
  data: string;
  turnoEscaladoId: string;
}

function filtrarEscalasPorLocal(
  escalas: EscalaDia[],
  turnos: Turno[],
  filtroLocal: FiltroLocal,
): EscalaDia[] {
  if (filtroLocal === 'todos') return escalas;
  return escalas.map((e) => ({
    ...e,
    turnos: e.turnos.filter((te) => {
      const turno = turnos.find((t) => t.id === te.turnoId);
      return turno?.localTrabalho === filtroLocal;
    }),
  }));
}

export function EscalaPage() {
  const [data, setData] = useState<string>(hojeISO());
  const [modo, setModo] = useState<ModoVisualizacao>('semana');
  const [filtroLocal, setFiltroLocal] = useState<FiltroLocal>('todos');

  const [escalas, setEscalas] = useState<EscalaDia[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [extras, setExtras] = useState<PessoaExtra[]>([]);

  const [adicionarPara, setAdicionarPara] = useState<string | null>(null);
  const [modalEdicaoTurno, setModalEdicaoTurno] =
    useState<ModalEdicaoTurnoEscala | null>(null);

  function recarregar(disparar = false) {
    setEscalas(escalaStorage.listar());
    setTurnos(turnosStorage.listar());
    setFuncionarios(funcionariosStorage.listar());
    setExtras(extrasStorage.listar());
    if (disparar) disparoNotificacoes();
  }

  useEffect(() => {
    recarregar();
  }, []);

  const intervaloVisivel = useMemo(() => {
    if (modo === 'dia') return [data, data] as const;
    if (modo === 'semana') {
      const semana = diasDaSemana(data);
      return [semana[0], semana[6]] as const;
    }
    const grade = diasDoMesGrade(data);
    return [grade[0], grade[grade.length - 1]] as const;
  }, [data, modo]);

  useEffect(() => {
    if (turnos.length === 0) return;
    const [ini, fim] = intervaloVisivel;
    const n = escalaStorage.sincronizarTurnosRecorrentes(
      ini,
      fim,
      turnos,
      (t, d) => montarAlocacoesIniciaisDoTurno(t, funcionarios, extras, d),
    );
    if (n > 0) {
      setEscalas(escalaStorage.listar());
      disparoNotificacoes();
    }
  }, [intervaloVisivel, turnos, funcionarios, extras]);

  const escalasNoIntervalo = useMemo(
    () =>
      escalas.filter(
        (e) => e.data >= intervaloVisivel[0] && e.data <= intervaloVisivel[1],
      ),
    [escalas, intervaloVisivel],
  );

  const escalasFiltradas = useMemo(
    () => filtrarEscalasPorLocal(escalasNoIntervalo, turnos, filtroLocal),
    [escalasNoIntervalo, turnos, filtroLocal],
  );

  function navegar(direcao: -1 | 1) {
    if (modo === 'dia') setData(adicionarDias(data, direcao));
    else if (modo === 'semana') setData(adicionarDias(data, direcao * 7));
    else setData(adicionarMeses(data, direcao));
  }

  function irParaHoje() {
    setData(hojeISO());
  }

  function abrirAdicionarPara(dataAlvo: string) {
    setAdicionarPara(dataAlvo);
  }

  function confirmarAdicionar(turnoId: string) {
    if (!adicionarPara) return;
    const turno = turnos.find((t) => t.id === turnoId);
    if (!turno) return;
    const alocacoes = montarAlocacoesIniciaisDoTurno(
      turno,
      funcionarios,
      extras,
      adicionarPara,
    );
    escalaStorage.adicionarTurno(adicionarPara, turnoId, alocacoes);
    recarregar(true);
    setAdicionarPara(null);
  }

  function abrirEdicaoTurnoNaEscala(dataCtx: string, turnoEscaladoId: string) {
    const escalaDia = escalas.find((e) => e.data === dataCtx);
    const te = escalaDia?.turnos.find((t) => t.id === turnoEscaladoId);
    if (!te) return;
    const turno = turnos.find((t) => t.id === te.turnoId);
    if (!turno) return;
    setModalEdicaoTurno({ turno, data: dataCtx, turnoEscaladoId });
  }

  function fecharModalEdicaoTurno() {
    setModalEdicaoTurno(null);
  }

  function salvarModeloTurno(input: TurnoInput) {
    if (!modalEdicaoTurno) return;
    turnosStorage.atualizar(modalEdicaoTurno.turno.id, input);
    const alocacoes = montarAlocacoesAPartirDoInputTurno(input);
    escalaStorage.atualizarTurno(
      modalEdicaoTurno.data,
      modalEdicaoTurno.turnoEscaladoId,
      { alocacoes },
    );
    fecharModalEdicaoTurno();
    recarregar(true);
  }

  function removerTurnoDesteDia() {
    if (!modalEdicaoTurno) return;
    if (
      !window.confirm(
        `Remover o turno deste dia (${rotuloDataLonga(modalEdicaoTurno.data)})? A alocação desta data será apagada; o modelo do turno continua em Turnos.`,
      )
    ) {
      return;
    }
    escalaStorage.removerTurno(
      modalEdicaoTurno.data,
      modalEdicaoTurno.turnoEscaladoId,
    );
    recarregar(true);
    fecharModalEdicaoTurno();
  }

  const escalaDoDiaSelecionado =
    escalasFiltradas.find((e) => e.data === data) ??
    ({ data, turnos: [] } as EscalaDia);

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Operação</span>
          <h1 className="brisa-page__title">Escala</h1>
          <p className="brisa-page__subtitle">
            Visualize e organize os turnos da equipe por dia, semana ou mês.
          </p>
        </div>
      </header>

      <EscalaToolbar
        data={data}
        modo={modo}
        filtroLocal={filtroLocal}
        onModoChange={setModo}
        onFiltroLocalChange={setFiltroLocal}
        onAnterior={() => navegar(-1)}
        onProximo={() => navegar(1)}
        onHoje={irParaHoje}
      />

      {modo === 'dia' && (
        <DiaView
          data={data}
          escala={escalaDoDiaSelecionado}
          turnos={turnos}
          funcionarios={funcionarios}
          extras={extras}
          onAdicionar={() => abrirAdicionarPara(data)}
          onAbrirTurno={(id) => abrirEdicaoTurnoNaEscala(data, id)}
        />
      )}

      {modo === 'semana' && (
        <SemanaView
          data={data}
          escalas={escalasFiltradas}
          turnos={turnos}
          funcionarios={funcionarios}
          extras={extras}
          onAdicionar={abrirAdicionarPara}
          onAbrirTurno={(d, id) => abrirEdicaoTurnoNaEscala(d, id)}
          onAbrirDia={(d) => {
            setData(d);
            setModo('dia');
          }}
        />
      )}

      {modo === 'mes' && (
        <MesView
          data={data}
          escalas={escalasFiltradas}
          turnos={turnos}
          funcionarios={funcionarios}
          onAbrirDia={(d) => {
            setData(d);
            setModo('dia');
          }}
        />
      )}

      <AdicionarTurnoModal
        open={Boolean(adicionarPara)}
        data={adicionarPara ?? data}
        escalaDoDia={
          escalas.find((e) => e.data === adicionarPara) ?? {
            data: adicionarPara ?? data,
            turnos: [],
          }
        }
        turnos={turnos}
        onCancel={() => setAdicionarPara(null)}
        onConfirmar={confirmarAdicionar}
      />

      {modalEdicaoTurno && (
        <Modal
          open
          onClose={fecharModalEdicaoTurno}
          title="Editar turno"
          description={`${rotuloDataLonga(modalEdicaoTurno.data)} · O mesmo formulário da página Turnos: altera o modelo do turno (horário, vagas, sugestões).`}
          size="lg"
          footer={
            <Button
              type="button"
              variant="ghost"
              className="brisa-escala-modal__remove-dia"
              onClick={removerTurnoDesteDia}
            >
              Remover turno deste dia
            </Button>
          }
        >
          <TurnoForm
            key={modalEdicaoTurno.turno.id}
            turno={modalEdicaoTurno.turno}
            funcionarios={funcionarios}
            extras={extras}
            onCancel={fecharModalEdicaoTurno}
            onSubmit={salvarModeloTurno}
            onExtrasChange={() => {
              setExtras(extrasStorage.listar());
              disparoNotificacoes();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
