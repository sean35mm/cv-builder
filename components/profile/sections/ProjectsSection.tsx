'use client';

import type { ProfileContent } from '@/lib/types';
import { displayUrl } from '@/lib/profile-format';
import { Star, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ProjectsSection({ profile }: { profile: ProfileContent }) {
  if (!Array.isArray(profile.projects) || profile.projects.length === 0) {
    return null;
  }

  const featuredProjects = profile.projects.filter((p) => p.isFeatured);
  const regularProjects = profile.projects.filter((p) => !p.isFeatured);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Projects</h2>

      {featuredProjects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {featuredProjects.map((p) => (
            <FeaturedProjectCard key={`proj:${p.id}`} project={p} />
          ))}
        </div>
      )}

      {regularProjects.length > 0 && (
        <div
          className={cn(
            'grid gap-4',
            featuredProjects.length > 0
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {regularProjects.map((p) => (
            <ProjectCard key={`proj:${p.id}`} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedProjectCard({
  project,
}: {
  project: ProfileContent['projects'][0];
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = project.images || [];

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {images.length > 0 && (
        <div className="relative aspect-video bg-muted">
          <img
            src={images[currentImage]}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i === currentImage
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  )}
                />
              ))}
            </div>
          )}
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
          {project.link && (
            <a
              href={
                project.link.startsWith('http')
                  ? project.link
                  : `https://${project.link}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
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

function ProjectCard({ project }: { project: ProfileContent['projects'][0] }) {
  const images = project.images || [];
  const hasImage = images.length > 0;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {hasImage && (
        <div className="aspect-[4/3] bg-muted">
          <img
            src={images[0]}
            alt={project.title}
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
        {project.link && (
          <a
            href={
              project.link.startsWith('http')
                ? project.link
                : `https://${project.link}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/70 break-words"
          >
            {displayUrl(project.link)}
          </a>
        )}
        {project.description && (
          <p className="text-muted-foreground text-sm leading-relaxed mt-2">
            {project.description}
          </p>
        )}
      </div>
    </div>
  );
}
