import { useEffect, useState } from 'react';

export type RotaId = 'funcionarios' | 'turnos' | 'escala' | 'notificacoes';

const ROTAS_VALIDAS: RotaId[] = [
  'funcionarios',
  'turnos',
  'escala',
  'notificacoes',
];
const ROTA_PADRAO: RotaId = 'escala';

function lerHash(): RotaId {
  if (typeof window === 'undefined') return ROTA_PADRAO;
  const raw = window.location.hash.replace(/^#/, '');
  return (ROTAS_VALIDAS as string[]).includes(raw)
    ? (raw as RotaId)
    : ROTA_PADRAO;
}

export function useHashRoute(): [RotaId, (rota: RotaId) => void] {
  const [rota, setRota] = useState<RotaId>(lerHash);

  useEffect(() => {
    const handler = () => setRota(lerHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  function navegar(novaRota: RotaId) {
    if (window.location.hash !== `#${novaRota}`) {
      window.location.hash = `#${novaRota}`;
    }
    setRota(novaRota);
  }

  return [rota, navegar];
}
