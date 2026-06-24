import { Skeleton } from './Skeleton';
import '../turnos/TurnosList.css';
import '../../pages/ConfiguracoesPage.css';
import '../../pages/EmpresasPage.css';
import '../../pages/AtividadesPage.css';
import '../../pages/PerfilPessoaPage.css';
import './PageSkeletons.css';

export function TurnosListSkeleton() {
  return (
    <div className="brisa-turnos-grupos" aria-busy="true" aria-label="Carregando turnos">
      <section className="brisa-turnos-grupo">
        <header className="brisa-turnos-grupo__header">
          <div>
            <Skeleton height={20} width={180} />
            <div style={{ marginTop: 8 }}>
              <Skeleton height={13} width={240} />
            </div>
          </div>
          <Skeleton height={12} width={72} />
        </header>
        <div className="brisa-turnos-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="brisa-page-skeleton__turno-card">
              <Skeleton height={18} width="62%" />
              <Skeleton height={13} width="48%" />
              <div className="brisa-page-skeleton__turno-meta">
                <Skeleton height={12} width="40%" />
                <Skeleton height={12} width="34%" />
              </div>
              <Skeleton height={13} width="55%" rounded="pill" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PerfisListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul
      className="brisa-config-perfis__lista brisa-page-skeleton__perfis"
      aria-busy="true"
      aria-label="Carregando perfis"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="brisa-config-perfil brisa-page-skeleton__perfil">
          <div className="brisa-page-skeleton__perfil-head">
            <div className="brisa-page-skeleton__perfil-id">
              <Skeleton rounded="lg" width={40} height={40} />
              <Skeleton height={18} width={160} />
            </div>
            <div className="brisa-page-skeleton__perfil-actions">
              <Skeleton rounded="pill" width={32} height={32} />
              <Skeleton rounded="pill" width={32} height={32} />
            </div>
          </div>
          <Skeleton height={13} width="88%" />
          <Skeleton height={8} width="100%" rounded="pill" />
        </li>
      ))}
    </ul>
  );
}

export function EmpresasGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div
      className="brisa-empresas__grid brisa-page-skeleton__empresas"
      aria-busy="true"
      aria-label="Carregando empresas"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <article key={index} className="brisa-empresa-card brisa-page-skeleton__empresa-card">
          <div className="brisa-page-skeleton__empresa-top">
            <Skeleton rounded="xl" width={56} height={56} />
            <div className="brisa-page-skeleton__empresa-lines">
              <Skeleton height={18} width="70%" />
              <Skeleton height={13} width="45%" />
            </div>
            <Skeleton height={24} width={64} rounded="pill" />
          </div>
          <div className="brisa-page-skeleton__empresa-owner">
            <Skeleton rounded="lg" width={40} height={40} />
            <div className="brisa-page-skeleton__empresa-lines">
              <Skeleton height={12} width={48} />
              <Skeleton height={14} width="62%" />
              <Skeleton height={12} width="78%" />
            </div>
          </div>
          <Skeleton height={36} width="100%" rounded="xl" />
        </article>
      ))}
    </div>
  );
}

export function EmpresaDetalheSkeleton() {
  return (
    <div className="brisa-page-skeleton__empresa-detalhe" aria-busy="true">
      <Skeleton height={20} width={180} />
      <div className="brisa-page-skeleton__empresa-hero">
        <Skeleton rounded="xl" width={72} height={72} />
        <div className="brisa-page-skeleton__empresa-lines">
          <Skeleton height={24} width={220} />
          <Skeleton height={14} width={140} />
          <Skeleton height={24} width={80} rounded="pill" />
        </div>
      </div>
      <Skeleton height={120} width="100%" rounded="xl" />
    </div>
  );
}

export function PerfilPessoaSkeleton() {
  return (
    <div
      className="brisa-page-skeleton__perfil-pessoa"
      aria-busy="true"
      aria-label="Carregando perfil"
    >
      <div className="brisa-page-skeleton__perfil-hero">
        <Skeleton rounded="full" width={72} height={72} />
        <div className="brisa-page-skeleton__perfil-hero-text">
          <Skeleton height={11} width={88} />
          <Skeleton height={26} width={220} />
          <Skeleton height={13} width={168} />
          <Skeleton height={24} width={84} rounded="pill" />
        </div>
        <div className="brisa-page-skeleton__perfil-actions">
          <Skeleton height={36} width={72} rounded="xl" />
          <Skeleton height={36} width={80} rounded="xl" />
        </div>
      </div>

      <div className="brisa-perfil__body">
        <div className="brisa-perfil__col brisa-perfil__col--main">
          <div className="brisa-perfil__card brisa-page-skeleton__perfil-card">
            <Skeleton height={12} width={100} />
            <div className="brisa-page-skeleton__perfil-grid">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="brisa-page-skeleton__perfil-field">
                  <Skeleton height={11} width={96} />
                  <Skeleton height={15} width="78%" />
                </div>
              ))}
            </div>
          </div>
          <div className="brisa-perfil__card brisa-page-skeleton__perfil-card">
            <Skeleton height={12} width={160} />
            <Skeleton height={120} width="100%" rounded="xl" />
          </div>
        </div>
        <div className="brisa-perfil__col brisa-perfil__col--side">
          <div className="brisa-perfil__card brisa-page-skeleton__perfil-card">
            <Skeleton height={12} width={100} />
            <div className="brisa-page-skeleton__perfil-docs">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="brisa-page-skeleton__perfil-doc">
                  <div className="brisa-page-skeleton__perfil-doc-lines">
                    <Skeleton height={13} width="72%" />
                    <Skeleton height={12} width="55%" />
                  </div>
                  <Skeleton height={32} width={72} rounded="xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AtividadesListSkeleton({ groups = 2 }: { groups?: number }) {
  return (
    <div
      className="brisa-atividades__lista brisa-page-skeleton__atividades"
      aria-busy="true"
      aria-label="Carregando atividades"
    >
      {Array.from({ length: groups }).map((_, groupIndex) => (
        <section key={groupIndex} className="brisa-atividades__grupo">
          <Skeleton height={16} width={120} className="brisa-page-skeleton__dia" />
          <ul className="brisa-atividades__timeline">
            {Array.from({ length: 3 }).map((__, itemIndex) => (
              <li key={itemIndex} className="brisa-atividade brisa-page-skeleton__atividade">
                <Skeleton rounded="pill" width={10} height={10} />
                <div className="brisa-page-skeleton__atividade-body">
                  <Skeleton height={14} width="82%" />
                  <Skeleton height={12} width="56%" />
                </div>
                <Skeleton height={12} width={52} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
