import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PerfilPessoaSkeleton } from '../components/ui/PageSkeletons';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { FuncionarioForm } from '../components/funcionarios/FuncionarioForm';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { funcionariosStorage } from '../services/funcionariosStorage';
import { extrasStorage } from '../services/extrasStorage';
import { urlAssinadaDocumento } from '../services/pessoaDocumentosStorage';
import type {
  DocumentoPdf,
  Funcionario,
  FuncionarioInput,
  PayloadSalvarPessoaForm,
} from '../types/funcionario';
import {
  MOTIVOS_AUSENCIA,
  OPCOES_DIA_FOLGA_SEMANAL,
  type PeriodoAusencia,
} from '../types/funcionario';
import type { PessoaExtra, PessoaExtraInput } from '../types/pessoaExtra';
import { disparoNotificacoes } from '../hooks/useNotificacoes';
import { formatarCpf } from '../utils/cpf';
import {
  formatarData,
  iniciaisDoNome,
  labelContrato,
  labelFuncao,
  labelLocal,
  labelStatus,
  toneStatus,
} from '../utils/funcionarioLabels';
import './PerfilPessoaPage.css';

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelDiaFolga(valor: number | null | undefined): string {
  if (valor == null) return '—';
  const op = OPCOES_DIA_FOLGA_SEMANAL.find((o) => o.value === String(valor));
  return op?.label ?? '—';
}

function labelMotivoAusencia(
  motivo: PeriodoAusencia['motivo'],
): string {
  return (
    MOTIVOS_AUSENCIA.find((m) => m.value === motivo)?.label ?? motivo
  );
}

export interface PerfilPessoaPageProps {
  tipo: 'funcionario' | 'extra';
  id: string;
  onVoltar: () => void;
}

