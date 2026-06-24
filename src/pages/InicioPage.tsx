import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RotaId } from '../hooks/useHashRoute';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { FuncionarioForm } from '../components/funcionarios/FuncionarioForm';
import { TurnoForm } from '../components/turnos/TurnoForm';
import { InicioPageSkeleton } from '../components/ui/PageSkeletons';
import { EmptyState } from '../components/ui/EmptyState';
import { escalaStorage } from '../services/escalaStorage';
import { turnosStorage } from '../services/turnosStorage';
import { funcionariosStorage } from '../services/funcionariosStorage';
import { extrasStorage } from '../services/extrasStorage';
import { notificacoesStorage } from '../services/notificacoesStorage';
import type { Sessao } from '../services/authSession';
import type { EscalaDia } from '../types/escala';
import type { Funcionario, FuncionarioInput, PayloadSalvarPessoaForm } from '../types/funcionario';
import type { PessoaExtra } from '../types/pessoaExtra';
import type { Turno, TurnoInput } from '../types/turno';
import type { Notificacao } from '../types/notificacao';
import type { Empresa } from '../types/empresa';
import { montarAlocacoesIniciaisDoTurno } from '../utils/alocacoesIniciaisTurno';
import { hojeISO, rotuloDataLonga } from '../utils/datas';
import { labelLocal } from '../utils/funcionarioLabels';
import {
  podeAcessarRota,
  podeEditarModulo,
  podeVerModulo,
} from '../utils/rotaPermissoes';
import {
  rotuloSeveridade,
  tempoRelativo,
  toneSeveridade,
} from '../utils/notificacaoLabels';
import {
  calcularStatusTurnoEscaladoNoDia,
  type StatusTurnoEscaladoKey,
} from '../utils/statusTurnoEscalado';
import './InicioPage.css';

interface InicioPageProps {
  sessao: Sessao;
  empresa?: Empresa;
  onNavegar: (rota: RotaId) => void;
}

interface TurnoHojeItem {
  turno: Turno;
  statusKey: StatusTurnoEscaladoKey;
  statusTexto: string;
}

interface AcaoRapida {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || nome;
}

function pessoaAtiva(status: string | null | undefined): boolean {
  return (status ?? 'ativo') === 'ativo';
}

function montarTurnosHoje(
  hoje: string,
  escala: EscalaDia,
  turnos: Turno[],
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
): TurnoHojeItem[] {
  const itens: TurnoHojeItem[] = [];

  for (const te of escala.turnos) {
    const turno = turnos.find((t) => t.id === te.turnoId);
    if (!turno || !turno.ativo) continue;
    const status = calcularStatusTurnoEscaladoNoDia(
      hoje,
      turno,
      te,
      funcionarios,
      extras,
    );
    itens.push({ turno, statusKey: status.key, statusTexto: status.texto });
  }

  return itens.sort((a, b) =>
    a.turno.horaInicio.localeCompare(b.turno.horaInicio),
  );
}

