import { useCallback, useEffect, useRef, useState } from 'react';
import { notificacoesStorage } from '../services/notificacoesStorage';
import { authSession } from '../services/authSession';
import type { Notificacao } from '../types/notificacao';

const listeners = new Set<() => void>();

function notificarListeners() {
  for (const fn of listeners) fn();
}

export function disparoNotificacoes() {
  const sessao = authSession.obter();
  if (!sessao?.empresaId || sessao.isPlatformAdmin) return;

  void notificacoesStorage
    .sincronizar()
    .then(() => {
      notificarListeners();
    })
    .catch((error) => {
      console.error('[notificacoes] sincronizar', error);
    });
}

export function useNotificacoes() {
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [contagem, setContagem] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const recarregarSeq = useRef(0);

  const recarregar = useCallback(async () => {
    const seq = ++recarregarSeq.current;
    const sessao = authSession.obter();
    if (!sessao?.empresaId || sessao.isPlatformAdmin) {
      if (seq !== recarregarSeq.current) return;
      setLista([]);
      setContagem(0);
      setCarregando(false);
      return;
    }
    try {
      const [items, total] = await Promise.all([
        notificacoesStorage.listar(),
        notificacoesStorage.contagemNaoLidasAtivas(),
      ]);
      if (seq !== recarregarSeq.current) return;
      setLista(items);
      setContagem(total);
    } catch (error) {
      console.error('[notificacoes] carregar', error);
      if (seq !== recarregarSeq.current) return;
      setLista([]);
      setContagem(0);
    } finally {
      if (seq === recarregarSeq.current) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    listeners.add(recarregar);
    void recarregar();
    return () => {
      listeners.delete(recarregar);
    };
  }, [recarregar]);

  const sincronizar = useCallback(() => {
    disparoNotificacoes();
  }, []);

  const marcarLida = useCallback((id: string) => {
    recarregarSeq.current += 1;
    setLista((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'lida' as const } : n)),
    );
    setContagem((c) => Math.max(0, c - 1));
    void notificacoesStorage
      .marcarLida(id)
      .then(notificarListeners)
      .catch((error) => {
        console.error('[notificacoes] marcar lida', error);
        void recarregar();
      });
  }, [recarregar]);

  const marcarTodasLidas = useCallback(async () => {
    recarregarSeq.current += 1;
    setLista((prev) =>
      prev.map((n) =>
        n.status === 'nao_lida' ? { ...n, status: 'lida' as const } : n,
      ),
    );
    setContagem(0);
    try {
      await notificacoesStorage.marcarTodasLidas();
      notificarListeners();
    } catch (error) {
      console.error('[notificacoes] marcar todas lidas', error);
      await recarregar();
      throw error;
    }
  }, [recarregar]);

  const marcarResolvida = useCallback((id: string) => {
    void notificacoesStorage
      .marcarResolvida(id)
      .then(notificarListeners)
      .catch((error) => console.error('[notificacoes] resolver', error));
  }, []);

  const adiar = useCallback((id: string, ateData: string) => {
    void notificacoesStorage
      .adiar(id, ateData)
      .then(notificarListeners)
      .catch((error) => console.error('[notificacoes] adiar', error));
  }, []);

  const reabrir = useCallback((id: string) => {
    void notificacoesStorage
      .reabrir(id)
      .then(notificarListeners)
      .catch((error) => console.error('[notificacoes] reabrir', error));
  }, []);

  const limparResolvidas = useCallback(() => {
    void notificacoesStorage
      .limparResolvidas()
      .then(notificarListeners)
      .catch((error) =>
        console.error('[notificacoes] limpar resolvidas', error),
      );
  }, []);

  return {
    lista,
    contagem,
    carregando,
    sincronizar,
    marcarLida,
    marcarTodasLidas,
    marcarResolvida,
    adiar,
    reabrir,
    limparResolvidas,
  };
}
