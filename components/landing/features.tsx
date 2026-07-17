const evidence = [
  {
    index: '01',
    title: 'A guided publishing desk',
    detail: 'Shape experience, projects, skills, writing, and media in a live outline. Reorder the record without rebuilding the page.',
  },
  {
    index: '02',
    title: 'Five considered editions',
    detail: 'Choose Classic, Modern, Minimal, Developer, or Creative. Typography and profile color stay with the profile—not the workspace.',
  },
  {
    index: '03',
    title: 'A link with useful evidence',
    detail: 'Share the page, export a CV, collect recommendations, and understand visits without turning your work into a dashboard.',
  },
];

export function Features() {
  return (
    <section className="border-y bg-card" aria-labelledby="evidence-title">
      <div className="platform-page py-20 md:py-28">
        <div className="platform-grid gap-y-12">
          <div className="col-span-12 md:col-span-4">
            <p className="platform-kicker text-muted-foreground">Contents / Evidence</p>
            <h2 id="evidence-title" className="platform-section-title mt-5">
              Built around the record itself.
            </h2>
          </div>
          <ol className="col-span-12 md:col-span-8 md:border-t">
            {evidence.map((item) => (
              <li key={item.index} className="grid gap-4 border-b py-8 sm:grid-cols-[3rem_1fr] md:py-10">
                <span className="font-mono text-xs text-primary">{item.index}</span>
                <div className="grid gap-3 lg:grid-cols-2 lg:gap-10">
                  <h3 className="font-serif text-2xl tracking-[-0.02em]">{item.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
