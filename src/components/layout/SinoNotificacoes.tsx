import { useEffect, useRef, useState } from 'react';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { tempoRelativo } from '../../utils/notificacaoLabels';
import type { SeveridadeNotificacao } from '../../types/notificacao';
import { Icon } from '../ui/Icon';
import './SinoNotificacoes.css';

interface SinoNotificacoesProps {
  onAbrirCentro: () => void;
}

function IconeSeveridade({ severidade }: { severidade: SeveridadeNotificacao }) {
  if (severidade === 'alta') {
    return <Icon name="alert-circle" size={16} label="Crítico" />;
  }
  if (severidade === 'media') {
    return <Icon name="alert-triangle" size={16} label="Atenção" />;
  }
  return <Icon name="info-circle" size={16} label="Aviso" />;
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
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [aberto]);

  const ativas = lista
    .filter((n) => n.status === 'nao_lida')
    .slice(0, 6);

  function abrirCentro() {
    setAberto(false);
    onAbrirCentro();
  }

  return (
    <div
      className={`brisa-sino-wrapper${aberto ? ' brisa-sino-wrapper--aberto' : ''}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className={`brisa-sino ${aberto ? 'brisa-sino--aberto' : ''}`}
        aria-label={`Notificações${contagem > 0 ? ` (${contagem} não lidas)` : ''}`}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        onClick={() => setAberto((v) => !v)}
      >
        <Icon name="bell" size={18} />
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
                onClick={(e) => {
                  e.stopPropagation();
                  void marcarTodasLidas();
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </header>

          {ativas.length === 0 ? (
            <div className="brisa-sino__empty">
              <Icon name="check" size={28} />
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
