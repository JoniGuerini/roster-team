import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { atividadesStorage } from '../services/atividadesStorage';
import {
  ACOES_ATIVIDADE,
  MODULOS_ATIVIDADE,
  type Atividade,
} from '../types/atividade';
import {
  horaAtividade,
  iconeAcao,
  labelAcao,
  rotuloDiaAtividade,
  substantivoModulo,
  toneAcao,
  verboAcao,
} from '../utils/atividadeLabels';
import { tempoRelativo } from '../utils/notificacaoLabels';
import './AtividadesPage.css';

const FILTRO_MODULO_OPTIONS = [
  { value: 'todos', label: 'Todos os módulos' },
  ...MODULOS_ATIVIDADE.map((m) => ({ value: m.value, label: m.label })),
];

const FILTRO_ACAO_OPTIONS = [
  { value: 'todas', label: 'Todas as ações' },
  ...ACOES_ATIVIDADE.map((a) => ({ value: a.value, label: a.label })),
];

function descricaoAtividade(a: Atividade) {
  if (a.modulo === 'sessao' || a.acao === 'entrou') {
    return <>entrou no sistema</>;
  }
  if (a.acao === 'gerou') {
    return (
      <>
        gerou uma senha para <strong>{a.alvo}</strong>
      </>
    );
  }
  return (
    <>
      {verboAcao(a.acao)} {substantivoModulo(a.modulo)}{' '}
      <strong>{a.alvo}</strong>
    </>
  );
}

export function AtividadesPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroModulo, setFiltroModulo] = useState<string>('todos');
  const [filtroAcao, setFiltroAcao] = useState<string>('todas');
  const [processando, setProcessando] = useState(false);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setAtividades(await atividadesStorage.listar());
    } catch (e) {
      setAtividades([]);
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar as atividades.',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  async function limpar() {
    setProcessando(true);
    setErro(null);
    try {
      await atividadesStorage.limpar();
      await recarregar();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Não foi possível limpar as atividades.',
      );
    } finally {
      setProcessando(false);
    }
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return atividades.filter((a) => {
      if (filtroModulo !== 'todos' && a.modulo !== filtroModulo) return false;
      if (filtroAcao !== 'todas' && a.acao !== filtroAcao) return false;
      if (!termo) return true;
      return (
        a.autorNome.toLowerCase().includes(termo) ||
        a.alvo.toLowerCase().includes(termo) ||
        (a.detalhe?.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [atividades, busca, filtroModulo, filtroAcao]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Atividade[]>();
    for (const a of filtradas) {
      const dia = rotuloDiaAtividade(a.data);
      const lista = mapa.get(dia) ?? [];
      lista.push(a);
      mapa.set(dia, lista);
    }
    return Array.from(mapa.entries());
  }, [filtradas]);

  const temAtividades = atividades.length > 0;

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Administração</span>
          <h1 className="brisa-page__title">Atividades</h1>
          <p className="brisa-page__subtitle">
            Histórico de ações da equipe — quem criou, editou ou removeu o quê e
            quando.
          </p>
        </div>
        <div className="brisa-atividades__actions">
          <Button
            variant="ghost"
            leftIcon={<Icon name="trash" size={16} />}
            onClick={() => void limpar()}
            disabled={!temAtividades || processando || carregando}
          >
            Limpar histórico
          </Button>
        </div>
      </header>

      {erro ? (
        <p className="brisa-page__erro" role="alert">
          {erro}
        </p>
      ) : null}

      <section className="brisa-page__toolbar">
        <div className="brisa-search">
          <Icon name="search" size={16} />
          <Input
            placeholder="Buscar por pessoa, alvo ou detalhe…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="brisa-page__filter">
          <Select
            options={FILTRO_MODULO_OPTIONS}
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
          />
        </div>
        <div className="brisa-page__filter">
          <Select
            options={FILTRO_ACAO_OPTIONS}
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
          />
        </div>

        <div className="brisa-page__count">
          {filtradas.length}{' '}
          {filtradas.length === 1 ? 'atividade' : 'atividades'}
        </div>
      </section>

      {carregando ? (
        <div className="brisa-empty">
          <p className="brisa-empty__hint">Carregando atividades…</p>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="brisa-empty">
          <div className="brisa-empty__icon">
            <Icon name="history" size={36} />
          </div>
          <h3 className="brisa-empty__title">
            {temAtividades
              ? 'Nenhuma atividade encontrada'
              : 'Sem atividades registradas'}
          </h3>
          <p className="brisa-empty__hint">
            {temAtividades
              ? 'Ajuste a busca ou os filtros para ver outros registros.'
              : 'As ações da equipe aparecerão aqui automaticamente ao usar o sistema.'}
          </p>
        </div>
      ) : (
        <div className="brisa-atividades__lista">
          {grupos.map(([dia, itens]) => (
            <section key={dia} className="brisa-atividades__grupo">
              <h2 className="brisa-atividades__dia">{dia}</h2>
              <ul className="brisa-atividades__timeline">
                {itens.map((a) => (
                  <li key={a.id} className="brisa-atividade">
                    <span
                      className={`brisa-atividade__icon brisa-atividade__icon--${toneAcao(
                        a.acao,
                      )}`}
                    >
                      <Icon name={iconeAcao(a.acao)} size={16} />
                    </span>
                    <div className="brisa-atividade__body">
                      <p className="brisa-atividade__texto">
                        <strong>{a.autorNome}</strong> {descricaoAtividade(a)}
                      </p>
                      {a.detalhe ? (
                        <span className="brisa-atividade__detalhe">
                          {a.detalhe}
                        </span>
                      ) : null}
                      <span className="brisa-atividade__meta">
                        <Badge tone={toneAcao(a.acao)}>{labelAcao(a.acao)}</Badge>
                        {a.autorPapel ? <span>{a.autorPapel}</span> : null}
                        <span>{horaAtividade(a.data)}</span>
                      </span>
                    </div>
                    <span
                      className="brisa-atividade__time"
                      title={new Date(a.data).toLocaleString('pt-BR')}
                    >
                      {tempoRelativo(a.data)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
