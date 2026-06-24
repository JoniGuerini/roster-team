import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EscalaToolbar,
  type FiltroLocal,
  type ModoVisualizacao,
} from '../components/escala/EscalaToolbar';
import { SemanaView } from '../components/escala/SemanaView';
import { MesView } from '../components/escala/MesView';
import { EquipeDiaView } from '../components/escala/EquipeDiaView';
import { EscalaDiaPainel } from '../components/escala/EscalaDiaPainel';
import { AdicionarTurnoModal } from '../components/escala/AdicionarTurnoModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { TurnoForm } from '../components/turnos/TurnoForm';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { escalaStorage } from '../services/escalaStorage';
import { turnosStorage } from '../services/turnosStorage';
import { funcionariosStorage } from '../services/funcionariosStorage';
import { extrasStorage } from '../services/extrasStorage';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import { authSession } from '../services/authSession';
import { podeEditarModulo } from '../utils/rotaPermissoes';
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
  const podeEditar = podeEditarModulo(authSession.obter()?.permissoes, 'escala');
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
  const [confirmarRemocaoTurno, setConfirmarRemocaoTurno] = useState(false);

  const recarregar = useCallback(async (disparar = false) => {
    try {
      const turnosLista = await turnosStorage.listar();
      await escalaStorage.limparOrfaos(turnosLista.map((t) => t.id));
      await escalaStorage.limparDuplicatas();
      setTurnos(turnosLista);
      setEscalas(await escalaStorage.listar());
    } catch {
      setTurnos([]);
      try {
        setEscalas(await escalaStorage.listar());
      } catch {
        setEscalas([]);
      }
    }
    void funcionariosStorage.listar().then(setFuncionarios).catch(() => setFuncionarios([]));
    void extrasStorage.listar().then(setExtras).catch(() => setExtras([]));
    if (disparar) disparoNotificacoes();
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

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
    void (async () => {
      try {
        const n = await escalaStorage.sincronizarTurnosRecorrentes(
          ini,
          fim,
          turnos,
          (t, d) => montarAlocacoesIniciaisDoTurno(t, funcionarios, extras, d),
        );
        if (n > 0) {
          setEscalas(await escalaStorage.listar());
          disparoNotificacoes();
        }
      } catch (error) {
        console.error('[escala] sync recorrentes', error);
      }
    })();
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

  const escalaDiaSelecionado = useMemo(() => {
    const filtradas = filtrarEscalasPorLocal(escalas, turnos, filtroLocal);
    return (
      filtradas.find((e) => e.data === data) ??
      ({ data, turnos: [] } as EscalaDia)
    );
  }, [escalas, turnos, filtroLocal, data]);

  function navegar(direcao: -1 | 1) {
    if (modo === 'dia') setData(adicionarDias(data, direcao));
    else if (modo === 'semana') setData(adicionarDias(data, direcao * 7));
    else setData(adicionarMeses(data, direcao));
  }

  function irParaHoje() {
    setData(hojeISO());
  }

  function selecionarDia(dataAlvo: string) {
    setData(dataAlvo);
  }

  function abrirAdicionarPara(dataAlvo: string) {
    setAdicionarPara(dataAlvo);
  }

  async function confirmarAdicionar(turnoId: string) {
    if (!adicionarPara) return;
    const turno = turnos.find((t) => t.id === turnoId);
    if (!turno) return;
    const alocacoes = montarAlocacoesIniciaisDoTurno(
      turno,
      funcionarios,
      extras,
      adicionarPara,
    );
    try {
      await escalaStorage.adicionarTurno(adicionarPara, turnoId, alocacoes);
      await recarregar(true);
      setAdicionarPara(null);
    } catch (error) {
      console.error('[escala] adicionar turno', error);
    }
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
    setConfirmarRemocaoTurno(false);
  }

  function solicitarRemocaoTurno() {
    setConfirmarRemocaoTurno(true);
  }

  async function executarRemocaoTurno() {
    if (!modalEdicaoTurno) return;
    try {
      await escalaStorage.removerTurno(
        modalEdicaoTurno.data,
        modalEdicaoTurno.turnoEscaladoId,
      );
      await recarregar(true);
      fecharModalEdicaoTurno();
    } catch (error) {
      console.error('[escala] remover turno', error);
    }
  }

  async function salvarModeloTurno(input: TurnoInput) {
    if (!modalEdicaoTurno) return;
    const turnoAtualizado = await turnosStorage.atualizar(
      modalEdicaoTurno.turno.id,
      input,
    );
    const alocacoes = montarAlocacoesAPartirDoInputTurno(input);
    await escalaStorage.atualizarTurno(
      modalEdicaoTurno.data,
      modalEdicaoTurno.turnoEscaladoId,
      { alocacoes },
    );
    if (turnoAtualizado) {
      await escalaStorage.refreshAlocacoesVaziasDoTurno(
        turnoAtualizado,
        funcionarios,
        extras,
      );
    }
    fecharModalEdicaoTurno();
    await recarregar(true);
  }

  return (
    <div className="brisa-page brisa-page--escala">
      <div className="brisa-escala-card brisa-escala-card--toolbar">
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
      </div>

      <div className="brisa-escala-layout brisa-escala-layout--corpo">
        <div className="brisa-escala-card brisa-escala-card--calendario">
          {modo === 'mes' && (
            <MesView
              data={data}
              dataSelecionada={data}
              escalas={escalasFiltradas}
              turnos={turnos}
              funcionarios={funcionarios}
              extras={extras}
              onSelecionarDia={selecionarDia}
            />
          )}

          {modo === 'semana' && (
            <SemanaView
              data={data}
              escalas={escalasFiltradas}
              turnos={turnos}
              funcionarios={funcionarios}
              extras={extras}
              onAdicionar={podeEditar ? abrirAdicionarPara : undefined}
              onAbrirTurno={
                podeEditar
                  ? (d, id) => abrirEdicaoTurnoNaEscala(d, id)
                  : undefined
              }
              onAbrirDia={selecionarDia}
            />
          )}

          {modo === 'dia' && (
            <EquipeDiaView
              data={data}
              escala={escalaDiaSelecionado}
              turnos={turnos}
              funcionarios={funcionarios}
              extras={extras}
              onAdicionar={
                podeEditar ? () => abrirAdicionarPara(data) : undefined
              }
              onAbrirTurno={
                podeEditar
                  ? (id) => abrirEdicaoTurnoNaEscala(data, id)
                  : undefined
              }
            />
          )}
        </div>

        <EscalaDiaPainel
          data={data}
          escala={escalaDiaSelecionado}
          turnos={turnos}
          funcionarios={funcionarios}
          extras={extras}
          onAdicionar={
            podeEditar ? () => abrirAdicionarPara(data) : undefined
          }
          onAbrirTurno={
            podeEditar
              ? (id) => abrirEdicaoTurnoNaEscala(data, id)
              : undefined
          }
        />
      </div>

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
              onClick={solicitarRemocaoTurno}
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
            onSubmit={(input) => void salvarModeloTurno(input)}
            onExtrasChange={() => {
              void extrasStorage.listar().then(setExtras).catch(() => setExtras([]));
              disparoNotificacoes();
            }}
          />
        </Modal>
      )}

      <ConfirmDeleteModal
        open={confirmarRemocaoTurno}
        nome={modalEdicaoTurno?.turno.nome ?? ''}
        titulo="Remover turno deste dia"
        confirmLabel="Remover"
        onCancel={() => setConfirmarRemocaoTurno(false)}
        onConfirm={executarRemocaoTurno}
      >
        <p className="brisa-confirm__text">
          Remover o turno{' '}
          <strong>{modalEdicaoTurno?.turno.nome}</strong> deste dia (
          {modalEdicaoTurno
            ? rotuloDataLonga(modalEdicaoTurno.data)
            : ''}
          )? A alocação desta data será apagada; o modelo do turno continua em
          Turnos.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}

