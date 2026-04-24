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
import { GerenciarTurnoDiaModal } from '../components/escala/GerenciarTurnoDiaModal';
import { escalaStorage } from '../services/escalaStorage';
import { turnosStorage } from '../services/turnosStorage';
import { funcionariosStorage } from '../services/funcionariosStorage';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import type { EscalaDia, AlocacaoFuncao } from '../types/escala';
import type { Funcionario } from '../types/funcionario';
import type { Turno } from '../types/turno';
import {
  adicionarDias,
  adicionarMeses,
  diasDaSemana,
  diasDoMesGrade,
  hojeISO,
} from '../utils/datas';
import './EscalaPage.css';

interface AbrirTurnoState {
  data: string;
  turnoEscaladoId: string;
}

function alocacoesIniciais(turno: Turno, funcionarios: Funcionario[]): AlocacaoFuncao[] {
  const alocacoes: AlocacaoFuncao[] = [];
  for (const necessidade of turno.necessidades) {
    const sugeridosCompativeis = turno.funcionariosSugeridos.filter((id) => {
      const f = funcionarios.find((x) => x.id === id);
      if (!f) return false;
      return (
        f.funcaoPrincipal === necessidade.funcao ||
        (f.funcoesSecundarias ?? []).includes(necessidade.funcao)
      );
    });
    const ids = sugeridosCompativeis.slice(0, necessidade.quantidade);
    if (ids.length > 0) {
      alocacoes.push({ funcao: necessidade.funcao, funcionarioIds: ids });
    }
  }
  return alocacoes;
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

  const [adicionarPara, setAdicionarPara] = useState<string | null>(null);
  const [abrirTurno, setAbrirTurno] = useState<AbrirTurnoState | null>(null);

  function recarregar(disparar = false) {
    setEscalas(escalaStorage.listar());
    setTurnos(turnosStorage.listar());
    setFuncionarios(funcionariosStorage.listar());
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
    const alocacoes = alocacoesIniciais(turno, funcionarios);
    const novo = escalaStorage.adicionarTurno(adicionarPara, turnoId, alocacoes);
    recarregar(true);
    setAbrirTurno({ data: adicionarPara, turnoEscaladoId: novo.id });
    setAdicionarPara(null);
  }

  function salvarAlocacoes(alocacoes: AlocacaoFuncao[]) {
    if (!abrirTurno) return;
    escalaStorage.atualizarTurno(abrirTurno.data, abrirTurno.turnoEscaladoId, {
      alocacoes,
    });
    recarregar(true);
    setAbrirTurno(null);
  }

  function removerTurnoDoDia() {
    if (!abrirTurno) return;
    escalaStorage.removerTurno(abrirTurno.data, abrirTurno.turnoEscaladoId);
    recarregar(true);
    setAbrirTurno(null);
  }

  const turnoAbertoCtx = useMemo(() => {
    if (!abrirTurno) return null;
    const escalaDoDia =
      escalasFiltradas.find((e) => e.data === abrirTurno.data) ??
      escalas.find((e) => e.data === abrirTurno.data) ??
      ({ data: abrirTurno.data, turnos: [] } as EscalaDia);

    const escalaCompleta =
      escalas.find((e) => e.data === abrirTurno.data) ??
      ({ data: abrirTurno.data, turnos: [] } as EscalaDia);

    const te = escalaCompleta.turnos.find(
      (t) => t.id === abrirTurno.turnoEscaladoId,
    );
    if (!te) return null;
    const turno = turnos.find((t) => t.id === te.turnoId);
    if (!turno) return null;
    return { te, turno, escalaDoDia: escalaCompleta, escalaVisivel: escalaDoDia };
  }, [abrirTurno, escalasFiltradas, escalas, turnos]);

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
          onAdicionar={() => abrirAdicionarPara(data)}
          onAbrirTurno={(id) => setAbrirTurno({ data, turnoEscaladoId: id })}
        />
      )}

      {modo === 'semana' && (
        <SemanaView
          data={data}
          escalas={escalasFiltradas}
          turnos={turnos}
          funcionarios={funcionarios}
          onAdicionar={abrirAdicionarPara}
          onAbrirTurno={(d, id) => setAbrirTurno({ data: d, turnoEscaladoId: id })}
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

      {turnoAbertoCtx && abrirTurno && (
        <GerenciarTurnoDiaModal
          open
          data={abrirTurno.data}
          turno={turnoAbertoCtx.turno}
          turnoEscalado={turnoAbertoCtx.te}
          escalaDoDia={turnoAbertoCtx.escalaDoDia}
          todosTurnos={turnos}
          funcionarios={funcionarios}
          onCancel={() => setAbrirTurno(null)}
          onSalvar={salvarAlocacoes}
          onRemoverTurno={removerTurnoDoDia}
        />
      )}
    </div>
  );
}
