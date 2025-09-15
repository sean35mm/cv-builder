import { Separator } from '@/components/ui/separator';

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
      const show =
        profile.email ||
        profile.website ||
        profile.github ||
        profile.linkedin ||
        profile.twitter;
      if (!show) return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-bone-500 mb-3'>Contact</h2>
          <div className='space-y-2'>
            {profile.email && (
              <div>
                <a
                  href={`mailto:${profile.email}`}
                  className='text-bone-400 hover:text-bone-300'
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
                  className='text-bone-400 hover:text-bone-300'
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
                  className='text-bone-400 hover:text-bone-300'
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
                  className='text-bone-400 hover:text-bone-300'
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
                  className='text-bone-400 hover:text-bone-300'
                >
                  Twitter: @{profile.twitter}
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }
    if (id === 'experience') {
      if (!Array.isArray(profile.experience) || profile.experience.length === 0)
        return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-bone-500 mb-4'>
            Experience
          </h2>
          <div className='space-y-6'>
            {profile.experience.map((exp) => (
              <div
                key={`exp:${exp.id}`}
                className='border-l-2 border-bone-400 pl-4'
              >
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
      );
    }
    if (id === 'education') {
      if (!Array.isArray(profile.education) || profile.education.length === 0)
        return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-bone-500 mb-4'>
            Education
          </h2>
          <div className='space-y-6'>
            {profile.education.map((edu) => (
              <div
                key={`edu:${edu.id}`}
                className='border-l-2 border-bone-400 pl-4'
              >
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
      );
    }
    if (id === 'skills') {
      if (!Array.isArray(profile.skills) || profile.skills.length === 0)
        return null;
      return (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-bone-500 mb-4'>Skills</h2>
          <div className='flex flex-wrap gap-2'>
            {profile.skills.map((skill) => (
              <span
                key={`skill:${skill}`}
                className='bg-onyx-400 text-bone-500 px-3 py-1 rounded-full text-sm'
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
    <div className='min-h-screen bg-raisin_black-100'>
      <div className='w-full max-w-4xl mx-auto py-12 px-6'>
        <div className='w-full bg-raisin_black-200 rounded-lg p-6 border border-onyx-300'>
          {order
            .filter((sid) => {
              if (sid === 'header') return true;
              if (sid === 'contact')
                return Boolean(
                  profile.email ||
                    profile.website ||
                    profile.github ||
                    profile.linkedin ||
                    profile.twitter
                );
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
          <div className='mt-12 pt-8 border-t border-onyx-300 text-center'>
            <p className='text-sm text-bone-700'>
              Want to create your own CV?{' '}
              <a
                href='/'
                className='text-bone-400 hover:text-bone-300 font-medium'
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
