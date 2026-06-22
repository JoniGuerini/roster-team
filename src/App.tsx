import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { FuncionariosPage } from './pages/FuncionariosPage';
import { ExtrasPage } from './pages/ExtrasPage';
import { TurnosPage } from './pages/TurnosPage';
import { EscalaPage } from './pages/EscalaPage';
import { NotificacoesPage } from './pages/NotificacoesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { AtividadesPage } from './pages/AtividadesPage';
import { EmpresasPage } from './pages/EmpresasPage';
import { EmpresaDetalhePage } from './pages/EmpresaDetalhePage';
import { PerfilPessoaPage } from './pages/PerfilPessoaPage';
import { AccountDialog } from './components/conta/AccountDialog';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { LoginPage } from './pages/LoginPage';
import { useHashRoute } from './hooks/useHashRoute';
import { disparoNotificacoes } from './hooks/useNotificacoes';
import { authSession, type Sessao } from './services/authSession';
import { empresasStorage, EVENTO_EMPRESAS } from './services/empresasStorage';
import { supabase } from './lib/supabase';
import {
  podeAcessarRota,
  primeiraRotaDisponivel,
  recursoDaRota,
} from './utils/rotaPermissoes';
import type { Empresa } from './types/empresa';
import { tituloPagina } from './utils/tituloPagina';
import './App.css';

