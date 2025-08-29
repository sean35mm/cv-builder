import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

export function ProfileSetup() {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    title: '',
    location: '',
    bio: '',
    email: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
  });

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  const createProfile = useMutation(api.profiles.createProfile);
  const checkUsername = useQuery(
    api.profiles.checkUsernameAvailable,
    formData.username.length >= 3 ? { username: formData.username } : 'skip'
  );

  const handleUsernameChange = (username: string): void => {
    setFormData({ ...formData, username });
    if (username.length >= 3) {
      setIsCheckingUsername(true);
    }
  };

  // Update username availability when query result changes
  useEffect(() => {
    if (checkUsername !== undefined) {
      setUsernameAvailable(checkUsername);
      setIsCheckingUsername(false);
    }
  }, [checkUsername]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.username || !formData.name) {
      toast.error('Username and name are required');
      return;
    }

    if (!usernameAvailable) {
      toast.error('Username is not available');
      return;
    }

    try {
      await createProfile(formData);
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create profile'
      );
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-bone-500 mb-2'>
          Set up your profile
        </h1>
        <p className='text-bone-700'>
          Create your unique CV profile to get started
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className='space-y-6'
      >
        <div>
          <label className='block text-sm font-medium text-bone-600 mb-2'>
            Username *
          </label>
          <div className='relative'>
            <input
              type='text'
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className='w-full px-4 py-3 bg-raisin_black-200 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500 placeholder-bone-800'
              placeholder='your-username'
              required
            />
            {formData.username.length >= 3 && (
              <div className='absolute right-3 top-3'>
                {isCheckingUsername ? (
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-bone-400'></div>
                ) : usernameAvailable ? (
                  <span className='text-green-400'>✓</span>
                ) : (
                  <span className='text-red-400'>✗</span>
                )}
              </div>
            )}
          </div>
          {formData.username.length >= 3 && !isCheckingUsername && (
            <p
              className={`text-sm mt-1 ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}
            >
              {usernameAvailable ? 'Username available' : 'Username taken'}
            </p>
          )}
          <p className='text-sm text-bone-800 mt-1'>
            Your profile will be available at /@{formData.username}
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-bone-600 mb-2'>
            Full Name *
          </label>
          <input
            type='text'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className='w-full px-4 py-3 bg-raisin_black-200 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500 placeholder-bone-800'
            placeholder='John Doe'
            required
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
            className='w-full px-4 py-3 bg-raisin_black-200 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500 placeholder-bone-800'
            placeholder='Software Engineer'
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
            className='w-full px-4 py-3 bg-raisin_black-200 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500 placeholder-bone-800'
            placeholder='San Francisco, CA'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-bone-600 mb-2'>
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className='w-full px-4 py-3 bg-raisin_black-200 border border-onyx-400 rounded-lg focus:ring-2 focus:ring-bone-400 focus:border-transparent text-bone-500'
            rows={3}
            placeholder='Tell us about yourself...'
          />
        </div>

        <button
          type='submit'
          disabled={!formData.username || !formData.name || !usernameAvailable}
          className='w-full bg-bone-400 text-raisin_black-200 py-3 px-4 rounded-lg font-medium hover:bg-bone-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          Create Profile
        </button>
      </form>
    </div>
  );
}
