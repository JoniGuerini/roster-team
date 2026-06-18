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
import { PerfilContaPage } from './pages/PerfilContaPage';
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
    if (estado.rota !== 'empresas' && estado.rota !== 'perfil') {
      navegarParaRota('empresas');
    }
  }, [sessao, estado.rota, navegarParaRota]);

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

  return (
    <div className="brisa-app">
      <Sidebar
        rotaAtiva={estado.rota}
        onNavegar={navegarParaRota}
        sessao={sessao}
        onSair={sair}
        empresa={empresa}
      />
      <main className="brisa-app__content">
        <Topbar sessao={sessao} onNavegar={navegarParaRota} />
        <div className="brisa-app__page" key={pageKey}>
          {estado.rota === 'perfil' ? (
            <PerfilContaPage sessao={sessao} empresa={empresa} />
          ) : null}
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
  );
}