export function InicioPage({ sessao, empresa, onNavegar }: InicioPageProps) {
  const hoje = hojeISO();
  const permissoes = sessao.permissoes;
  const recursos = empresa?.recursos;

  const verEscala = podeVerModulo(permissoes, 'escala') && recursos?.escala !== false;
  const verTurnos = podeVerModulo(permissoes, 'turnos') && recursos?.turnos !== false;
  const verFuncionarios =
    podeVerModulo(permissoes, 'funcionarios') && recursos?.funcionarios !== false;
  const verExtras =
    podeVerModulo(permissoes, 'extras') && recursos?.extras !== false;
  const verNotificacoes = podeAcessarRota('notificacoes', permissoes, {
    recursoAtivo: recursos?.notificacoes !== false,
  });

  const editarFuncionarios =
    podeEditarModulo(permissoes, 'funcionarios') && recursos?.funcionarios !== false;
  const editarTurnos =
    podeEditarModulo(permissoes, 'turnos') && recursos?.turnos !== false;

  const [carregando, setCarregando] = useState(true);
  const [modalFuncionario, setModalFuncionario] = useState(false);
  const [modalTurno, setModalTurno] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [extras, setExtras] = useState<PessoaExtra[]>([]);
  const [escalaHoje, setEscalaHoje] = useState<EscalaDia>({ data: hoje, turnos: [] });
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const promessas: Promise<void>[] = [];

      let turnosLista: Turno[] = [];
      let funcionariosLista: Funcionario[] = [];
      let extrasLista: PessoaExtra[] = [];

      if (verEscala || verTurnos || editarTurnos) {
        promessas.push(
          turnosStorage.listar().then((lista) => {
            turnosLista = lista;
            setTurnos(lista);
          }),
        );
      }

      if (verEscala || verFuncionarios || editarFuncionarios) {
        promessas.push(
          funcionariosStorage.listar().then((lista) => {
            funcionariosLista = lista;
            setFuncionarios(lista);
          }),
        );
      }

      if (verEscala || verExtras || editarTurnos) {
        promessas.push(
          extrasStorage.listar().then((lista) => {
            extrasLista = lista;
            setExtras(lista);
          }),
        );
      }

      if (verNotificacoes) {
        promessas.push(
          notificacoesStorage.listar().then(setNotificacoes),
        );
      }

      await Promise.all(promessas.map((p) => p.catch(() => undefined)));

      if (verEscala && turnosLista.length > 0) {
        try {
          await escalaStorage.sincronizarTurnosRecorrentes(
            hoje,
            hoje,
            turnosLista,
            (turno, data) =>
              montarAlocacoesIniciaisDoTurno(
                turno,
                funcionariosLista,
                extrasLista,
                data,
              ),
          );
        } catch (error) {
          console.error('[inicio] sync recorrentes', error);
        }
        const dia = await escalaStorage.obterDia(hoje);
        setEscalaHoje(dia);
      } else if (verEscala) {
        const dia = await escalaStorage.obterDia(hoje).catch(() => ({
          data: hoje,
          turnos: [],
        }));
        setEscalaHoje(dia);
      }

      disparoNotificacoes();
    } finally {
      setCarregando(false);
    }
  }, [
    hoje,
    verEscala,
    verExtras,
    verFuncionarios,
    verNotificacoes,
    verTurnos,
    editarFuncionarios,
    editarTurnos,
  ]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const turnosHoje = useMemo(
    () => montarTurnosHoje(hoje, escalaHoje, turnos, funcionarios, extras),
    [hoje, escalaHoje, turnos, funcionarios, extras],
  );

  const alertasHoje = turnosHoje.filter((t) => t.statusKey !== 'completo').length;
  const notificacoesNaoLidas = notificacoes.filter((n) => n.status === 'nao_lida');
  const notificacoesDestaque = notificacoesNaoLidas.slice(0, 5);

  const funcionariosAtivos = funcionarios.filter((f) => pessoaAtiva(f.status)).length;
  const extrasAtivos = extras.filter((e) => pessoaAtiva(e.status)).length;

  const acoesRapidas = useMemo(() => {
    const opcoes: AcaoRapida[] = [];

    if (editarFuncionarios) {
      opcoes.push({
        id: 'funcionario',
        label: 'Novo funcionário',
        icon: 'plus',
        onClick: () => setModalFuncionario(true),
      });
    }

    if (editarTurnos) {
      opcoes.push({
        id: 'turno',
        label: 'Novo turno',
        icon: 'clock',
        onClick: () => setModalTurno(true),
      });
    }

    return opcoes;
  }, [editarFuncionarios, editarTurnos]);

  async function salvarFuncionario(payload: PayloadSalvarPessoaForm<FuncionarioInput>) {
    await funcionariosStorage.salvarComDocumentos(undefined, payload);
    disparoNotificacoes();
    setModalFuncionario(false);
    await recarregar();
  }

  async function salvarTurno(input: TurnoInput) {
    await turnosStorage.criar(input);
    disparoNotificacoes();
    setModalTurno(false);
    await recarregar();
  }

  const cardsResumo = useMemo(() => {
    const cards: {
      key: string;
      label: string;
      valor: string;
      detalhe: string;
      icon: string;
      destaque?: 'ok' | 'alerta';
    }[] = [];

    if (verEscala) {
      cards.push({
        key: 'turnos',
        label: 'Turnos hoje',
        valor: String(turnosHoje.length),
        detalhe:
          turnosHoje.length === 0
            ? 'Nenhum turno na escala'
            : alertasHoje === 0
              ? 'Tudo em ordem'
              : `${alertasHoje} ${alertasHoje === 1 ? 'precisa' : 'precisam'} de atenção`,
        icon: 'calendar-event',
        destaque: alertasHoje > 0 ? 'alerta' : turnosHoje.length > 0 ? 'ok' : undefined,
      });
    }

    if (verFuncionarios) {
      cards.push({
        key: 'funcionarios',
        label: 'Funcionários',
        valor: String(funcionariosAtivos),
        detalhe:
          funcionarios.length === funcionariosAtivos
            ? 'ativos no cadastro'
            : `${funcionariosAtivos} ativos de ${funcionarios.length}`,
        icon: 'users',
      });
    }

    if (verExtras) {
      cards.push({
        key: 'extras',
        label: 'Extras',
        valor: String(extrasAtivos),
        detalhe: 'cadastrados e ativos',
        icon: 'user-plus',
      });
    }

    if (verNotificacoes) {
      cards.push({
        key: 'notificacoes',
        label: 'Alertas',
        valor: String(notificacoesNaoLidas.length),
        detalhe:
          notificacoesNaoLidas.length === 0
            ? 'Nenhum pendente'
            : 'não lidos',
        icon: 'bell',
        destaque: notificacoesNaoLidas.length > 0 ? 'alerta' : undefined,
      });
    }

    return cards;
  }, [
    alertasHoje,
    extrasAtivos,
    funcionarios.length,
    funcionariosAtivos,
    notificacoesNaoLidas.length,
    turnosHoje.length,
    verEscala,
    verExtras,
    verFuncionarios,
    verNotificacoes,
  ]);

  const duasColunas = verEscala && verNotificacoes;

  if (carregando) {
    return (
      <div className="brisa-page brisa-inicio">
        <InicioPageSkeleton />
      </div>
    );
  }

  return (
    <div className="brisa-page brisa-inicio">
      <header className="brisa-inicio__hero">
        <div className="brisa-inicio__hero-text">
          <span className="brisa-page__eyebrow">Visão geral</span>
          <h1 className="brisa-inicio__title">
            {saudacao()}, {primeiroNome(sessao.nome)}
          </h1>
          <p className="brisa-inicio__subtitle">{rotuloDataLonga(hoje)}</p>
          {empresa?.nome ? (
            <p className="brisa-inicio__empresa">{empresa.nome}</p>
          ) : null}
        </div>
        {verEscala || acoesRapidas.length > 0 ? (
          <div className="brisa-inicio__hero-actions">
            {acoesRapidas.map((acao) => (
              <Button
                key={acao.id}
                variant="secondary"
                onClick={acao.onClick}
                leftIcon={<Icon name={acao.icon} size={16} />}
              >
                {acao.label}
              </Button>
            ))}
            {verEscala ? (
              <Button
                onClick={() => onNavegar('escala')}
                leftIcon={<Icon name="calendar-event" size={16} />}
              >
                Abrir escala
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      {cardsResumo.length > 0 ? (
        <div className="brisa-inicio__stats">
          {cardsResumo.map((card) => (
            <article
              key={card.key}
              className={`brisa-inicio__stat${card.destaque === 'alerta' ? ' brisa-inicio__stat--alerta' : card.destaque === 'ok' ? ' brisa-inicio__stat--ok' : ''}`}
            >
              <span className="brisa-inicio__stat-icon" aria-hidden="true">
                <Icon name={card.icon} size={18} />
              </span>
              <div className="brisa-inicio__stat-body">
                <span className="brisa-inicio__stat-label">{card.label}</span>
                <span className="brisa-inicio__stat-valor">{card.valor}</span>
                <span className="brisa-inicio__stat-detalhe">{card.detalhe}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {(verEscala || verNotificacoes) ? (
      <div
        className={`brisa-inicio__grid${!duasColunas ? ' brisa-inicio__grid--single' : ''}`}
      >
        {verEscala ? (
          <section className="brisa-inicio__card">
            <div className="brisa-inicio__card-head">
              <div>
                <h2 className="brisa-inicio__card-title">Escala de hoje</h2>
                <p className="brisa-inicio__card-desc">
                  Status dos turnos escalados para hoje.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavegar('escala')}>
                Ver escala
              </Button>
            </div>

            <div className="brisa-inicio__card-body">
            {turnosHoje.length === 0 ? (
              <EmptyState compact>
                <p className="brisa-empty__hint">
                  Nenhum turno na escala de hoje. Adicione turnos na página de escala.
                </p>
              </EmptyState>
            ) : (
              <ul className="brisa-inicio__turnos">
                {turnosHoje.map(({ turno, statusKey, statusTexto }) => (
                  <li key={turno.id} className="brisa-inicio__turno">
                    <div className="brisa-inicio__turno-main">
                      <span className="brisa-inicio__turno-nome">{turno.nome}</span>
                      <span className="brisa-inicio__turno-meta">
                        {turno.horaInicio} – {turno.horaFim} · {labelLocal(turno.localTrabalho)}
                      </span>
                    </div>
                    <span
                      className={`brisa-inicio__turno-status brisa-inicio__turno-status--${statusKey}`}
                    >
                      {statusTexto}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </section>
        ) : null}

        {verNotificacoes ? (
          <section className="brisa-inicio__card">
            <div className="brisa-inicio__card-head">
              <div>
                <h2 className="brisa-inicio__card-title">Precisa de atenção</h2>
                <p className="brisa-inicio__card-desc">
                  Alertas ainda não lidos.
                </p>
              </div>
              {notificacoesNaoLidas.length > 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavegar('notificacoes')}
                >
                  Ver todos
                </Button>
              ) : null}
            </div>

            <div className="brisa-inicio__card-body">
            {notificacoesDestaque.length === 0 ? (
              <p className="brisa-inicio__empty">Nenhum alerta pendente. Bom trabalho!</p>
            ) : (
              <ul className="brisa-inicio__notifs">
                {notificacoesDestaque.map((notif) => (
                  <li key={notif.id} className="brisa-inicio__notif">
                    <div className="brisa-inicio__notif-top">
                      <Badge tone={toneSeveridade(notif.severidade)}>
                        {rotuloSeveridade(notif.severidade)}
                      </Badge>
                      <span className="brisa-inicio__notif-tempo">
                        {tempoRelativo(notif.detectadaEm)}
                      </span>
                    </div>
                    <p className="brisa-inicio__notif-titulo">{notif.titulo}</p>
                    <p className="brisa-inicio__notif-msg">{notif.mensagem}</p>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </section>
        ) : null}
      </div>
      ) : null}

      <Modal
        open={modalFuncionario}
        onClose={() => setModalFuncionario(false)}
        title="Novo funcionário"
        description="Cadastre um membro da equipe fixa."
        size="lg"
      >
        <FuncionarioForm
          onCancel={() => setModalFuncionario(false)}
          onSubmit={(payload) => salvarFuncionario(payload)}
        />
      </Modal>

      <Modal
        open={modalTurno}
        onClose={() => setModalTurno(false)}
        title="Criar novo turno"
        description="Defina o modelo de turno: tipo, horário, equipe necessária e quem normalmente cobre."
        size="lg"
      >
        <TurnoForm
          key="novo-inicio"
          funcionarios={funcionarios}
          extras={extras}
          onCancel={() => setModalTurno(false)}
          onSubmit={(input) => void salvarTurno(input)}
          onExtrasChange={() => {
            void extrasStorage.listar().then(setExtras).catch(() => setExtras([]));
            disparoNotificacoes();
          }}
        />
      </Modal>
    </div>
  );
}
