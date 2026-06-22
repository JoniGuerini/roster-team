import { Skeleton } from './Skeleton';
import { TableSkeleton } from './TableSkeleton';
import './AppShellSkeleton.css';

export function AppShellSkeleton() {
  return (
    <div className="brisa-app" aria-busy="true" aria-label="Carregando aplicação">
      <div className="brisa-app__glow" aria-hidden="true">
        <div className="brisa-app__glow-orb brisa-app__glow-orb--tr" />
        <div className="brisa-app__glow-orb brisa-app__glow-orb--bl" />
      </div>

      <div className="brisa-app__shell">
        <aside className="brisa-app-skeleton__sidebar" aria-hidden="true">
          <div className="brisa-app-skeleton__brand">
            <Skeleton onDark rounded="full" width={42} height={42} />
            <div className="brisa-app-skeleton__brand-lines">
              <Skeleton onDark height={14} width={120} />
              <Skeleton onDark height={11} width={88} />
            </div>
          </div>

          <div className="brisa-app-skeleton__nav">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                onDark
                rounded="xl"
                height={36}
                width={index % 3 === 0 ? '88%' : '76%'}
              />
            ))}
          </div>

          <div className="brisa-app-skeleton__user">
            <Skeleton onDark rounded="lg" width={36} height={36} />
            <div className="brisa-app-skeleton__user-lines">
              <Skeleton onDark height={13} width={96} />
              <Skeleton onDark height={11} width={72} />
            </div>
          </div>
        </aside>

        <main className="brisa-app__content">
          <header className="brisa-app-skeleton__topbar" aria-hidden="true">
            <div className="brisa-app-skeleton__topbar-left">
              <Skeleton rounded="pill" width={32} height={32} />
              <Skeleton height={22} width={140} />
            </div>
            <div className="brisa-app-skeleton__topbar-right">
              <Skeleton rounded="pill" width={32} height={32} />
              <Skeleton rounded="pill" width={32} height={32} />
            </div>
          </header>

          <div className="brisa-app__page">
            <section className="brisa-page__toolbar brisa-app-skeleton__toolbar">
              <div className="brisa-app-skeleton__toolbar-head">
                <Skeleton height={24} width={120} />
                <Skeleton height={28} width={96} rounded="pill" />
                <Skeleton height={36} width={132} rounded="xl" />
              </div>
              <div className="brisa-app-skeleton__toolbar-filters">
                <Skeleton height={36} width="100%" rounded="xl" />
                <Skeleton height={36} width={180} rounded="xl" />
                <Skeleton height={36} width={160} rounded="xl" />
              </div>
            </section>

            <TableSkeleton variant="usuarios" rows={5} />
          </div>
        </main>
      </div>
    </div>
  );
}
