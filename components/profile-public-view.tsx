import { Separator } from '@/components/ui/separator';
import { Mail, Globe, Github, Linkedin, Twitter } from 'lucide-react';

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  school: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface ProfileLike {
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

function formatDate(dateString: string) {
  if (!dateString) return '';
  const [year, month] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

export function ProfilePublicView({ profile }: { profile: ProfileLike }) {
  const order: Array<string> = profile.sectionsOrder || [
    'header',
    'contact',
    'experience',
    'education',
    'skills',
  ];

  const Section = ({ id }: { id: string }) => {
    if (id === 'header') {
      const hasContact =
        profile.email ||
        profile.website ||
        profile.github ||
        profile.linkedin ||
        profile.twitter;
      return (
        <div className='mb-8'>
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
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-foreground mb-4'>
            Experience
          </h2>
          <div className='space-y-6'>
            {profile.experience.map((exp) => (
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
      );
    }
    if (id === 'education') {
      if (!Array.isArray(profile.education) || profile.education.length === 0)
        return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-foreground mb-4'>
            Education
          </h2>
          <div className='space-y-6'>
            {profile.education.map((edu) => (
              <div key={`edu:${edu.id}`} className=''>
                <div className='flex justify-between items-start mb-1'>
                  <h3 className='font-medium text-foreground'>{edu.degree}</h3>
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
      );
    }
    if (id === 'skills') {
      if (!Array.isArray(profile.skills) || profile.skills.length === 0)
        return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-foreground mb-4'>Skills</h2>
          <div className='flex flex-wrap gap-2'>
            {profile.skills.map((skill) => (
              <span
                key={`skill:${skill}`}
                className='bg-muted text-foreground px-3 py-1 rounded-full text-sm'
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='w-full max-w-4xl mx-auto py-12 px-6'>
        <div className='w-full bg-card rounded-xl p-8 border'>
          {order
            .filter((sid) => {
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
            })
            .map((id, idx, arr) => (
              <div key={id}>
                <Section id={id} />
                {idx < arr.length - 1 && <Separator className='my-6 w-2/3' />}
              </div>
            ))}
          <div className='mt-12 pt-8 border-t border text-center'>
            <p className='text-sm text-muted-foreground'>
              Want to create your own CV?{' '}
              <a
                href='/'
                className='text-primary hover:text-primary font-medium'
              >
                Get started here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
