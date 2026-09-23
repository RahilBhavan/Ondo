import { FlowsShell } from '@/components/flows/FlowsShell';

const block = 'animate-pulse rounded-[6px] bg-[var(--hairline)]';

export default function FlowsLoading() {
  return (
    <FlowsShell>
      <div aria-busy="true" aria-label="Loading weekly flows" className="space-y-16">
        <section className="space-y-4 pt-10 md:pt-16">
          <div className={`${block} h-9 w-full max-w-[720px] md:h-12`} />
          <div className={`${block} h-9 w-2/3 max-w-[520px] md:h-12`} />
          <div className={`${block} h-5 w-full max-w-[560px]`} />
          <div className={`${block} h-5 w-40`} />
        </section>
        <div className="h-9 w-[168px] animate-pulse rounded-full bg-[var(--hairline)]" />
        {[0, 1].map((i) => (
          <section key={i} className="space-y-6">
            <div className={`${block} h-7 w-20`} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className={`${block} h-4 w-16`} />
                  <div className={`${block} h-7 w-24`} />
                </div>
              ))}
            </div>
            <div className="h-[460px] rounded-[8px] border border-[color:var(--hairline)] bg-[var(--canvas)]" />
          </section>
        ))}
      </div>
    </FlowsShell>
  );
}
