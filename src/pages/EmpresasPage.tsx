import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { EmpresaLogo } from '../components/empresas/EmpresaLogo';
import { EmpresaForm } from '../components/empresas/EmpresaForm';
import { empresasStorage } from '../services/empresasStorage';
import type { Empresa, EmpresaInput } from '../types/empresa';
import { EmptyState } from '../components/ui/EmptyState';
import { EmpresasGridSkeleton } from '../components/ui/PageSkeletons';
import './EmpresasPage.css';

interface EmpresasPageProps {
  onAbrir: (id: string) => void;
}

export function EmpresasPage({ onAbrir }: EmpresasPageProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [ativaId, setAtivaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Empresa | undefined>(undefined);
  const [paraExcluir, setParaExcluir] = useState<Empresa | undefined>(undefined);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await empresasStorage.listar();
      setEmpresas(lista);
      setAtivaId(empresasStorage.obterAtivaId());
    } catch {
      setErro('Não foi possível carregar as empresas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  function abrirNova() {
    setEditando(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(empresa: Empresa) {
    setEditando(empresa);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(undefined);
  }

  async function salvar(input: EmpresaInput) {
    setErro(null);
    try {
      if (editando) {
        await empresasStorage.atualizar(editando.id, input);
      } else {
        await empresasStorage.criar(input);
      }
      await recarregar();
      fecharModal();
    } catch {
      setErro('Não foi possível salvar a empresa.');
    }
  }

  function tornarAtiva(empresa: Empresa) {
    empresasStorage.definirAtiva(empresa.id);
    setAtivaId(empresa.id);
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await empresasStorage.excluir(paraExcluir.id);
      await recarregar();
      setParaExcluir(undefined);
    } catch {
      setErro('Não foi possível excluir a empresa.');
    }
  }

  return (
    <div className="brisa-page">
      <header className="brisa-page__header">
        <div className="brisa-page__heading">
          <span className="brisa-page__eyebrow">Administração do sistema</span>
          <h1 className="brisa-page__title">Empresas</h1>
          <p className="brisa-page__subtitle">
            Gerencie as empresas da plataforma, defina o owner de cada uma e
            personalize a marca (logo, nome e cor).
          </p>
        </div>
        <Button onClick={abrirNova} leftIcon={<Icon name="plus" size={16} />}>
          Nova empresa
        </Button>
      </header>

      {erro ? (
        <div className="brisa-login__alert" role="alert">
          <Icon name="alert-circle" size={16} />
          <span>{erro}</span>
        </div>
      ) : null}

      {carregando ? (
        <EmpresasGridSkeleton />
      ) : empresas.length === 0 ? (
        <EmptyState>
          <div className="brisa-empty__icon">
            <Icon name="building" size={20} />
          </div>
          <h3 className="brisa-empty__title">Nenhuma empresa cadastrada</h3>
          <p className="brisa-empty__hint">
            Clique em <strong>Nova empresa</strong> para cadastrar a primeira.
          </p>
        </EmptyState>
      ) : (
        <div className="brisa-empresas__grid">
          {empresas.map((empresa) => {
            const ativa = empresa.id === ativaId;
            return (
              <article
                key={empresa.id}
                className="brisa-empresa-card brisa-empresa-card--link"
                role="button"
                tabIndex={0}
                onClick={() => onAbrir(empresa.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onAbrir(empresa.id);
                  }
                }}
              >
                <div className="brisa-empresa-card__top">
                  <EmpresaLogo
                    nome={empresa.nome}
                    logoUrl={empresa.logoUrl}
                    corPrimaria={empresa.corPrimaria}
                    size={56}
                  />
                  <div className="brisa-empresa-card__id">
                    <h2 className="brisa-empresa-card__nome">{empresa.nome}</h2>
                    {empresa.segmento ? (
                      <span className="brisa-empresa-card__segmento">
                        {empresa.segmento}
                      </span>
                    ) : null}
                  </div>
                  <div className="brisa-empresa-card__tags">
                    <Badge tone={empresa.status === 'ativa' ? 'success' : 'neutral'}>
                      {empresa.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>

                <div className="brisa-empresa-card__owner">
                  <span
                    className="brisa-empresa-card__owner-avatar"
                    style={{ background: empresa.corPrimaria }}
                  >
                    {empresa.ownerNome.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                  <div className="brisa-empresa-card__owner-info">
                    <span className="brisa-empresa-card__owner-label">Owner</span>
                    <span className="brisa-empresa-card__owner-nome">
                      {empresa.ownerNome}
                    </span>
                    <span className="brisa-empresa-card__owner-email">
                      {empresa.ownerEmail}
                    </span>
                  </div>
                </div>

                <div
                  className="brisa-empresa-card__acoes"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant={ativa ? 'ghost' : 'secondary'}
                    size="sm"
                    leftIcon={<Icon name="check" size={15} />}
                    onClick={() => tornarAtiva(empresa)}
                    disabled={ativa}
                  >
                    {ativa ? 'Empresa ativa' : 'Tornar ativa'}
                  </Button>
                  <div className="brisa-empresa-card__acoes-icones">
                    <button
                      type="button"
                      className="brisa-icon-btn"
                      onClick={() => abrirEdicao(empresa)}
                      aria-label={`Editar ${empresa.nome}`}
                      title="Editar"
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      type="button"
                      className="brisa-icon-btn brisa-icon-btn--danger"
                      onClick={() => setParaExcluir(empresa)}
                      disabled={ativa}
                      aria-label={`Excluir ${empresa.nome}`}
                      title={ativa ? 'Não é possível excluir a empresa ativa' : 'Excluir'}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title={editando ? 'Editar empresa' : 'Nova empresa'}
        description={
          editando
            ? 'Atualize a marca, o owner e o status desta empresa.'
            : 'Cadastre uma nova empresa, defina o owner e personalize a marca.'
        }
        size="lg"
      >
        <EmpresaForm
          key={editando?.id ?? 'nova'}
          empresa={editando}
          onCancel={fecharModal}
          onSubmit={salvar}
        />
      </Modal>

      <ConfirmDeleteModal
        open={Boolean(paraExcluir)}
        nome={paraExcluir?.nome ?? ''}
        titulo="Excluir empresa"
        onCancel={() => setParaExcluir(undefined)}
        onConfirm={confirmarExclusao}
      >
        <p className="brisa-confirm__text">
          Remover a empresa <strong>{paraExcluir?.nome}</strong>? Todos os dados
          de marca e owner serão apagados. Esta ação não pode ser desfeita.
        </p>
      </ConfirmDeleteModal>
    </div>
  );
}
