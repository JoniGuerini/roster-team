import { useCallback, useEffect, useState } from 'react';
import { notificacoesStorage } from '../services/notificacoesStorage';
import type { Notificacao } from '../types/notificacao';

const listeners = new Set<() => void>();

function notificarListeners() {
  for (const fn of listeners) fn();
}

export function disparoNotificacoes() {
  notificacoesStorage.sincronizar();
  notificarListeners();
}

export function useNotificacoes() {
  const [lista, setLista] = useState<Notificacao[]>(() =>
    notificacoesStorage.listar(),
  );
  const [contagem, setContagem] = useState<number>(() =>
    notificacoesStorage.contagemNaoLidasAtivas(),
  );

  const recarregar = useCallback(() => {
    setLista(notificacoesStorage.listar());
    setContagem(notificacoesStorage.contagemNaoLidasAtivas());
  }, []);

  useEffect(() => {
    listeners.add(recarregar);
    return () => {
      listeners.delete(recarregar);
    };
  }, [recarregar]);

  const sincronizar = useCallback(() => {
    notificacoesStorage.sincronizar();
    notificarListeners();
  }, []);

  const marcarLida = useCallback((id: string) => {
    notificacoesStorage.marcarLida(id);
    notificarListeners();
  }, []);

  const marcarTodasLidas = useCallback(() => {
    notificacoesStorage.marcarTodasLidas();
    notificarListeners();
  }, []);

  const marcarResolvida = useCallback((id: string) => {
    notificacoesStorage.marcarResolvida(id);
    notificarListeners();
  }, []);

  const adiar = useCallback((id: string, ateData: string) => {
    notificacoesStorage.adiar(id, ateData);
    notificarListeners();
  }, []);

  const reabrir = useCallback((id: string) => {
    notificacoesStorage.reabrir(id);
    notificarListeners();
  }, []);

  const limparResolvidas = useCallback(() => {
    notificacoesStorage.limparResolvidas();
    notificarListeners();
  }, []);

  return {
    lista,
    contagem,
    sincronizar,
    marcarLida,
    marcarTodasLidas,
    marcarResolvida,
    adiar,
    reabrir,
    limparResolvidas,
  };
}
