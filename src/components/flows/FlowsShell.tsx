import { PageShell } from '@/components/ui/PageShell';

const LINKS = [
  { label: 'All pillars', href: '/' },
  { label: 'Methodology', href: '#methodology' },
];

/** Page frame for /flows. Shared by page and loading. */
export function FlowsShell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell brand={{ label: 'Ondo instant flows', href: '/flows' }} links={LINKS}>
      {children}
    </PageShell>
  );
}
