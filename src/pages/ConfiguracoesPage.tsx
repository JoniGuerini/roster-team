import { useEffect, useState } from 'react';

import { Button } from '../components/ui/Button';

import { Icon } from '../components/ui/Icon';

import { Modal } from '../components/ui/Modal';

import { PerfilAcessoForm } from '../components/perfis/PerfilAcessoForm';

import { ConfirmDeleteModal } from '../components/funcionarios/ConfirmDeleteModal';
import { PageToolbarHead } from '../components/layout/PageToolbarHead';
import { perfisAcessoStorage } from '../services/perfisAcessoStorage';

import type { Sessao } from '../services/authSession';

import type { PerfilAcesso, PerfilAcessoInput } from '../types/perfilAcesso';

import { TODAS_PERMISSOES } from '../types/usuario';

import { EmptyState } from '../components/ui/EmptyState';
import { PerfisListSkeleton } from '../components/ui/PageSkeletons';

import './ConfiguracoesPage.css';



interface ConfiguracoesPageProps {

  sessao: Sessao;

}



const TOTAL_PERMISSOES = TODAS_PERMISSOES.length;



function pctPermissoes(count: number): number {

  return Math.round((count / TOTAL_PERMISSOES) * 100);

}



function tonePermissoes(

  count: number,

): 'success' | 'info' | 'warning' | 'neutral' {

  const ratio = count / TOTAL_PERMISSOES;

  if (ratio >= 1) return 'success';

  if (ratio >= 0.6) return 'info';

  if (ratio >= 0.25) return 'warning';

  return 'neutral';

}



