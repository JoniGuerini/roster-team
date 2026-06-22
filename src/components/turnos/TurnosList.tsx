import { useMemo } from 'react';
import { TIPOS_TURNO, type TipoTurno, type Turno } from '../../types/turno';
import type { Funcionario } from '../../types/funcionario';
import type { PessoaExtra } from '../../types/pessoaExtra';
import {
  fromISO,
  hojeISO,
  NOMES_DIAS_CURTOS,
  rotuloDataCurta,
} from '../../utils/datas';
import {
  contarCelulasSugestaoPreenchidas,
  dataReferenciaParaSugestoesDoTurno,
  montarAlocacoesIniciaisDoTurno,
  totalSlotsEmAlocacoes,
} from '../../utils/alocacoesIniciaisTurno';
import { TurnoCard } from './TurnoCard';
import { Icon } from '../ui/Icon';
import { EmptyState } from '../ui/EmptyState';
import './TurnosList.css';

interface TurnosListProps {
  turnos: Turno[];
  funcionarios: Funcionario[];
  extras: PessoaExtra[];
  onEdit?: (turno: Turno) => void;
  onDelete?: (turno: Turno) => void;
}

const TITULOS_GRUPO: Record<TipoTurno, string> = {
  regular: 'Turnos regulares',
  feriado: 'Turnos de feriado',
  especial: 'Turnos especiais',
};

const DESCRICOES_GRUPO: Record<TipoTurno, string> = {
  regular: 'Aplicados no dia a dia da cafeteria.',
  feriado: 'Usados em feriados ou datas comemorativas.',
  especial: 'Eventos pontuais, como festas e ocasiões especiais.',
};

interface StatusSugeridos {
  key: 'completo' | 'parcial' | 'vazio';
  texto: string;
}

function calcularStatusSugeridos(
  turno: Turno,
  funcionarios: Funcionario[],
  extras: PessoaExtra[],
): StatusSugeridos {
  const totalNec = turno.necessidades.reduce(
    (acc, n) => acc + n.quantidade,
    0,
  );
  if (totalNec === 0) {
    return { key: 'completo', texto: 'Sem necessidade definida' };
  }

  const modelo = contarCelulasSugestaoPreenchidas(turno);
  const dataRef = dataReferenciaParaSugestoesDoTurno(turno, hojeISO());
  const alocs = montarAlocacoesIniciaisDoTurno(
    turno,
    funcionarios,
    extras,
    dataRef,
  );
  const sim = totalSlotsEmAlocacoes(alocs);

  if (modelo < totalNec) {
    const faltam = totalNec - modelo;
    return {
      key: 'parcial',
      texto: faltam === 1 ? 'Falta 1 sugerido' : `Faltam ${faltam} sugeridos`,
    };
  }

  if (sim >= totalNec) {
    return { key: 'completo', texto: 'Sugeridos completos' };
  }

  const faltaSim = totalNec - sim;
  const diaSem = fromISO(dataRef).getDay();
  const dia = NOMES_DIAS_CURTOS[diaSem] ?? '';
  const quando = `${dia} ${rotuloDataCurta(dataRef)}`;
  return {
    key: 'parcial',
    texto:
      faltaSim === 1
        ? `Sugestões cheias — em ${quando} 1 pessoa não entra (folga ou repetida)`
        : `Sugestões cheias — em ${quando} ${faltaSim} não entram (folgas ou repetidas)`,
  };
}

export function TurnosList({
  turnos,
  funcionarios,
  extras,
  onEdit,
  onDelete,
}: TurnosListProps) {
  const agrupados = useMemo(() => {
    const grupos = new Map<TipoTurno, Turno[]>();
    TIPOS_TURNO.forEach(({ value }) => grupos.set(value, []));
    turnos.forEach((turno) => {
      const lista = grupos.get(turno.tipo) ?? [];
      lista.push(turno);
      grupos.set(turno.tipo, lista);
    });
    return grupos;
  }, [turnos]);

  if (turnos.length === 0) {
    return (
      <EmptyState>
        <div className="brisa-empty__icon">
          <Icon name="clock" size={20} />
        </div>
        <h3 className="brisa-empty__title">Nenhum turno cadastrado</h3>
        <p className="brisa-empty__hint">
          Clique em <strong>Novo turno</strong> para criar o primeiro modelo de
          turno.
        </p>
      </EmptyState>
    );
  }

  return (
    <div className="brisa-turnos-grupos">
      {TIPOS_TURNO.map(({ value }) => {
        const lista = agrupados.get(value) ?? [];
        if (lista.length === 0) return null;

        return (
          <section key={value} className="brisa-turnos-grupo">
            <header className="brisa-turnos-grupo__header">
              <div>
                <h2 className="brisa-turnos-grupo__title">
                  {TITULOS_GRUPO[value]}
                </h2>
                <p className="brisa-turnos-grupo__desc">
                  {DESCRICOES_GRUPO[value]}
                </p>
              </div>
              <span className="brisa-turnos-grupo__count">
                {lista.length} {lista.length === 1 ? 'turno' : 'turnos'}
              </span>
            </header>

            <div className="brisa-turnos-grid">
              {lista.map((turno) => {
                const status = calcularStatusSugeridos(
                  turno,
                  funcionarios,
                  extras,
                );
                return (
                  <TurnoCard
                    key={turno.id}
                    turno={turno}
                    status={status}
                    headActions={
                      onEdit || onDelete ? (
                        <>
                          {onEdit ? (
                            <button
                              type="button"
                              className="brisa-icon-btn"
                              aria-label={`Editar ${turno.nome}`}
                              title="Ver detalhes / Editar"
                              onClick={() => onEdit(turno)}
                            >
                              <Icon name="pencil" size={15} />
                            </button>
                          ) : null}
                          {onDelete ? (
                            <button
                              type="button"
                              className="brisa-icon-btn brisa-icon-btn--danger"
                              aria-label={`Excluir ${turno.nome}`}
                              title="Excluir"
                              onClick={() => onDelete(turno)}
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          ) : null}
                        </>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
