import type { EscalaDia } from '../types/escala';
import type { Funcionario } from '../types/funcionario';
import type {
  Notificacao,
  SeveridadeNotificacao,
  TipoNotificacao,
} from '../types/notificacao';
import type { Turno } from '../types/turno';
import {
  detectarConflitos,
  indisponibilidadeNoDia,
  pessoasAlocadas,
} from '../utils/disponibilidade';
import { rotuloDataLonga } from '../utils/datas';
import { labelLocal } from '../utils/funcionarioLabels';

export interface ProblemaDetectado {
  chave: string;
  tipo: TipoNotificacao;
  severidade: SeveridadeNotificacao;
  titulo: string;
  mensagem: string;
  data: string;
  funcionarioId?: string;
  turnoEscaladoId?: string;
  turnoId?: string;
}

function nomeFuncionario(id: string, funcionarios: Funcionario[]): string {
  return funcionarios.find((f) => f.id === id)?.nome ?? 'Funcionário';
}

function dataPassou(data: string, hoje: string): boolean {
  return data < hoje;
}

export function detectarProblemas(
  escalas: EscalaDia[],
  turnos: Turno[],
  funcionarios: Funcionario[],
  hoje: string,
): ProblemaDetectado[] {
  const problemas: ProblemaDetectado[] = [];

  for (const escala of escalas) {
    if (dataPassou(escala.data, hoje)) continue;

    const dataLonga = rotuloDataLonga(escala.data);

    for (const te of escala.turnos) {
      const turno = turnos.find((t) => t.id === te.turnoId);
      if (!turno) continue;

      const totalNec = turno.necessidades.reduce(
        (acc, n) => acc + n.quantidade,
        0,
      );
      const idsAlocados = pessoasAlocadas(te);

      if (totalNec > 0 && idsAlocados.length === 0) {
        problemas.push({
          chave: `vazio:${escala.data}:${te.id}`,
          tipo: 'turno-vazio',
          severidade: 'alta',
          titulo: `Turno "${turno.nome}" sem ninguém alocado`,
          mensagem: `${dataLonga} · ${turno.horaInicio}–${turno.horaFim} · ${labelLocal(turno.localTrabalho)}. Precisa de ${totalNec} ${totalNec === 1 ? 'pessoa' : 'pessoas'}.`,
          data: escala.data,
          turnoEscaladoId: te.id,
          turnoId: turno.id,
        });
      } else if (idsAlocados.length < totalNec) {
        const faltam = totalNec - idsAlocados.length;
        problemas.push({
          chave: `cobertura:${escala.data}:${te.id}`,
          tipo: 'cobertura-incompleta',
          severidade: 'media',
          titulo: `${faltam === 1 ? 'Falta 1 pessoa' : `Faltam ${faltam} pessoas`} em "${turno.nome}"`,
          mensagem: `${dataLonga} · ${turno.horaInicio}–${turno.horaFim} · ${labelLocal(turno.localTrabalho)}.`,
          data: escala.data,
          turnoEscaladoId: te.id,
          turnoId: turno.id,
        });
      }

      for (const id of idsAlocados) {
        const f = funcionarios.find((x) => x.id === id);
        if (!f) continue;
        const indisp = indisponibilidadeNoDia(f, escala.data);
        if (indisp) {
          problemas.push({
            chave: `indisp:${escala.data}:${te.id}:${id}`,
            tipo: 'indisponivel',
            severidade: 'alta',
            titulo: `${f.nome} indisponível em "${turno.nome}"`,
            mensagem: `${dataLonga} · ${indisp.rotulo}${indisp.detalhe ? ` (${indisp.detalhe})` : ''}. Substitua ou remova da escala.`,
            data: escala.data,
            funcionarioId: id,
            turnoEscaladoId: te.id,
            turnoId: turno.id,
          });
        }

        const conflitos = detectarConflitos(id, te.id, turno, escala, turnos);
        for (const c of conflitos) {
          const idsOrdenados = [te.id, c.turnoEscaladoId].sort();
          problemas.push({
            chave: `conflito:${escala.data}:${id}:${idsOrdenados.join('|')}`,
            tipo: 'conflito',
            severidade: 'media',
            titulo: `${nomeFuncionario(id, funcionarios)} em conflito de horário`,
            mensagem: `${dataLonga} · "${turno.nome}" (${turno.horaInicio}–${turno.horaFim}) sobrepõe "${c.turnoNome}" (${c.horaInicio}–${c.horaFim}).`,
            data: escala.data,
            funcionarioId: id,
            turnoEscaladoId: te.id,
            turnoId: turno.id,
          });
        }
      }
    }
  }

  const vistos = new Set<string>();
  return problemas.filter((p) => {
    if (vistos.has(p.chave)) return false;
    vistos.add(p.chave);
    return true;
  });
}

export function compararParaSync(
  problemas: ProblemaDetectado[],
  persistidas: Notificacao[],
  agora: string,
): {
  novas: ProblemaDetectado[];
  resolvidas: Notificacao[];
} {
  const chavesAtuais = new Set(problemas.map((p) => p.chave));
  const chavesPersistidas = new Set(
    persistidas
      .filter((n) => n.status !== 'resolvida')
      .map((n) => n.chave),
  );

  const novas = problemas.filter((p) => !chavesPersistidas.has(p.chave));

  const resolvidas = persistidas.filter(
    (n) => n.status !== 'resolvida' && !chavesAtuais.has(n.chave),
  );

  void agora;
  return { novas, resolvidas };
}
