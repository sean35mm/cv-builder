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
}

export function ProfilePreview({
  profile,
  sectionsOrder,
  onReorderSections,
  onReorderExperience,
  onReorderEducation,
  onReorderSkills,
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
  const experienceIds = (profile.experience || []).map((e) => `exp:${e.id}`);
  const educationIds = (profile.education || []).map((e) => `edu:${e.id}`);
  const skillIds = (profile.skills || []).map((s) => `skill:${s}`);

  const sensors = useSensors(useSensor(PointerSensor));

  function SortableItem({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  }

  const Section = ({ id }: { id: string }) => {
    if (id === 'header') {
      return (
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-bone-500 mb-2'>
            {profile.name}
          </h1>
          {profile.title && (
            <p className='text-xl text-bone-600 mb-2'>{profile.title}</p>
          )}
          {profile.location && (
            <p className='text-bone-700 mb-4'>{profile.location}</p>
          )}
          {profile.bio && (
            <p className='text-bone-600 leading-relaxed whitespace-pre-line'>
              {profile.bio}
            </p>
          )}
        </div>
      );
    }
    if (id === 'contact') {
      return (
        (profile.email ||
          profile.website ||
          profile.github ||
          profile.linkedin ||
          profile.twitter) && (
          <div className='mb-8'>
            <h2 className='text-lg font-semibold text-bone-500 mb-3'>
              Contact
            </h2>
            <div className='space-y-2'>
              {profile.email && (
                <div>
                  <a
                    href={`mailto:${profile.email}`}
                    className='text-bone-400 hover:text-bone-300 transition-colors'
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.website && (
                <div>
                  <a
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-bone-400 hover:text-bone-300 transition-colors'
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.github && (
                <div>
                  <a
                    href={`https://github.com/${profile.github}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-bone-400 hover:text-bone-300 transition-colors'
                  >
                    GitHub: {profile.github}
                  </a>
                </div>
              )}
              {profile.linkedin && (
                <div>
                  <a
                    href={`https://linkedin.com/in/${profile.linkedin}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-bone-400 hover:text-bone-300 transition-colors'
                  >
                    LinkedIn: {profile.linkedin}
                  </a>
                </div>
              )}
              {profile.twitter && (
                <div>
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-bone-400 hover:text-bone-300 transition-colors'
                  >
                    Twitter: @{profile.twitter}
                  </a>
                </div>
              )}
            </div>
          </div>
        )
      );
    }
    if (id === 'experience') {
      return (
        Array.isArray(profile.experience) &&
        profile.experience.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-lg font-semibold text-bone-500 mb-4'>
              Experience
            </h2>
            <div className='space-y-6'>
              {profile.experience.map((exp: any) => (
                <div key={exp.id} className='border-l-2 border-bone-400 pl-4'>
                  <div className='flex justify-between items-start mb-1'>
                    <h3 className='font-medium text-bone-500'>{exp.role}</h3>
                    <span className='text-sm text-bone-700 whitespace-nowrap ml-4'>
                      {formatDate(exp.startDate)} -{' '}
                      {exp.current ? 'Present' : formatDate(exp.endDate || '')}
                    </span>
                  </div>
                  <p className='text-bone-600 mb-2'>{exp.company}</p>
                  {exp.description && (
                    <p className='text-bone-600 text-sm leading-relaxed whitespace-pre-line'>
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
          <div className='mb-8'>
            <h2 className='text-lg font-semibold text-bone-500 mb-4'>
              Education
            </h2>
            <div className='space-y-6'>
              {profile.education.map((edu: any) => (
                <div key={edu.id} className='border-l-2 border-bone-400 pl-4'>
                  <div className='flex justify-between items-start mb-1'>
                    <h3 className='font-medium text-bone-500'>{edu.degree}</h3>
                    <span className='text-sm text-bone-700 whitespace-nowrap ml-4'>
                      {formatDate(edu.startDate)} -{' '}
                      {edu.current ? 'Present' : formatDate(edu.endDate || '')}
                    </span>
                  </div>
                  <p className='text-bone-600 mb-2'>{edu.school}</p>
                  {edu.description && (
                    <p className='text-bone-600 text-sm leading-relaxed whitespace-pre-line'>
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
          <div className='mb-8'>
            <h2 className='text-lg font-semibold text-bone-500 mb-4'>Skills</h2>
            <div className='flex flex-wrap gap-2'>
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className='bg-onyx-400 text-bone-500 px-3 py-1 rounded-full text-sm'
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
    <div className='max-w-2xl mx-auto bg-raisin_black-200 rounded-lg p-6 border border-onyx-300'>
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
          if (aType === 'exp' && onReorderExperience) {
            const oldIndex = experienceIds.indexOf(String(active.id));
            const newIndex = experienceIds.indexOf(String(over.id));
            if (oldIndex !== -1 && newIndex !== -1) {
              onReorderExperience(
                arrayMove(profile.experience, oldIndex, newIndex)
              );
            }
          }
          if (aType === 'edu' && onReorderEducation) {
            const oldIndex = educationIds.indexOf(String(active.id));
            const newIndex = educationIds.indexOf(String(over.id));
            if (oldIndex !== -1 && newIndex !== -1) {
              onReorderEducation(
                arrayMove(profile.education, oldIndex, newIndex)
              );
            }
          }
          if (aType === 'skill' && onReorderSkills) {
            const oldIndex = skillIds.indexOf(String(active.id));
            const newIndex = skillIds.indexOf(String(over.id));
            if (oldIndex !== -1 && newIndex !== -1) {
              onReorderSkills(arrayMove(profile.skills, oldIndex, newIndex));
            }
          }
        }}
      >
        <SortableContext
          items={sectionIds}
          strategy={verticalListSortingStrategy}
        >
          {order.map((id) => (
            <SortableItem key={`section:${id}`} id={`section:${id}`}>
              {/* Render nested lists with their own SortableContexts */}
              {id === 'experience' ? (
                <SortableContext
                  items={experienceIds}
                  strategy={verticalListSortingStrategy}
                >
                  <Section id={id} />
                </SortableContext>
              ) : id === 'education' ? (
                <SortableContext
                  items={educationIds}
                  strategy={verticalListSortingStrategy}
                >
                  <Section id={id} />
                </SortableContext>
              ) : id === 'skills' ? (
                <SortableContext
                  items={skillIds}
                  strategy={verticalListSortingStrategy}
                >
                  <Section id={id} />
                </SortableContext>
              ) : (
                <Section id={id} />
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