export function PerfilPessoaPage({ tipo, id, onVoltar }: PerfilPessoaPageProps) {
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [extra, setExtra] = useState<PessoaExtra | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [abrindoDocId, setAbrindoDocId] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      if (tipo === 'funcionario') {
        const f = await funcionariosStorage.obter(id);
        setFuncionario(f ?? null);
        setExtra(null);
      } else {
        const e = await extrasStorage.obter(id);
        setExtra(e ?? null);
        setFuncionario(null);
      }
    } finally {
      setCarregando(false);
    }
  }, [tipo, id]);

  useEffect(() => {
    setFuncionario(null);
    setExtra(null);
    void recarregar();
  }, [recarregar]);

  const registro = tipo === 'funcionario' ? funcionario : extra;
  const nome = registro?.nome ?? '';
  const ausencias =
    tipo === 'funcionario'
      ? (funcionario?.ausencias ?? [])
      : (extra?.ausencias ?? []);
  const documentos =
    tipo === 'funcionario'
      ? (funcionario?.documentos ?? [])
      : (extra?.documentos ?? []);

  async function abrirDocumento(doc: DocumentoPdf) {
    if (!doc.storagePath) return;
    setAbrindoDocId(doc.id);
    try {
      const url = await urlAssinadaDocumento(doc.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('[perfil] abrir documento', error);
    } finally {
      setAbrindoDocId(null);
    }
  }

  async function salvarFuncionario(
    payload: PayloadSalvarPessoaForm<FuncionarioInput>,
  ) {
    await funcionariosStorage.salvarComDocumentos(funcionario ?? undefined, payload);
    disparoNotificacoes();
    await recarregar();
    setModalEdicao(false);
  }

  async function salvarExtra(payload: PayloadSalvarPessoaForm<PessoaExtraInput>) {
    await extrasStorage.salvarComDocumentos(extra ?? undefined, payload);
    disparoNotificacoes();
    await recarregar();
    setModalEdicao(false);
  }

  async function excluir() {
    if (tipo === 'funcionario') {
      await funcionariosStorage.excluir(id);
    } else {
      await extrasStorage.excluir(id);
    }
    disparoNotificacoes();
    setConfirmarExcluir(false);
    onVoltar();
  }

  if (carregando && !registro) {
    return (
      <div className="brisa-page brisa-perfil">
        <div className="brisa-perfil__toolbar">
          <button type="button" className="brisa-perfil__back" onClick={onVoltar}>
            <Icon name="arrow-left" size={18} />
            Voltar para {tipo === 'funcionario' ? 'funcionários' : 'extras'}
          </button>
        </div>
        <PerfilPessoaSkeleton />
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="brisa-page brisa-perfil">
        <div className="brisa-perfil__toolbar">
          <button type="button" className="brisa-perfil__back" onClick={onVoltar}>
            <Icon name="arrow-left" size={18} />
            Voltar
          </button>
        </div>
        <div className="brisa-perfil__notfound">
          <h1 className="brisa-perfil__notfound-title">
            {tipo === 'funcionario' ? 'Funcionário' : 'Extra'} não encontrado
          </h1>
          <p>O cadastro pode ter sido removido ou o link está incorreto.</p>
        </div>
      </div>
    );
  }

  const secundarias = registro.funcoesSecundarias ?? [];

  const statusVal = registro.status ?? undefined;

  return (
    <div className="brisa-page brisa-perfil">
      <div className="brisa-perfil__toolbar">
        <button type="button" className="brisa-perfil__back" onClick={onVoltar}>
          <Icon name="arrow-left" size={18} />
          Voltar para {tipo === 'funcionario' ? 'funcionários' : 'extras'}
        </button>
      </div>

      <header className="brisa-perfil__hero">
        <div
          className={`brisa-perfil__avatar ${nome.length % 2 === 0 ? '' : 'brisa-perfil__avatar--accent'}`}
          aria-hidden="true"
        >
          {iniciaisDoNome(nome)}
        </div>
        <div className="brisa-perfil__hero-text">
          <span className="brisa-perfil__eyebrow">
            {tipo === 'funcionario' ? 'Funcionário' : 'Extra'}
          </span>
          <h1 className="brisa-perfil__title">{nome}</h1>
          <div className="brisa-perfil__meta">
            Atualizado em {formatarData(registro.atualizadoEm.slice(0, 10))}
          </div>
          {statusVal ? (
            <div style={{ marginTop: 4 }}>
              <Badge tone={toneStatus(statusVal)}>{labelStatus(statusVal)}</Badge>
            </div>
          ) : null}
        </div>
        <div className="brisa-perfil__actions">
          <Button variant="secondary" onClick={() => setModalEdicao(true)}>
            Editar
          </Button>
          <Button variant="danger" onClick={() => setConfirmarExcluir(true)}>
            Excluir
          </Button>
        </div>
      </header>

      <div className="brisa-perfil__body">
        <div className="brisa-perfil__col brisa-perfil__col--main">
      <section className="brisa-perfil__card">
        <h2 className="brisa-perfil__card-title">Dados gerais</h2>
        <div className="brisa-perfil__grid">
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">Função principal</span>
            <span className="brisa-perfil__value">
              {registro.funcaoPrincipal
                ? labelFuncao(registro.funcaoPrincipal)
                : '—'}
            </span>
          </div>
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">Funções secundárias</span>
            {secundarias && secundarias.length > 0 ? (
              <div className="brisa-perfil__chips">
                {secundarias.map((f) => (
                  <span key={f} className="brisa-perfil__chip">
                    {labelFuncao(f)}
                  </span>
                ))}
              </div>
            ) : (
              <span className="brisa-perfil__value">—</span>
            )}
          </div>
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">CPF</span>
            <span className="brisa-perfil__value">
              {registro.cpf ? formatarCpf(registro.cpf) : '—'}
            </span>
          </div>
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">Local de trabalho</span>
            <span className="brisa-perfil__value">
              {registro.localTrabalho
                ? labelLocal(registro.localTrabalho)
                : '—'}
            </span>
          </div>
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">Tipo de contrato</span>
            <span className="brisa-perfil__value">
              {registro.tipoContrato
                ? labelContrato(registro.tipoContrato)
                : '—'}
            </span>
          </div>
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">Data de admissão</span>
            <span className="brisa-perfil__value">
              {formatarData(registro.dataAdmissao ?? '')}
            </span>
          </div>
          <div className="brisa-perfil__field">
            <span className="brisa-perfil__label">Dia de folga fixo</span>
            <span className="brisa-perfil__value">
              {labelDiaFolga(registro.diaFolgaSemanal)}
            </span>
          </div>
        </div>
      </section>

      <section className="brisa-perfil__card">
        <h2 className="brisa-perfil__card-title">Ausências registradas</h2>
        {ausencias.length === 0 ? (
          <p className="brisa-perfil__empty-inline">Nenhum período cadastrado.</p>
        ) : (
          <div className="brisa-perfil__table-wrap">
            <table className="brisa-perfil__table">
              <thead>
                <tr>
                  <th>Motivo</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Obs.</th>
                </tr>
              </thead>
              <tbody>
                {ausencias.map((a) => (
                  <tr key={a.id}>
                    <td>{labelMotivoAusencia(a.motivo)}</td>
                    <td>{formatarData(a.inicio)}</td>
                    <td>{formatarData(a.fim)}</td>
                    <td>{a.observacao?.trim() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

        </div>

        <div className="brisa-perfil__col brisa-perfil__col--side">
      {registro.descricao?.trim() ? (
        <section className="brisa-perfil__card">
          <h2 className="brisa-perfil__card-title">Observações</h2>
          <p className="brisa-perfil__prose">{registro.descricao.trim()}</p>
        </section>
      ) : null}

      <section className="brisa-perfil__card">
        <h2 className="brisa-perfil__card-title">Documentos</h2>
        {documentos.length === 0 ? (
          <p className="brisa-perfil__empty-inline">Nenhum documento anexado.</p>
        ) : (
          <ul className="brisa-perfil__doc-list">
            {documentos.map((d) => (
              <li key={d.id} className="brisa-perfil__doc-item">
                <div className="brisa-perfil__doc-main">
                  <span className="brisa-perfil__doc-name">{d.nome}</span>
                  <span className="brisa-perfil__doc-meta">
                    {formatarTamanhoArquivo(d.tamanho)} · enviado em{' '}
                    {formatarData(d.dataUpload.slice(0, 10))}
                  </span>
                </div>
                {d.storagePath ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={abrindoDocId === d.id}
                    onClick={() => void abrirDocumento(d)}
                    leftIcon={<Icon name="file-text" size={14} />}
                  >
                    {abrindoDocId === d.id ? 'Abrindo…' : 'Abrir'}
                  </Button>
                ) : (
                  <span className="brisa-perfil__doc-indisp">Sem arquivo</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
        </div>
      </div>

      <Modal
        open={modalEdicao}
        onClose={() => setModalEdicao(false)}
        title={tipo === 'funcionario' ? 'Editar funcionário' : 'Editar extra'}
        description="Alterações aplicadas ao salvar."
        size="lg"
      >
        {tipo === 'funcionario' && funcionario ? (
          <FuncionarioForm
            funcionario={funcionario}
            onCancel={() => setModalEdicao(false)}
            onSubmit={(payload) => salvarFuncionario(payload)}
          />
        ) : tipo === 'extra' && extra ? (
          <FuncionarioForm
            key={extra.id}
            variant="extra"
            extra={extra}
            onCancel={() => setModalEdicao(false)}
            onSubmit={(payload) => salvarExtra(payload)}
          />
        ) : null}
      </Modal>

      <ConfirmDeleteModal
        open={confirmarExcluir}
        nome={nome}
        titulo={tipo === 'funcionario' ? 'Excluir funcionário' : 'Excluir extra'}
        onCancel={() => setConfirmarExcluir(false)}
        onConfirm={() => void excluir()}
      >
        {tipo === 'extra' ? (
          <p className="brisa-confirm__text">
            Remover <strong>{nome}</strong>? Se ainda estiver em algum turno ou
            escala, o nome pode aparecer como &quot;Pessoa removida&quot; até você
            ajustar a alocação.
          </p>
        ) : undefined}
      </ConfirmDeleteModal>
    </div>
  );
}
