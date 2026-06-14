import { useEffect, useLayoutEffect, useState } from 'react';

export type RotaId =
  | 'funcionarios'
  | 'extras'
  | 'turnos'
  | 'escala'
  | 'notificacoes'
  | 'usuarios';

const ROTAS_VALIDAS: RotaId[] = [
  'funcionarios',
  'extras',
  'turnos',
  'escala',
  'notificacoes',
  'usuarios',
];
const ROTA_PADRAO: RotaId = 'escala';

export type EstadoHashRota = {
  rota: RotaId;
  perfilFuncionarioId: string | null;
  perfilExtraId: string | null;
};

const ESTADO_PADRAO: EstadoHashRota = {
  rota: ROTA_PADRAO,
  perfilFuncionarioId: null,
  perfilExtraId: null,
};

function lerHash(): EstadoHashRota {
  if (typeof window === 'undefined') return ESTADO_PADRAO;
  let raw = window.location.hash.replace(/^#/, '').trim().toLowerCase();
  const q = raw.indexOf('?');
  if (q >= 0) raw = raw.slice(0, q);
  while (raw.endsWith('/')) raw = raw.slice(0, -1);

  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 0) return ESTADO_PADRAO;

  const first = parts[0];
  if (!(ROTAS_VALIDAS as string[]).includes(first)) return ESTADO_PADRAO;

  const rota = first as RotaId;

  if (
    parts.length >= 3 &&
    parts[1] === 'perfil' &&
    parts[2] &&
    parts[2].length > 0
  ) {
    const id = parts[2];
    if (rota === 'funcionarios') {
      return { rota, perfilFuncionarioId: id, perfilExtraId: null };
    }
    if (rota === 'extras') {
      return { rota, perfilFuncionarioId: null, perfilExtraId: id };
    }
  }

  return { rota, perfilFuncionarioId: null, perfilExtraId: null };
}

export function useHashRoute(): {
  estado: EstadoHashRota;
  navegarParaRota: (rota: RotaId) => void;
  navegarPerfilFuncionario: (id: string) => void;
  navegarPerfilExtra: (id: string) => void;
} {
  const [estado, setEstado] = useState<EstadoHashRota>(() => lerHash());

  useLayoutEffect(() => {
    setEstado(lerHash());
  }, []);

  useEffect(() => {
    const handler = () => setEstado(lerHash());
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);

  function navegarParaRota(novaRota: RotaId) {
    const novoHash = `#${novaRota}`;
    if (window.location.hash !== novoHash) {
      window.location.hash = novoHash;
    }
    setEstado({
      rota: novaRota,
      perfilFuncionarioId: null,
      perfilExtraId: null,
    });
  }

  function navegarPerfilFuncionario(id: string) {
    const novoHash = `#funcionarios/perfil/${id}`;
    if (window.location.hash !== novoHash) {
      window.location.hash = novoHash;
    }
    setEstado({
      rota: 'funcionarios',
      perfilFuncionarioId: id,
      perfilExtraId: null,
    });
  }

  function navegarPerfilExtra(id: string) {
    const novoHash = `#extras/perfil/${id}`;
    if (window.location.hash !== novoHash) {
      window.location.hash = novoHash;
    }
    setEstado({
      rota: 'extras',
      perfilFuncionarioId: null,
      perfilExtraId: id,
    });
  }

  return {
    estado,
    navegarParaRota,
    navegarPerfilFuncionario,
    navegarPerfilExtra,
  };
}
