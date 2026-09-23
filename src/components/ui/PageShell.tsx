import Link from 'next/link';

interface PageShellProps {
  /** Site name at the left of the top bar */
  brand: { label: string; href: string };
  links: Array<{ label: string; href: string }>;
  children: React.ReactNode;
}

/** Page frame: full-viewport background and top bar. Tokens live on :root (globals.css). */
export function PageShell({ brand, links, children }: PageShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[var(--canvas-soft)] font-sans text-[color:var(--body)]">
      <header className="border-b border-[color:var(--hairline)] bg-[var(--canvas)]">
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
          <Link href={brand.href} className="whitespace-nowrap text-sm font-medium text-[color:var(--ink)]">
            {brand.label}
          </Link>
          <div className="flex items-center gap-4 whitespace-nowrap text-sm text-[color:var(--body)]">
            {links.map((l) =>
              l.href.startsWith('#') ? (
                <a key={l.href} href={l.href} className="hover:text-[color:var(--ink)]">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="hover:text-[color:var(--ink)]">
                  {l.label}
                </Link>
              )
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-[1200px] space-y-16 px-4 md:px-6">{children}</main>
    </div>
  );
}
