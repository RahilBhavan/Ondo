import Link from 'next/link';

/** Page frame for /flows: token scope, full-viewport background, top bar. Shared by page and loading. */
export function FlowsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flows min-h-[100dvh] bg-[var(--canvas-soft)] font-sans text-[color:var(--body)]">
      <header className="border-b border-[color:var(--hairline)] bg-[var(--canvas)]">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
          <Link href="/flows" className="whitespace-nowrap text-sm font-medium text-[color:var(--ink)]">
            Ondo instant flows
          </Link>
          <div className="flex items-center gap-4 whitespace-nowrap text-sm text-[color:var(--body)]">
            <Link href="/" className="hover:text-[color:var(--ink)]">
              All pillars
            </Link>
            <a href="#methodology" className="hover:text-[color:var(--ink)]">
              Methodology
            </a>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-[1200px] space-y-16 px-4 md:px-6">{children}</main>
    </div>
  );
}