export function ConfiguracoesPage({ sessao }: ConfiguracoesPageProps) {

  const empresaId = sessao.empresaId;

  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);

  const [editando, setEditando] = useState<PerfilAcesso | undefined>(undefined);

  const [paraExcluir, setParaExcluir] = useState<PerfilAcesso | undefined>(

    undefined,

  );

  const [salvando, setSalvando] = useState(false);



  async function carregar() {

    if (!empresaId) return;

    setCarregando(true);

    try {

      await perfisAcessoStorage.garantirSeed(empresaId);

      const lista = await perfisAcessoStorage.listarPorEmpresa(empresaId);

      setPerfis(lista);

      setErro(null);

    } catch (e) {

      setErro(

        e instanceof Error ? e.message : 'Não foi possível carregar os perfis.',

      );

    } finally {

      setCarregando(false);

    }

  }



  useEffect(() => {

    carregar();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [empresaId]);



  function abrirNovo() {

    setEditando(undefined);

    setModalAberto(true);

  }



  function abrirEdicao(perfil: PerfilAcesso) {

    setEditando(perfil);

    setModalAberto(true);

  }



  function fecharModal() {

    setModalAberto(false);

    setEditando(undefined);

  }



  async function salvar(input: PerfilAcessoInput) {

    if (!empresaId) return;

    setSalvando(true);

    setErro(null);

    try {

      if (editando) {

        await perfisAcessoStorage.atualizar(empresaId, editando.id, input);

      } else {

        await perfisAcessoStorage.criar(empresaId, input);

      }

      await carregar();

      fecharModal();

    } catch (e) {

      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');

    } finally {

      setSalvando(false);

    }

  }



  async function confirmarExclusao() {

    if (!empresaId || !paraExcluir) return;

    setErro(null);

    try {

      await perfisAcessoStorage.excluir(empresaId, paraExcluir.id);

      await carregar();

      setParaExcluir(undefined);

    } catch (e) {

      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.');

      setParaExcluir(undefined);

    }

  }



  if (!empresaId) {

    return (

      <div className="brisa-page">

        <p className="brisa-page__subtitle">Empresa não configurada.</p>

      </div>

    );

  }



  return (

    <div className="brisa-page brisa-configuracoes">

      <header className="brisa-page__header">

        <div className="brisa-page__heading">

          <span className="brisa-page__eyebrow">Administração</span>

          <h1 className="brisa-page__title">Configurações</h1>

          <p className="brisa-page__subtitle">

            Crie perfis de acesso e defina o que cada um pode ver e fazer no

            sistema. Ao cadastrar um usuário, basta escolher um perfil.

          </p>

        </div>

      </header>



      {erro ? (

        <p className="brisa-configuracoes__erro" role="alert">

          {erro}

        </p>

      ) : null}



      <section className="brisa-page__toolbar">

        <PageToolbarHead
          titulo="Configurações"
          quantidade={perfis.length}
          rotuloSingular="perfil"
          rotuloPlural="perfis"
        >
          <Button onClick={abrirNovo} leftIcon={<Icon name="plus" size={16} />}>
            Novo perfil
          </Button>
        </PageToolbarHead>

      </section>



      {carregando ? (
        <PerfisListSkeleton />
      ) : perfis.length === 0 ? (

        <EmptyState>

          <div className="brisa-empty__icon">

            <Icon name="shield-lock" size={20} />

          </div>

          <h3 className="brisa-empty__title">Nenhum perfil cadastrado</h3>

          <p className="brisa-empty__hint">

            Crie perfis como Visualizador, Editor ou Gerente para agilizar o

            cadastro de usuários.

          </p>

        </EmptyState>

      ) : (

        <ul className="brisa-config-perfis__lista">

            {perfis.map((perfil) => {

              const tone = tonePermissoes(perfil.permissoes.length);

              const pct = pctPermissoes(perfil.permissoes.length);



              return (
                <li className="brisa-config-perfil" key={perfil.id}>
                  <div className="brisa-config-perfil__header">
                    <div className="brisa-config-perfil__identity">
                      <span
                        className={`brisa-config-perfil__icon brisa-config-perfil__icon--${tone}`}
                      >
                        <Icon name="shield-lock" size={16} />
                      </span>
                      <div className="brisa-config-perfil__titulo">
                        <h3 className="brisa-config-perfil__nome">{perfil.nome}</h3>
                      </div>
                    </div>
                    <div className="brisa-config-perfil__acoes">
                      <button
                        type="button"
                        className="brisa-icon-btn"
                        onClick={() => abrirEdicao(perfil)}
                        aria-label={`Editar perfil ${perfil.nome}`}
                        title="Editar"
                      >
                        <Icon name="pencil" size={16} />
                      </button>
                      {!perfil.ehSistema ? (
                        <button
                          type="button"
                          className="brisa-icon-btn brisa-icon-btn--danger"
                          onClick={() => setParaExcluir(perfil)}
                          aria-label={`Excluir perfil ${perfil.nome}`}
                          title="Excluir"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {perfil.descricao ? (
                    <p className="brisa-config-perfil__desc">{perfil.descricao}</p>
                  ) : null}

                  <div className="brisa-config-perfil__perms">
                    <div
                      className="brisa-config-perfil__bar"
                      role="progressbar"
                      aria-valuenow={perfil.permissoes.length}
                      aria-valuemin={0}
                      aria-valuemax={TOTAL_PERMISSOES}
                      aria-label={`${perfil.permissoes.length} de ${TOTAL_PERMISSOES} permissões ativas`}
                    >
                      <span
                        className={`brisa-config-perfil__bar-fill brisa-config-perfil__bar-fill--${tone}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="brisa-config-perfil__perms-label">
                      {perfil.permissoes.length} de {TOTAL_PERMISSOES} permissões
                    </span>
                  </div>
                </li>
              );

            })}

          </ul>

      )}



      <Modal

        open={modalAberto}

        onClose={fecharModal}

        title={editando ? 'Editar perfil de acesso' : 'Novo perfil de acesso'}

        description="Defina o nome e as permissões deste perfil. Usuários herdam este conjunto ao serem cadastrados."

        size="xl"

      >

        <PerfilAcessoForm

          key={editando?.id ?? 'novo'}

          perfil={editando}

          onCancel={fecharModal}

          onSubmit={salvar}

        />

        {salvando ? (

          <p className="brisa-configuracoes__salvando" aria-live="polite">

            Salvando…

          </p>

        ) : null}

      </Modal>



      <ConfirmDeleteModal

        open={Boolean(paraExcluir)}

        nome={paraExcluir?.nome ?? ''}

        titulo="Excluir perfil"

        onCancel={() => setParaExcluir(undefined)}

        onConfirm={confirmarExclusao}

      >

        <p className="brisa-confirm__text">

          Excluir o perfil <strong>{paraExcluir?.nome}</strong>? Só é possível se

          nenhum usuário estiver usando este perfil.

        </p>

      </ConfirmDeleteModal>

    </div>

  );

}


