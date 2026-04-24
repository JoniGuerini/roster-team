import { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useNotificacoes } from '../hooks/useNotificacoes';
import {
  ROTULO_TIPO_CURTO,
  rotuloSeveridade,
  tempoRelativo,
} from '../utils/notificacaoLabels';
import { adicionarDias, hojeISO } from '../utils/datas';
import type { Notificacao, StatusNotificacao } from '../types/notificacao';
import './NotificacoesPage.css';

type Filtro = 'nao_lidas' | 'lidas' | 'adiadas' | 'resolvidas' | 'todas';

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'nao_lidas', label: 'Não lidas' },
  { value: 'lidas', label: 'Lidas' },
  { value: 'adiadas', label: 'Adiadas' },
  { value: 'resolvidas', label: 'Resolvidas' },
  { value: 'todas', label: 'Todas' },
];

function casaFiltro(notif: Notificacao, filtro: Filtro): boolean {
  if (filtro === 'todas') return true;
  const map: Record<Exclude<Filtro, 'todas'>, StatusNotificacao> = {
    nao_lidas: 'nao_lida',
    lidas: 'lida',
    adiadas: 'adiada',
    resolvidas: 'resolvida',
  };
  return notif.status === map[filtro];
}

export function NotificacoesPage() {
  const {
    lista,
    sincronizar,
    marcarLida,
    marcarTodasLidas,
    marcarResolvida,
    adiar,
    reabrir,
    limparResolvidas,
  } = useNotificacoes();
  const [filtro, setFiltro] = useState<Filtro>('nao_lidas');

  const contagensFiltro = useMemo(() => {
    return {
      nao_lidas: lista.filter((n) => n.status === 'nao_lida').length,
      lidas: lista.filter((n) => n.status === 'lida').length,
      adiadas: lista.filter((n) => n.status === 'adiada').length,
      resolvidas: lista.filter((n) => n.status === 'resolvida').length,
      todas: lista.length,
    } as Record<Filtro, number>;
  }, [lista]);

  const itens = useMemo(
    () => lista.filter((n) => casaFiltro(n, filtro)),
    [lista, filtro],
  );

  const algumaNaoLida = contagensFiltro.nao_lidas > 0;
  const algumaResolvida = contagensFiltro.resolvidas > 0;

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Operação</span>
          <h1 className="brisa-page__title">Notificações</h1>
          <p className="brisa-page__subtitle">
            Alertas sobre indisponibilidades, conflitos e cobertura nos turnos
            escalados.
          </p>
        </div>
        <div className="brisa-notif-page__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={sincronizar}
            leftIcon={
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
            }
          >
            Recalcular
          </Button>
          {algumaNaoLida && (
            <Button variant="secondary" size="sm" onClick={marcarTodasLidas}>
              Marcar todas como lidas
            </Button>
          )}
          {algumaResolvida && (
            <Button variant="ghost" size="sm" onClick={limparResolvidas}>
              Limpar resolvidas
            </Button>
          )}
        </div>
      </header>

      <div className="brisa-notif-tabs" role="tablist" aria-label="Filtro de notificações">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filtro === f.value}
            className={`brisa-notif-tab ${filtro === f.value ? 'brisa-notif-tab--active' : ''}`}
            onClick={() => setFiltro(f.value)}
          >
            {f.label}
            <span className="brisa-notif-tab__count">
              {contagensFiltro[f.value]}
            </span>
          </button>
        ))}
      </div>

      {itens.length === 0 ? (
        <div className="brisa-empty">
          <div className="brisa-empty__icon">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="brisa-empty__title">
            {filtro === 'nao_lidas'
              ? 'Nenhum alerta no momento'
              : 'Nada por aqui'}
          </h3>
          <p className="brisa-empty__hint">
            {filtro === 'nao_lidas'
              ? 'A operação está em ordem. Quando algo precisar da sua atenção, aparece aqui.'
              : 'Tente outro filtro para ver outras notificações.'}
          </p>
        </div>
      ) : (
        <ul className="brisa-notif-list">
          {itens.map((n) => (
            <li
              key={n.id}
              className={`brisa-notif-card brisa-notif-card--${n.severidade} brisa-notif-card--${n.status}`}
            >
              <div className="brisa-notif-card__main">
                <div className="brisa-notif-card__top">
                  <span className="brisa-notif-card__sev">
                    {rotuloSeveridade(n.severidade)}
                  </span>
                  <span className="brisa-notif-card__tipo">
                    {ROTULO_TIPO_CURTO[n.tipo]}
                  </span>
                  <span className="brisa-notif-card__time">
                    Detectada {tempoRelativo(n.detectadaEm)}
                  </span>
                </div>
                <h4 className="brisa-notif-card__titulo">{n.titulo}</h4>
                <p className="brisa-notif-card__msg">{n.mensagem}</p>
                {n.snoozeAte && n.status === 'adiada' && (
                  <p className="brisa-notif-card__snooze">
                    Adiada até {n.snoozeAte}
                  </p>
                )}
                {n.resolvidaEm && (
                  <p className="brisa-notif-card__resolvida">
                    Resolvida {tempoRelativo(n.resolvidaEm)}
                  </p>
                )}
              </div>

              <div className="brisa-notif-card__actions">
                {n.status === 'nao_lida' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => marcarLida(n.id)}
                  >
                    Marcar como lida
                  </Button>
                )}
                {(n.status === 'nao_lida' || n.status === 'lida') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adiar(n.id, adicionarDias(hojeISO(), 3))}
                  >
                    Adiar 3 dias
                  </Button>
                )}
                {(n.status === 'nao_lida' ||
                  n.status === 'lida' ||
                  n.status === 'adiada') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => marcarResolvida(n.id)}
                  >
                    Resolver
                  </Button>
                )}
                {(n.status === 'adiada' || n.status === 'resolvida') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reabrir(n.id)}
                  >
                    Reabrir
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
