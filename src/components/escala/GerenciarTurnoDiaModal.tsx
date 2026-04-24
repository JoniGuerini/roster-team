import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { AlocacaoFuncao, EscalaDia, TurnoEscalado } from '../../types/escala';
import type { Funcao, Funcionario } from '../../types/funcionario';
import type { Turno } from '../../types/turno';
import {
  detectarConflitos,
  indisponibilidadeNoDia,
  type Conflito,
} from '../../utils/disponibilidade';
import { labelFuncao, labelLocal } from '../../utils/funcionarioLabels';
import { labelTipo, toneTipo } from '../../utils/turnoLabels';
import { rotuloDataLonga } from '../../utils/datas';
import './GerenciarTurnoDiaModal.css';

interface GerenciarTurnoDiaModalProps {
  open: boolean;
  data: string;
  turno: Turno;
  turnoEscalado: TurnoEscalado;
  escalaDoDia: EscalaDia;
  todosTurnos: Turno[];
  funcionarios: Funcionario[];
  onCancel: () => void;
  onSalvar: (alocacoes: AlocacaoFuncao[]) => void;
  onRemoverTurno: () => void;
}

interface PickerEstado {
  funcao: Funcao;
  substituirId: string | null;
}

interface ConfirmacaoConflito {
  funcionarioId: string;
  funcao: Funcao;
  substituirId: string | null;
  conflitos: Conflito[];
}

function necessidadeDe(turno: Turno, funcao: Funcao): number {
  return turno.necessidades.find((n) => n.funcao === funcao)?.quantidade ?? 0;
}

function alocadosDe(alocacoes: AlocacaoFuncao[], funcao: Funcao): string[] {
  return alocacoes.find((a) => a.funcao === funcao)?.funcionarioIds ?? [];
}

function trocarPessoa(
  alocacoes: AlocacaoFuncao[],
  funcao: Funcao,
  substituirId: string | null,
  novoId: string,
): AlocacaoFuncao[] {
  const existe = alocacoes.find((a) => a.funcao === funcao);
  if (!existe) {
    return [...alocacoes, { funcao, funcionarioIds: [novoId] }];
  }
  const ids = [...existe.funcionarioIds];
  if (substituirId) {
    const idx = ids.indexOf(substituirId);
    if (idx >= 0) ids[idx] = novoId;
    else ids.push(novoId);
  } else {
    if (!ids.includes(novoId)) ids.push(novoId);
  }
  return alocacoes.map((a) => (a.funcao === funcao ? { ...a, funcionarioIds: ids } : a));
}

function removerPessoa(
  alocacoes: AlocacaoFuncao[],
  funcao: Funcao,
  funcionarioId: string,
): AlocacaoFuncao[] {
  return alocacoes
    .map((a) =>
      a.funcao === funcao
        ? { ...a, funcionarioIds: a.funcionarioIds.filter((id) => id !== funcionarioId) }
        : a,
    )
    .filter((a) => a.funcionarioIds.length > 0);
}