export default function App() {
  const {
    estado,
    navegarParaRota,
    navegarPerfilFuncionario,
    navegarPerfilExtra,
    navegarDetalheEmpresa,
  } = useHashRoute();

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [empresa, setEmpresa] = useState<Empresa | undefined>(undefined);
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarRecolhida((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!sessao?.empresaId || sessao.isPlatformAdmin) return;
    disparoNotificacoes();
  }, [sessao?.empresaId, sessao?.isPlatformAdmin]);

  useEffect(() => {
    let ativo = true;

    authSession.carregarSessao().then((s) => {
      if (ativo) setSessao(s);
    }).finally(() => {
      if (ativo) setCarregandoAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      authSession.carregarSessao().then((s) => {
        if (ativo) setSessao(s);
      });
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessao || sessao.isPlatformAdmin) {
      setEmpresa(undefined);
      return;
    }

    let ativo = true;
    const carregarEmpresa = async () => {
      const idEmpresa = sessao.empresaId;
      const dados = idEmpresa
        ? await empresasStorage.obter(idEmpresa)
        : undefined;
      if (ativo) setEmpresa(dados);
    };
    carregarEmpresa();

    const atualizar = () => {
      carregarEmpresa();
    };
    window.addEventListener(EVENTO_EMPRESAS, atualizar);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_EMPRESAS, atualizar);
    };
  }, [sessao]);

  useEffect(() => {
    if (!sessao?.isPlatformAdmin) return;
    if (estado.rota !== 'empresas') {
      navegarParaRota('empresas');
    }
  }, [sessao, estado.rota, navegarParaRota]);

  useEffect(() => {
    if (!sessao) return;
    const raw = window.location.hash.replace(/^#/, '').trim().toLowerCase();
    if (raw === 'perfil' || raw.startsWith('perfil/')) {
      setContaAberta(true);
      if (sessao.isPlatformAdmin) {
        navegarParaRota('empresas');
      } else {
        navegarParaRota(
          primeiraRotaDisponivel(sessao.permissoes, empresa?.recursos),
        );
      }
    }
  }, [sessao, empresa?.recursos, navegarParaRota]);

  useEffect(() => {
    if (!sessao || sessao.isPlatformAdmin) return;

    if (estado.rota === 'empresas') {
      navegarParaRota('escala');
      return;
    }

    const recurso = recursoDaRota(estado.rota);
    const recursoAtivo = recurso ? empresa?.recursos[recurso] !== false : true;

    if (
      !podeAcessarRota(estado.rota, sessao.permissoes, {
        recursoAtivo,
        isPlatformAdmin: false,
      })
    ) {
      navegarParaRota(
        primeiraRotaDisponivel(sessao.permissoes, empresa?.recursos),
      );
    }
  }, [sessao, estado.rota, empresa, navegarParaRota]);

  async function sair() {
    await authSession.sair();
    setSessao(null);
    setEmpresa(undefined);
  }

  if (carregandoAuth) {
    return (
      <div className="brisa-auth-loading">
        <p>Carregando…</p>
      </div>
    );
  }

  if (!sessao) {
    return <LoginPage onEntrar={setSessao} />;
  }

  const pageKey = `${estado.rota}-${estado.perfilFuncionarioId ?? ''}-${estado.perfilExtraId ?? ''}-${estado.empresaDetalheId ?? ''}`;
  const somentePlataforma = sessao.isPlatformAdmin;
  const tituloAtual = tituloPagina(estado);

  return (
    <div className="brisa-app">
      <div className="brisa-app__glow" aria-hidden="true">
        <div className="brisa-app__glow-orb brisa-app__glow-orb--tr" />
        <div className="brisa-app__glow-orb brisa-app__glow-orb--bl" />
      </div>
      <div className="brisa-app__shell">
        <Sidebar
          rotaAtiva={estado.rota}
          onNavegar={navegarParaRota}
          sessao={sessao}
          onSair={sair}
          empresa={empresa}
          recolhida={sidebarRecolhida}
          onAbrirConta={() => setContaAberta(true)}
        />
        <main className="brisa-app__content">
          <Topbar
            sessao={sessao}
            titulo={tituloAtual}
            sidebarRecolhida={sidebarRecolhida}
            onAlternarSidebar={() => setSidebarRecolhida((v) => !v)}
            onNavegar={navegarParaRota}
          />
          <div className="brisa-app__page" key={pageKey}>
          {!somentePlataforma && estado.rota === 'escala' && <EscalaPage />}
          {!somentePlataforma && estado.rota === 'funcionarios' && !estado.perfilFuncionarioId && (
            <FuncionariosPage
              sessao={sessao}
              onAbrirPerfil={navegarPerfilFuncionario}
            />
          )}
          {!somentePlataforma && estado.rota === 'funcionarios' && estado.perfilFuncionarioId && (
            <PerfilPessoaPage
              tipo="funcionario"
              id={estado.perfilFuncionarioId}
              onVoltar={() => navegarParaRota('funcionarios')}
            />
          )}
          {!somentePlataforma && estado.rota === 'extras' && !estado.perfilExtraId && (
            <ExtrasPage sessao={sessao} onAbrirPerfil={navegarPerfilExtra} />
          )}
          {!somentePlataforma && estado.rota === 'extras' && estado.perfilExtraId && (
            <PerfilPessoaPage
              tipo="extra"
              id={estado.perfilExtraId}
              onVoltar={() => navegarParaRota('extras')}
            />
          )}
          {!somentePlataforma && estado.rota === 'turnos' && (
            <TurnosPage sessao={sessao} />
          )}
          {!somentePlataforma && estado.rota === 'notificacoes' && <NotificacoesPage />}
          {!somentePlataforma && estado.rota === 'usuarios' && (
            <UsuariosPage sessao={sessao} />
          )}
          {!somentePlataforma && estado.rota === 'configuracoes' && (
            <ConfiguracoesPage sessao={sessao} />
          )}
          {!somentePlataforma && estado.rota === 'atividades' && <AtividadesPage />}
          {somentePlataforma && estado.rota === 'empresas' && !estado.empresaDetalheId && (
            <EmpresasPage onAbrir={navegarDetalheEmpresa} />
          )}
          {somentePlataforma && estado.rota === 'empresas' && estado.empresaDetalheId && (
            <EmpresaDetalhePage
              id={estado.empresaDetalheId}
              onVoltar={() => navegarParaRota('empresas')}
            />
          )}
        </div>
        </main>
      </div>

      <AccountDialog
        open={contaAberta}
        onOpenChange={setContaAberta}
        sessao={sessao}
        empresa={empresa}
      />
    </div>
  );
}
