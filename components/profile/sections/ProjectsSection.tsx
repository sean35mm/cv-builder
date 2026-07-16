import type { ProfileContent } from '@/lib/types';
import { displayUrl, normalizeExternalUrl } from '@/lib/profile-format';
import { Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TemplateId } from '@/lib/templates';
import { ProjectImageGallery } from './project-image-gallery';

type ProjectsSectionProps = {
  profile: ProfileContent;
  variant?: TemplateId;
  sectionLabel?: string;
};

export function ProjectsSection({
  profile,
  variant = 'modern',
  sectionLabel = 'Projects',
}: ProjectsSectionProps) {
  if (!Array.isArray(profile.projects) || profile.projects.length === 0) {
    return null;
  }

  if (variant === 'developer' || variant === 'creative') {
    return (
      <PortfolioProjects
        projects={profile.projects}
        variant={variant}
        sectionLabel={sectionLabel}
      />
    );
  }

  const featuredProjects = profile.projects.filter((p) => p.isFeatured);
  const regularProjects = profile.projects.filter((p) => !p.isFeatured);

  return (
    <div
      className={cn(
        variant === 'classic' && 'mb-6',
        variant === 'modern' && 'mb-8',
        variant === 'minimal' && 'mb-12'
      )}
    >
      {variant === 'classic' && (
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4 border-b pb-1">
          Projects
        </h2>
      )}
      {variant === 'modern' && (
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-0.5 bg-primary rounded-full" />
          Projects
        </h2>
      )}
      {variant === 'minimal' && (
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
          Projects
        </h2>
      )}

      {featuredProjects.length > 0 && (
        <div
          className={cn(
            'grid grid-cols-1 gap-6 mb-6',
            variant === 'modern' && 'lg:grid-cols-2'
          )}
        >
          {featuredProjects.map((p, index) => (
            <FeaturedProjectCard
              key={`proj:${p.id}`}
              project={p}
              variant={variant}
              eagerImage={index === 0}
            />
          ))}
        </div>
      )}

      {regularProjects.length > 0 && (
        <div
          className={cn(
            'grid gap-4',
            variant === 'classic' && 'grid-cols-1 sm:grid-cols-2',
            variant === 'modern' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            variant === 'minimal' && 'grid-cols-1'
          )}
        >
          {regularProjects.map((p) => (
            <ProjectCard key={`proj:${p.id}`} project={p} variant={variant} />
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioProjects({
  projects,
  variant,
  sectionLabel,
}: {
  projects: ProfileContent['projects'];
  variant: 'developer' | 'creative';
  sectionLabel: string;
}) {
  const isDeveloper = variant === 'developer';

  return (
    <section
      className={cn(
        'min-w-0',
        isDeveloper
          ? 'border-t-2 border-foreground py-8 sm:py-10'
          : 'border-t border-foreground/70 py-12 sm:py-16'
      )}
    >
      <h2
        className={cn(
          'mb-8 text-foreground',
          isDeveloper
            ? 'font-mono text-xs font-semibold uppercase tracking-[0.18em]'
            : 'font-serif text-2xl sm:text-3xl'
        )}
      >
        {sectionLabel}
      </h2>
      <ol className={cn(isDeveloper ? 'space-y-0' : 'space-y-12 sm:space-y-16')}>
        {projects.map((project, index) => {
          const images = project.images ?? [];
          const projectUrl = normalizeExternalUrl(project.link);

          return (
            <li
              key={`proj:${project.id}`}
              className={cn(
                'min-w-0',
                isDeveloper
                  ? 'grid gap-5 border-t border-border py-6 first:border-t-0 first:pt-0 sm:grid-cols-[48px_minmax(0,1fr)]'
                  : 'grid gap-6 border-t border-border pt-8 md:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)] md:gap-10'
              )}
            >
              {isDeveloper && (
                <div className="font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, '0')}
                </div>
              )}

              <div
                className={cn(
                  'min-w-0',
                  !isDeveloper &&
                    'grid gap-6 md:col-span-2 md:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)] md:gap-10'
                )}
              >
                {images.length > 0 && (
                  <div
                    className={cn(
                      'relative aspect-video min-w-0 overflow-hidden bg-muted',
                      isDeveloper ? 'mb-5 border border-border' : 'md:col-start-1'
                    )}
                  >
                    <ProjectImageGallery
                      title={project.title}
                      images={images}
                      eagerImage={index === 0}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    'min-w-0',
                    !isDeveloper &&
                      (images.length > 0
                        ? 'md:col-start-2 md:row-start-1'
                        : 'md:col-span-2')
                  )}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3
                      className={cn(
                        'break-words text-foreground',
                        isDeveloper
                          ? 'font-mono text-xl font-semibold'
                          : 'font-serif text-3xl sm:text-4xl'
                      )}
                    >
                      {project.title}
                    </h3>
                    {project.isFeatured && (
                      <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-2 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                    {project.year && <span>{project.year}</span>}
                    {project.company && <span>{project.company}</span>}
                    {project.category && (
                      <span className="text-primary">{project.category}</span>
                    )}
                  </p>

                  {project.technologies && project.technologies.length > 0 && (
                    <ul
                      className={cn(
                        'mt-4 flex flex-wrap text-xs text-muted-foreground',
                        isDeveloper ? 'gap-x-3 gap-y-1 font-mono' : 'gap-x-4 gap-y-2'
                      )}
                      aria-label={`${project.title} technologies`}
                    >
                      {project.technologies.map((technology) => (
                        <li key={technology}>{technology}</li>
                      ))}
                    </ul>
                  )}

                  {project.description && (
                    <p className="mt-5 whitespace-pre-line text-sm leading-7 text-foreground/80">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-5 break-words text-sm">
                    {projectUrl ? (
                      <a
                        href={projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {displayUrl(project.link)}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : project.link ? (
                      <span className="text-muted-foreground">{project.link}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FeaturedProjectCard({
  project,
  variant,
  eagerImage,
}: {
  project: ProfileContent['projects'][0];
  variant: TemplateId;
  eagerImage: boolean;
}) {
  const images = project.images || [];
  const projectUrl = normalizeExternalUrl(project.link);

  return (
    <div
      className={cn(
        'overflow-hidden',
        variant === 'classic' && 'border bg-card',
        variant === 'modern' && 'rounded-xl border bg-card',
        variant === 'minimal' && 'border-b bg-transparent'
      )}
    >
      {images.length > 0 && (
        <div className="relative aspect-video bg-muted">
          <ProjectImageGallery
            title={project.title}
            images={images}
            eagerImage={eagerImage}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              {project.year && <span>{project.year}</span>}
              {project.year && project.company && <span>·</span>}
              {project.company && <span>{project.company}</span>}
              {project.category && (
                <>
                  {(project.year || project.company) && <span>·</span>}
                  <span className="text-primary">{project.category}</span>
                </>
              )}
            </div>
          </div>
          {projectUrl ? (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${project.title} project (opens in a new tab)`}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          ) : project.link ? (
            <span className="text-xs text-muted-foreground break-all">
              {project.link}
            </span>
          ) : null}
        </div>
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        {project.description && (
          <p className="text-muted-foreground text-sm leading-relaxed mt-3">
            {project.description}
          </p>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  variant,
}: {
  project: ProfileContent['projects'][0];
  variant: TemplateId;
}) {
  const images = project.images || [];
  const hasImage = images.length > 0;
  const projectUrl = normalizeExternalUrl(project.link);

  return (
    <div
      className={cn(
        'overflow-hidden',
        variant === 'classic' && 'border bg-card',
        variant === 'modern' && 'rounded-lg border bg-card',
        variant === 'minimal' && 'border-b bg-transparent'
      )}
    >
      {hasImage && (
        <div className="aspect-[4/3] bg-muted">
          <img
            src={images[0]}
            alt={project.title}
            width={1200}
            height={900}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{project.title}</h3>
          {project.year && (
            <span className="text-xs text-muted-foreground">
              {project.year}
            </span>
          )}
        </div>
        {project.company && (
          <p className="text-muted-foreground text-sm mb-1">
            {project.company}
          </p>
        )}
        {project.category && (
          <span className="inline-block text-xs text-primary mb-2">
            {project.category}
          </span>
        )}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        )}
        {projectUrl ? (
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${project.title} project (opens in a new tab)`}
            className="text-sm text-primary hover:text-primary/70 break-words"
          >
            {displayUrl(project.link)}
          </a>
        ) : project.link ? (
          <span className="text-sm text-muted-foreground break-words">
            {project.link}
          </span>
        ) : null}
        {project.description && (
          <p className="text-muted-foreground text-sm leading-relaxed mt-2">
            {project.description}
          </p>
        )}
      </div>
    </div>
  );
}
