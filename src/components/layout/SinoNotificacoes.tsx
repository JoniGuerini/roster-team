import { useEffect, useRef, useState } from 'react';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { tempoRelativo } from '../../utils/notificacaoLabels';
import type { SeveridadeNotificacao } from '../../types/notificacao';
import './SinoNotificacoes.css';

interface SinoNotificacoesProps {
  onAbrirCentro: () => void;
}

function IconeSeveridade({ severidade }: { severidade: SeveridadeNotificacao }) {
  if (severidade === 'alta') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Crítico"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (severidade === 'media') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Atenção"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Aviso"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function SinoNotificacoes({ onAbrirCentro }: SinoNotificacoesProps) {
  const { lista, contagem, marcarLida, marcarTodasLidas } = useNotificacoes();
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto]);

  const ativas = lista
    .filter((n) => n.status === 'nao_lida' || n.status === 'lida')
    .slice(0, 6);

  function abrirCentro() {
    setAberto(false);
    onAbrirCentro();
  }

  return (
    <div className="brisa-sino-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`brisa-sino ${aberto ? 'brisa-sino--aberto' : ''}`}
        aria-label={`Notificações${contagem > 0 ? ` (${contagem} não lidas)` : ''}`}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        onClick={() => setAberto((v) => !v)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {contagem > 0 && (
          <span
            className={`brisa-sino__badge ${contagem > 9 ? 'brisa-sino__badge--largo' : ''}`}
          >
            {contagem > 9 ? '9+' : contagem}
          </span>
        )}
      </button>

      {aberto && (
        <div className="brisa-sino__popover" role="dialog" aria-label="Notificações">
          <header className="brisa-sino__header">
            <div>
              <h3 className="brisa-sino__title">Notificações</h3>
              <p className="brisa-sino__count">
                {contagem === 0
                  ? 'Tudo em ordem por aqui'
                  : `${contagem} ${contagem === 1 ? 'não lida' : 'não lidas'}`}
              </p>
            </div>
            {contagem > 0 && (
              <button
                type="button"
                className="brisa-sino__action"
                onClick={marcarTodasLidas}
              >
                Marcar todas como lidas
              </button>
            )}
          </header>

          {ativas.length === 0 ? (
            <div className="brisa-sino__empty">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Sem novidades por aqui.
            </div>
          ) : (
            <ul className="brisa-sino__list">
              {ativas.map((n) => (
                <li
                  key={n.id}
                  className={`brisa-sino__item brisa-sino__item--${n.severidade}`}
                >
                  <div className="brisa-sino__item-main">
                    <div className="brisa-sino__item-head">
                      <span className="brisa-sino__sev" aria-hidden="true">
                        <IconeSeveridade severidade={n.severidade} />
                      </span>
                      <span className="brisa-sino__time">
                        {tempoRelativo(n.detectadaEm)}
                      </span>
                    </div>
                    <span className="brisa-sino__item-title">{n.titulo}</span>
                    <span className="brisa-sino__item-msg">{n.mensagem}</span>
                  </div>
                  {n.status === 'nao_lida' && (
                    <div className="brisa-sino__item-actions">
                      <button
                        type="button"
                        className="brisa-sino__pill"
                        onClick={() => marcarLida(n.id)}
                      >
                        Marcar como lida
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <footer className="brisa-sino__footer">
            <button
              type="button"
              className="brisa-sino__action"
              onClick={abrirCentro}
            >
              Ver todas as notificações
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