export function GerenciarTurnoDiaModal({
  open,
  data,
  turno,
  turnoEscalado,
  escalaDoDia,
  todosTurnos,
  funcionarios,
  onCancel,
  onSalvar,
  onRemoverTurno,
}: GerenciarTurnoDiaModalProps) {
  const [alocacoes, setAlocacoes] = useState<AlocacaoFuncao[]>(
    turnoEscalado.alocacoes,
  );
  const [picker, setPicker] = useState<PickerEstado | null>(null);
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoConflito | null>(
    null,
  );
  const [confirmRemover, setConfirmRemover] = useState(false);

  useEffect(() => {
    setAlocacoes(turnoEscalado.alocacoes);
  }, [turnoEscalado]);

  const funcoesDoTurno = useMemo<Funcao[]>(() => {
    const set = new Set<Funcao>();
    turno.necessidades.forEach((n) => set.add(n.funcao));
    alocacoes.forEach((a) => set.add(a.funcao));
    return Array.from(set);
  }, [turno, alocacoes]);

  const funcionariosNoLocal = useMemo(
    () => funcionarios.filter((f) => f.localTrabalho === turno.localTrabalho),
    [funcionarios, turno.localTrabalho],
  );

  function aplicarTroca(
    funcionarioId: string,
    funcao: Funcao,
    substituirId: string | null,
  ) {
    const novo = trocarPessoa(alocacoes, funcao, substituirId, funcionarioId);
    setAlocacoes(novo);
    setPicker(null);
    setConfirmacao(null);
  }

  function tentarSelecionar(funcionarioId: string) {
    if (!picker) return;

    const conflitos = detectarConflitos(
      funcionarioId,
      turnoEscalado.id,
      turno,
      escalaDoDia,
      todosTurnos,
    );

    if (conflitos.length > 0) {
      setConfirmacao({
        funcionarioId,
        funcao: picker.funcao,
        substituirId: picker.substituirId,
        conflitos,
      });
      return;
    }

    aplicarTroca(funcionarioId, picker.funcao, picker.substituirId);
  }

  function confirmarConflito() {
    if (!confirmacao) return;
    aplicarTroca(
      confirmacao.funcionarioId,
      confirmacao.funcao,
      confirmacao.substituirId,
    );
  }

  function salvar() {
    onSalvar(alocacoes);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onCancel}
        title={turno.nome}
        description={`${rotuloDataLonga(data)} · ${turno.horaInicio} – ${turno.horaFim} · ${labelLocal(turno.localTrabalho)}`}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmRemover(true)}
              className="brisa-gerenciar__remove-btn"
            >
              Remover turno do dia
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="secondary" onClick={onCancel}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={salvar}>
              Salvar alterações
            </Button>
          </>
        }
      >
        <div className="brisa-gerenciar">
          <div className="brisa-gerenciar__header-info">
            <Badge tone={toneTipo(turno.tipo)}>{labelTipo(turno.tipo)}</Badge>
          </div>

          <div className="brisa-gerenciar__funcoes">
            {funcoesDoTurno.map((funcao) => {
              const necessidade = necessidadeDe(turno, funcao);
              const alocados = alocadosDe(alocacoes, funcao);
              const slots = Math.max(necessidade, alocados.length);

              return (
                <section key={funcao} className="brisa-funcao-grupo">
                  <header className="brisa-funcao-grupo__header">
                    <h4 className="brisa-funcao-grupo__title">
                      {labelFuncao(funcao)}
                    </h4>
                    <span className="brisa-funcao-grupo__count">
                      {alocados.length}/{necessidade}
                    </span>
                  </header>

                  <div className="brisa-funcao-grupo__slots">
                    {Array.from({ length: slots }).map((_, idx) => {
                      const funcionarioId = alocados[idx];
                      const f = funcionarioId
                        ? funcionarios.find((x) => x.id === funcionarioId)
                        : undefined;
                      const indisp = f
                        ? indisponibilidadeNoDia(f, data)
                        : null;

                      if (!funcionarioId) {
                        return (
                          <button
                            key={`empty-${idx}`}
                            type="button"
                            className="brisa-slot brisa-slot--vazio"
                            onClick={() =>
                              setPicker({ funcao, substituirId: null })
                            }
                          >
                            <span className="brisa-slot__avatar brisa-slot__avatar--vazio">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </span>
                            <span className="brisa-slot__texto">Adicionar pessoa</span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={funcionarioId}
                          className={`brisa-slot ${indisp ? 'brisa-slot--alerta' : ''}`}
                        >
                          <span className="brisa-slot__avatar">
                            {f?.nome
                              .split(' ')
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </span>
                          <div className="brisa-slot__info">
                            <span className="brisa-slot__nome">
                              {f?.nome ?? 'Funcionário removido'}
                            </span>
                            {indisp && (
                              <span className="brisa-slot__indisp">
                                {indisp.rotulo}
                                {indisp.detalhe && ` · ${indisp.detalhe}`}
                              </span>
                            )}
                            {!indisp &&
                              turno.funcionariosSugeridos.includes(
                                funcionarioId,
                              ) && (
                                <span className="brisa-slot__sug">
                                  Sugerido por padrão
                                </span>
                              )}
                          </div>
                          <div className="brisa-slot__actions">
                            <button
                              type="button"
                              className="brisa-icon-btn"
                              title="Substituir"
                              aria-label="Substituir pessoa"
                              onClick={() =>
                                setPicker({
                                  funcao,
                                  substituirId: funcionarioId,
                                })
                              }
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="brisa-icon-btn brisa-icon-btn--danger"
                              title="Remover"
                              aria-label="Remover pessoa"
                              onClick={() =>
                                setAlocacoes(
                                  removerPessoa(alocacoes, funcao, funcionarioId),
                                )
                              }
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {alocados.length < necessidade &&
                      Array.from({
                        length: 0,
                      })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </Modal>

      {picker && (
        <Modal
          open
          onClose={() => setPicker(null)}
          title={
            picker.substituirId
              ? `Substituir em ${labelFuncao(picker.funcao)}`
              : `Adicionar em ${labelFuncao(picker.funcao)}`
          }
          description={`Funcionários de ${labelLocal(turno.localTrabalho)}.`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setPicker(null)}>
              Fechar
            </Button>
          }
        >
          <ul className="brisa-picker">
            {funcionariosNoLocal.length === 0 && (
              <li className="brisa-form__empty">
                Nenhum funcionário cadastrado para {labelLocal(turno.localTrabalho)}.
              </li>
            )}
            {funcionariosNoLocal.map((f) => {
              const indisp = indisponibilidadeNoDia(f, data);
              const ehSugerido = turno.funcionariosSugeridos.includes(f.id);
              const jaAlocado = alocacoes.some((a) =>
                a.funcionarioIds.includes(f.id),
              );

              return (
                <li key={f.id}>
                  <button
                    type="button"
                    className={`brisa-picker__item ${jaAlocado ? 'brisa-picker__item--ja' : ''}`}
                    onClick={() => tentarSelecionar(f.id)}
                    disabled={jaAlocado}
                  >
                    <span className="brisa-picker__avatar">
                      {f.nome
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <div className="brisa-picker__info">
                      <span className="brisa-picker__nome">{f.nome}</span>
                      <span className="brisa-picker__sub">
                        {labelFuncao(f.funcaoPrincipal)}
                        {ehSugerido && ' · Sugerido neste turno'}
                      </span>
                    </div>
                    {jaAlocado && <Badge tone="info">Já no turno</Badge>}
                    {indisp && <Badge tone="warning">{indisp.rotulo}</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}

      {confirmacao && (
        <Modal
          open
          onClose={() => setConfirmacao(null)}
          title="Conflito de horário detectado"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmacao(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={confirmarConflito}>
                Alocar mesmo assim
              </Button>
            </>
          }
        >
          <p className="brisa-confirm__text">
            Esta pessoa já está alocada em outro turno com horário sobreposto:
          </p>
          <ul className="brisa-confirm__list">
            {confirmacao.conflitos.map((c) => (
              <li key={c.turnoEscaladoId}>
                <strong>{c.turnoNome}</strong> · {c.horaInicio} – {c.horaFim}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {confirmRemover && (
        <Modal
          open
          onClose={() => setConfirmRemover(false)}
          title="Remover turno do dia"
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmRemover(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmRemover(false);
                  onRemoverTurno();
                }}
              >
                Remover
              </Button>
            </>
          }
        >
          <p className="brisa-confirm__text">
            Tem certeza que deseja remover este turno do dia? Todas as
            alocações feitas serão perdidas.
          </p>
        </Modal>
      )}
    </>
  );
}
