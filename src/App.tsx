import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { FuncionariosPage } from './pages/FuncionariosPage';
import { ExtrasPage } from './pages/ExtrasPage';
import { TurnosPage } from './pages/TurnosPage';
import { EscalaPage } from './pages/EscalaPage';
import { NotificacoesPage } from './pages/NotificacoesPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { PerfilPessoaPage } from './pages/PerfilPessoaPage';
import { useHashRoute } from './hooks/useHashRoute';
import { disparoNotificacoes } from './hooks/useNotificacoes';
import './App.css';

export default function App() {
  const {
    estado,
    navegarParaRota,
    navegarPerfilFuncionario,
    navegarPerfilExtra,
  } = useHashRoute();

  useEffect(() => {
    disparoNotificacoes();
  }, []);

  const pageKey = `${estado.rota}-${estado.perfilFuncionarioId ?? ''}-${estado.perfilExtraId ?? ''}`;

  return (
    <div className="brisa-app">
      <Sidebar rotaAtiva={estado.rota} onNavegar={navegarParaRota} />
      <main className="brisa-app__content">
        <Topbar onNavegar={navegarParaRota} />
        <div className="brisa-app__page" key={pageKey}>
          {estado.rota === 'escala' && <EscalaPage />}
          {estado.rota === 'funcionarios' && !estado.perfilFuncionarioId && (
            <FuncionariosPage onAbrirPerfil={navegarPerfilFuncionario} />
          )}
          {estado.rota === 'funcionarios' && estado.perfilFuncionarioId && (
            <PerfilPessoaPage
              tipo="funcionario"
              id={estado.perfilFuncionarioId}
              onVoltar={() => navegarParaRota('funcionarios')}
            />
          )}
          {estado.rota === 'extras' && !estado.perfilExtraId && (
            <ExtrasPage onAbrirPerfil={navegarPerfilExtra} />
          )}
          {estado.rota === 'extras' && estado.perfilExtraId && (
            <PerfilPessoaPage
              tipo="extra"
              id={estado.perfilExtraId}
              onVoltar={() => navegarParaRota('extras')}
            />
          )}
          {estado.rota === 'turnos' && <TurnosPage />}
          {estado.rota === 'notificacoes' && <NotificacoesPage />}
          {estado.rota === 'usuarios' && <UsuariosPage />}
        </div>
      </main>
    </div>
  );
}
