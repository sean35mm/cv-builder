const steps = [
  ['01', 'Claim the address', 'Choose the username that will carry your public record.'],
  ['02', 'Edit the evidence', 'Add the work, context, and links a reader actually needs.'],
  ['03', 'Set the edition', 'Choose a template, profile palette, and type pairing.'],
  ['04', 'Publish deliberately', 'Set access, review the page, then share it where it matters.'],
] as const;

export function HowItWorks() {
  return (
    <section className="platform-page py-20 md:py-28" aria-labelledby="process-title">
      <div className="platform-grid gap-y-12">
        <div className="col-span-12 md:col-span-5">
          <p className="platform-kicker text-muted-foreground">Process / Four moves</p>
          <h2 id="process-title" className="platform-section-title mt-5">From notes to a public folio.</h2>
        </div>
        <ol className="col-span-12 md:col-span-7">
          {steps.map(([number, title, description]) => (
            <li key={number} className="grid grid-cols-[3rem_1fr] gap-3 border-t py-6">
              <span className="font-mono text-xs text-primary">{number}</span>
              <div>
                <h3 className="text-base font-medium">{title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
