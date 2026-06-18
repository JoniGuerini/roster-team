import { useCallback, useEffect, useState } from 'react';
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

  const recarregar = useCallback(async () => {
    const sessao = authSession.obter();
    if (!sessao?.empresaId || sessao.isPlatformAdmin) {
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
      setLista(items);
      setContagem(total);
    } catch (error) {
      console.error('[notificacoes] carregar', error);
      setLista([]);
      setContagem(0);
    } finally {
      setCarregando(false);
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
    void notificacoesStorage
      .marcarLida(id)
      .then(notificarListeners)
      .catch((error) => console.error('[notificacoes] marcar lida', error));
  }, []);

  const marcarTodasLidas = useCallback(() => {
    void notificacoesStorage
      .marcarTodasLidas()
      .then(notificarListeners)
      .catch((error) =>
        console.error('[notificacoes] marcar todas lidas', error),
      );
  }, []);

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
