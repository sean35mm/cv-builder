import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { ProfilePreview } from './profile-preview';
import { Doc } from '../../convex/_generated/dataModel';

interface ProfileEditorProps {
  profile: Doc<'profiles'>;
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    title: profile.title || '',
    location: profile.location || '',
    bio: profile.bio || '',
    email: profile.email || '',
    website: profile.website || '',
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    twitter: profile.twitter || '',
    experience: profile.experience,
    education: profile.education,
    skills: profile.skills,
    isPublic: profile.isPublic,
    sectionsOrder: (profile as any).sectionsOrder || [
      'header',
      'bio',
      'contact',
      'experience',
      'education',
      'skills',
    ],
  });

  const [activeTab, setActiveTab] = useState<
    'basic' | 'experience' | 'education' | 'skills'
  >('basic');
  const [newSkill, setNewSkill] = useState('');

  const updateProfile = useMutation(api.profiles.updateProfile);
  const [layoutDirty, setLayoutDirty] = useState(false);

  const handleSave = async (): Promise<void> => {
    try {
      await updateProfile(formData as any);
      toast.success('Profile updated successfully!');
      setLayoutDirty(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const addExperience = (): void => {
    const newExp = {
      id: Date.now().toString(),
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    setFormData({
      ...formData,
      experience: [...formData.experience, newExp],
    });
  };

  const updateExperience = (
    id: string,
    field: string,
    value: unknown
  ): void => {
    setFormData({
      ...formData,
      experience: formData.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  const removeExperience = (id: string): void => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((exp) => exp.id !== id),
    });
  };

  const addEducation = (): void => {
    const newEdu = {
      id: Date.now().toString(),
      degree: '',
      school: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    setFormData({
      ...formData,
      education: [...formData.education, newEdu],
    });
  };

  const updateEducation = (id: string, field: string, value: unknown): void => {
    setFormData({
      ...formData,
      education: formData.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  const removeEducation = (id: string): void => {
    setFormData({
      ...formData,
      education: formData.education.filter((edu) => edu.id !== id),
    });
  };

  const addSkill = (): void => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string): void => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  return (
    <div className='flex min-h-screen'>
      {/* Editor Panel */}
      <div className='w-1/2 border-r border-onyx-300 overflow-y-auto bg-raisin_black-200'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold text-bone-500'>Edit Profile</h2>
            <div className='flex items-center gap-4'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className='rounded bg-raisin_black-300 border-onyx-400 text-bone-400 focus:ring-bone-400'
                />
                <span className='text-sm text-bone-700'>Public</span>
              </label>
              <button
                onClick={() => {
                  void handleSave();
                }}
                className='bg-bone-400 text-raisin_black-200 px-4 py-2 rounded-lg hover:bg-bone-300 transition-colors font-medium'
              >
                Save
              </button>
            </div>
          </div>

          {formData.isPublic && (
            <div className='mb-6 p-4 bg-bone-400/10 border border-bone-400/20 rounded-lg'>
              <p className='text-sm text-bone-600 mb-2'>
                Your profile is public at:{' '}
                <a
                  href={`/@${profile.username}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-medium underline text-bone-400 hover:text-bone-300'
                >
                  /@{profile.username}
                </a>
              </p>
              <p className='text-xs text-bone-700'>
                This URL is server-rendered for fast loading and optimal SEO.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className='flex border-b border-onyx-300 mb-6'>
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'experience', label: 'Experience' },
              { id: 'education', label: 'Education' },
              { id: 'skills', label: 'Skills' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-bone-400 text-bone-400'
                    : 'border-transparent text-bone-700 hover:text-bone-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Name
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Title
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Location
                </label>
                <input
                  type='text'
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Email
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Website
                </label>
                <input
                  type='url'
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  GitHub
                </label>
                <input
                  type='text'
                  value={formData.github}
                  onChange={(e) =>
                    setFormData({ ...formData, github: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  LinkedIn
                </label>
                <input
                  type='text'
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-bone-600 mb-2'>
                  Twitter
                </label>
                <input
                  type='text'
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  className='w-full px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                />
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-medium text-bone-500'>
                  Experience
                </h3>
                <button
                  onClick={addExperience}
                  className='bg-bone-400 text-raisin_black-200 px-3 py-1 rounded text-sm hover:bg-bone-300 transition-colors font-medium'
                >
                  Add Experience
                </button>
              </div>

              {formData.experience.map((exp) => (
                <div
                  key={exp.id}
                  className='border border-onyx-400 rounded-lg p-4 bg-raisin_black-300'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <h4 className='font-medium text-bone-500'>
                      Experience Entry
                    </h4>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className='text-red-400 hover:text-red-300 text-sm'
                    >
                      Remove
                    </button>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        Role
                      </label>
                      <input
                        type='text'
                        value={exp.role}
                        onChange={(e) =>
                          updateExperience(exp.id, 'role', e.target.value)
                        }
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        Company
                      </label>
                      <input
                        type='text'
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(exp.id, 'company', e.target.value)
                        }
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        Start Date
                      </label>
                      <input
                        type='month'
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(exp.id, 'startDate', e.target.value)
                        }
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        End Date
                      </label>
                      <input
                        type='month'
                        value={exp.endDate || ''}
                        onChange={(e) =>
                          updateExperience(exp.id, 'endDate', e.target.value)
                        }
                        disabled={exp.current}
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus:border-transparent disabled:bg-onyx-400 text-bone-500'
                      />
                    </div>
                  </div>

                  <div className='mb-4'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={exp.current}
                        onChange={(e) =>
                          updateExperience(exp.id, 'current', e.target.checked)
                        }
                        className='rounded bg-raisin_black-400 border-onyx-500 text-bone-400 focus:ring-bone-400'
                      />
                      <span className='text-sm text-bone-600'>
                        Current position
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-bone-600 mb-1'>
                      Description
                    </label>
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) =>
                        updateExperience(exp.id, 'description', e.target.value)
                      }
                      rows={3}
                      className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className='space-y-6'>
              <div className='flex justify_between items-center'>
                <h3 className='text-lg font-medium text-bone-500'>Education</h3>
                <button
                  onClick={addEducation}
                  className='bg-bone-400 text-raisin_black-200 px-3 py-1 rounded text-sm hover:bg-bone-300 transition-colors font-medium'
                >
                  Add Education
                </button>
              </div>

              {formData.education.map((edu) => (
                <div
                  key={edu.id}
                  className='border border-onyx-400 rounded-lg p-4 bg-raisin_black-300'
                >
                  <div className='flex justify_between items-start mb-4'>
                    <h4 className='font-medium text-bone-500'>
                      Education Entry
                    </h4>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className='text-red-400 hover:text-red-300 text-sm'
                    >
                      Remove
                    </button>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        Degree
                      </label>
                      <input
                        type='text'
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(edu.id, 'degree', e.target.value)
                        }
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        School
                      </label>
                      <input
                        type='text'
                        value={edu.school}
                        onChange={(e) =>
                          updateEducation(edu.id, 'school', e.target.value)
                        }
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus-border-transparent text-bone-500'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        Start Date
                      </label>
                      <input
                        type='month'
                        value={edu.startDate}
                        onChange={(e) =>
                          updateEducation(edu.id, 'startDate', e.target.value)
                        }
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus-ring-bone-400 focus-border-transparent text-bone-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-bone-600 mb-1'>
                        End Date
                      </label>
                      <input
                        type='month'
                        value={edu.endDate || ''}
                        onChange={(e) =>
                          updateEducation(edu.id, 'endDate', e.target.value)
                        }
                        disabled={edu.current}
                        className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus-ring-bone-400 focus-border-transparent disabled:bg-onyx-400 text-bone-500'
                      />
                    </div>
                  </div>

                  <div className='mb-4'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={edu.current}
                        onChange={(e) =>
                          updateEducation(edu.id, 'current', e.target.checked)
                        }
                        className='rounded bg-raisin_black-400 border-onyx-500 text-bone-400 focus:ring-bone-400'
                      />
                      <span className='text-sm text-bone-600'>
                        Currently studying
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-bone-600 mb-1'>
                      Description
                    </label>
                    <textarea
                      value={edu.description || ''}
                      onChange={(e) =>
                        updateEducation(edu.id, 'description', e.target.value)
                      }
                      rows={3}
                      className='w-full px-3 py-2 bg-raisin_black-400 border border-onyx-500 rounded focus:ring-2 focus:ring-bone-400 focus-border-transparent text-bone-500'
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium text-bone-500 mb-4'>
                  Skills
                </h3>

                <div className='flex gap-2 mb-4'>
                  <input
                    type='text'
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder='Add a skill...'
                    className='flex-1 px-3 py-2 bg-raisin_black-300 border border-onyx-400 rounded focus:ring-2 focus:ring-bone-400 focus-border-transparent text-bone-500 placeholder-bone-800'
                  />
                  <button
                    onClick={addSkill}
                    className='bg-bone-400 text-raisin_black-200 px-4 py-2 rounded hover:bg-bone-300 transition-colors font-medium'
                  >
                    Add
                  </button>
                </div>

                <div className='flex flex-wrap gap-2'>
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className='inline-flex items-center gap-1 bg-onyx-400 text-bone-500 px-3 py-1 rounded-full text-sm'
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className='text-bone-700 hover:text-red-400 ml-1'
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className='w-1/2 bg-raisin_black-100 overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-bone-500'>Live Preview</h3>
            {layoutDirty && (
              <button
                onClick={() => {
                  void handleSave();
                }}
                className='bg-bone-400 text-raisin_black-200 px-3 py-1 rounded text-sm hover:bg-bone-300 transition-colors font-medium'
              >
                Save
              </button>
            )}
          </div>
          <ProfilePreview
            profile={{ ...profile, ...formData } as any}
            sectionsOrder={(formData as any).sectionsOrder}
            onReorderSections={(next) => {
              setFormData({ ...formData, sectionsOrder: next });
              setLayoutDirty(true);
            }}
            onReorderExperience={(next) => {
              setFormData({ ...formData, experience: next });
              setLayoutDirty(true);
            }}
            onReorderEducation={(next) => {
              setFormData({ ...formData, education: next });
              setLayoutDirty(true);
            }}
            onReorderSkills={(next) => {
              setFormData({ ...formData, skills: next });
              setLayoutDirty(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
