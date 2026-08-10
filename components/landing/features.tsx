import { Reveal } from '@/components/motion/reveal';
import { TEMPLATES } from '@/lib/templates';

const capabilities: {
  id: string;
  title: string;
  body: string;
  className: string;
  bodyClassName: string;
}[] = [
  {
    id: 'structure',
    title: 'Structure the whole story',
    body: 'Build with dedicated sections for experience, projects, skills, education, awards, and publications.',
    className: 'bg-primary text-primary-foreground lg:col-span-7 lg:row-span-2',
    bodyClassName: 'text-primary-foreground/70',
  },
  {
    id: 'presentation',
    title: 'Choose the presentation',
    body: `${TEMPLATES.map((template) => template.name).join(', ')}: five real templates paired with 12 palettes.`,
    className: 'bg-accent text-accent-foreground lg:col-span-5',
    bodyClassName: 'text-accent-foreground/75',
  },
  {
    id: 'access',
    title: 'Control access precisely',
    body: 'Set a profile to Private, Passcode, Unlisted, or Public whenever its audience changes.',
    className:
      'border border-border bg-card text-card-foreground lg:col-span-5',
    bodyClassName: 'text-muted-foreground',
  },
  {
    id: 'sharing',
    title: 'Publish and learn',
    body: 'Share a profile link or PDF, receive messages, and use consent-based analytics in your workspace.',
    className: 'bg-secondary text-secondary-foreground lg:col-span-12',
    bodyClassName: 'text-muted-foreground',
  },
];

export function Features() {
  return (
    <section
      id="product"
      className="border-y border-border py-20 md:py-28"
      aria-labelledby="capabilities-title"
    >
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <header className="max-w-3xl">
          <Reveal>
            <h2
              id="capabilities-title"
              className="font-display text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
            >
              One profile, built for real work.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Shape the content, presentation, access, and distribution from one
              workspace.
            </p>
          </Reveal>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-px bg-border lg:grid-cols-12">
          {capabilities.map((capability, index) => (
            <li key={capability.id} className={capability.className}>
              <article className="h-full min-h-52 p-6 sm:p-8 lg:p-10">
                <Reveal delay={index * 0.05}>
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.025em]">
                    {capability.title}
                  </h3>
                  <p
                    className={`mt-4 max-w-xl text-sm leading-6 ${capability.bodyClassName}`}
                  >
                    {capability.body}
                  </p>
                </Reveal>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
