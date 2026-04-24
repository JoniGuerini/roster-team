import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { FuncionariosPage } from './pages/FuncionariosPage';
import { TurnosPage } from './pages/TurnosPage';
import { EscalaPage } from './pages/EscalaPage';
import { NotificacoesPage } from './pages/NotificacoesPage';
import { useHashRoute } from './hooks/useHashRoute';
import { disparoNotificacoes } from './hooks/useNotificacoes';
import './App.css';

export default function App() {
  const [rota, navegar] = useHashRoute();

  useEffect(() => {
    disparoNotificacoes();
  }, []);

  return (
    <div className="brisa-app">
      <Sidebar rotaAtiva={rota} onNavegar={navegar} />
      <main className="brisa-app__content">
        <Topbar onNavegar={navegar} />
        <div className="brisa-app__page">
          {rota === 'escala' && <EscalaPage />}
          {rota === 'funcionarios' && <FuncionariosPage />}
          {rota === 'turnos' && <TurnosPage />}
          {rota === 'notificacoes' && <NotificacoesPage />}
        </div>
      </main>
    </div>
  );
}
