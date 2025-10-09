import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Separator } from '@/components/ui/separator';
import { Mail, Globe, Github, Linkedin, Twitter } from 'lucide-react';
interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface ProfileLike {
  name: string;
  title?: string;
  location?: string;
  bio?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  experience: Array<ExperienceEntry>;
  education: Array<EducationEntry>;
  skills: Array<string>;
  sectionsOrder?: Array<string>;
}

interface ProfilePreviewProps {
  profile: ProfileLike;
  sectionsOrder?: Array<string>;
  onReorderSections?: (next: Array<string>) => void;
  onReorderExperience?: (next: Array<ExperienceEntry>) => void;
  onReorderEducation?: (next: Array<EducationEntry>) => void;
  onReorderSkills?: (next: Array<string>) => void;
  showDragHandles?: boolean;
}

export function ProfilePreview({
  profile,
  sectionsOrder,
  onReorderSections,
  onReorderExperience: _onReorderExperience,
  onReorderEducation: _onReorderEducation,
  onReorderSkills: _onReorderSkills,
  showDragHandles,
}: ProfilePreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const order: Array<string> = sectionsOrder ||
    profile.sectionsOrder || [
      'header',
      'contact',
      'experience',
      'education',
      'skills',
    ];

  const sectionIds = order.map((s) => `section:${s}`);

  const sensors = useSensors(useSensor(PointerSensor));

  function SortableItem({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const finalTransform = transform
      ? { ...transform, scaleX: 1, scaleY: 1 }
      : transform;

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(finalTransform as any),
      transition: isDragging ? undefined : transition,
      cursor: 'grab',
      zIndex: isDragging ? 50 : undefined,
      willChange: 'transform',
      touchAction: 'none',
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`box-border p-2 ${
          isDragging ? 'outline-2 outline-primary rounded-md' : ''
        }`}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>
    );
  }

  const DragHandle = () => (
    <div className='absolute top-0 right-0 mt-1 mr-1 text-muted-foreground opacity-60 group-hover:opacity-100 pointer-events-none'>
      <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='currentColor'
        aria-hidden='true'
      >
        <circle cx='7' cy='7' r='1.5'></circle>
        <circle cx='7' cy='12' r='1.5'></circle>
        <circle cx='7' cy='17' r='1.5'></circle>
        <circle cx='12' cy='7' r='1.5'></circle>
        <circle cx='12' cy='12' r='1.5'></circle>
        <circle cx='12' cy='17' r='1.5'></circle>
      </svg>
    </div>
  );

  const Section = ({ id }: { id: string }) => {
    if (id === 'header') {
      const hasContact =
        profile.email ||
        profile.website ||
        profile.github ||
        profile.linkedin ||
        profile.twitter;
      return (
        <div className='mb-8 relative group'>
          {showDragHandles && <DragHandle />}
          <div className='flex justify-between items-center gap-8'>
            <div className='flex-1'>
              <h1 className='text-4xl font-bold text-foreground mb-2'>
                {profile.name}
              </h1>
              {profile.title && (
                <p className='text-xl text-muted-foreground mb-2'>
                  {profile.title}
                </p>
              )}
              {profile.location && (
                <p className='text-muted-foreground mb-4'>{profile.location}</p>
              )}
              {profile.bio && (
                <p className='text-muted-foreground leading-relaxed whitespace-pre-line'>
                  {profile.bio}
                </p>
              )}
            </div>
            {hasContact && (
              <div className='flex-shrink-0 space-y-2'>
                {profile.email && (
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-muted-foreground' />
                    <a
                      href={`mailto:${profile.email}`}
                      className='text-sm text-primary hover:text-primary transition-colors'
                    >
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div className='flex items-center gap-2'>
                    <Globe className='w-4 h-4 text-muted-foreground' />
                    <a
                      href={
                        profile.website.startsWith('http')
                          ? profile.website
                          : `https://${profile.website}`
                      }
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-primary hover:text-primary transition-colors'
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.github && (
                  <div className='flex items-center gap-2'>
                    <Github className='w-4 h-4 text-muted-foreground' />
                    <a
                      href={`https://github.com/${profile.github}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-primary hover:text-primary transition-colors'
                    >
                      {profile.github}
                    </a>
                  </div>
                )}
                {profile.linkedin && (
                  <div className='flex items-center gap-2'>
                    <Linkedin className='w-4 h-4 text-muted-foreground' />
                    <a
                      href={`https://linkedin.com/in/${profile.linkedin}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-primary hover:text-primary transition-colors'
                    >
                      {profile.linkedin}
                    </a>
                  </div>
                )}
                {profile.twitter && (
                  <div className='flex items-center gap-2'>
                    <Twitter className='w-4 h-4 text-muted-foreground' />
                    <a
                      href={`https://twitter.com/${profile.twitter}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-primary hover:text-primary transition-colors'
                    >
                      @{profile.twitter}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    if (id === 'contact') {
      return null;
    }
    if (id === 'experience') {
      return (
        Array.isArray(profile.experience) &&
        profile.experience.length > 0 && (
          <div className='mb-8 relative group'>
            {showDragHandles && <DragHandle />}
            <h2 className='text-lg font-semibold text-foreground mb-4'>
              Experience
            </h2>
            <div className='space-y-6'>
              {profile.experience.map((exp: any) => (
                <div key={`exp:${exp.id}`} className=''>
                  <div className='flex justify-between items-start mb-1'>
                    <h3 className='font-medium text-foreground'>{exp.role}</h3>
                    <span className='text-sm text-muted-foreground whitespace-nowrap ml-4'>
                      {formatDate(exp.startDate)} -{' '}
                      {exp.current ? 'Present' : formatDate(exp.endDate || '')}
                    </span>
                  </div>
                  <p className='text-muted-foreground mb-2'>{exp.company}</p>
                  {exp.description && (
                    <p className='text-muted-foreground text-sm leading-relaxed whitespace-pre-line'>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'education') {
      return (
        Array.isArray(profile.education) &&
        profile.education.length > 0 && (
          <div className='mb-8 relative group'>
            {showDragHandles && <DragHandle />}
            <h2 className='text-lg font-semibold text-foreground mb-4'>
              Education
            </h2>
            <div className='space-y-6'>
              {profile.education.map((edu: any) => (
                <div key={`edu:${edu.id}`} className=''>
                  <div className='flex justify-between items-start mb-1'>
                    <h3 className='font-medium text-foreground'>
                      {edu.degree}
                    </h3>
                    <span className='text-sm text-muted-foreground whitespace-nowrap ml-4'>
                      {formatDate(edu.startDate)} -{' '}
                      {edu.current ? 'Present' : formatDate(edu.endDate || '')}
                    </span>
                  </div>
                  <p className='text-muted-foreground mb-2'>{edu.school}</p>
                  {edu.description && (
                    <p className='text-muted-foreground text-sm leading-relaxed whitespace-pre-line'>
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      );
    }
    if (id === 'skills') {
      return (
        Array.isArray(profile.skills) &&
        profile.skills.length > 0 && (
          <div className='mb-8 relative group'>
            {showDragHandles && <DragHandle />}
            <h2 className='text-lg font-semibold text-foreground mb-4'>
              Skills
            </h2>
            <div className='flex flex-wrap gap-2'>
              {profile.skills.map((skill: string) => (
                <span
                  key={`skill:${skill}}`}
                  className='bg-muted text-foreground px-3 py-1 rounded-full text-sm'
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )
      );
    }
    return null;
  };

  return (
    <div className='w-[90%] mx-auto bg-card rounded-xl p-8 border'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over) return;
          const [aType] = String(active.id).split(':');
          const [oType] = String(over.id).split(':');
          if (aType !== oType) return;
          if (aType === 'section' && onReorderSections) {
            const oldIndex = sectionIds.indexOf(String(active.id));
            const newIndex = sectionIds.indexOf(String(over.id));
            if (oldIndex !== -1 && newIndex !== -1) {
              const nextOrder = arrayMove(order, oldIndex, newIndex);
              onReorderSections(nextOrder);
            }
          }
          // Only sections are draggable; items within sections are static
        }}
      >
        <SortableContext
          items={sectionIds}
          strategy={verticalListSortingStrategy}
        >
          {order.map((id, idx) => {
            const isSectionVisible = (sid: string) => {
              if (sid === 'header') return true;
              if (sid === 'contact') return false;
              if (sid === 'experience')
                return (
                  Array.isArray(profile.experience) &&
                  profile.experience.length > 0
                );
              if (sid === 'education')
                return (
                  Array.isArray(profile.education) &&
                  profile.education.length > 0
                );
              if (sid === 'skills')
                return (
                  Array.isArray(profile.skills) && profile.skills.length > 0
                );
              return false;
            };
            const visible = isSectionVisible(id);
            const hasNextVisible =
              visible && order.slice(idx + 1).some(isSectionVisible);
            return (
              <SortableItem key={`section:${id}`} id={`section:${id}`}>
                <>
                  {visible && <Section id={id} />}
                  {visible && hasNextVisible && (
                    <Separator className='my-6 w-2/3' />
                  )}
                </>
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
