'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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

  useEffect(() => {
    try {
      const desiredUsername = sessionStorage.getItem('desiredUsername');
      if (desiredUsername) {
        setFormData((prev) => ({ ...prev, username: desiredUsername }));
        sessionStorage.removeItem('desiredUsername');
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  const createProfile = useMutation(api.profiles.createProfile);
  const checkUsername = useQuery(
    api.profiles.checkUsernameAvailable,
    formData.username.length >= 3 ? { username: formData.username } : 'skip'
  );

  const normalizeUsername = (raw: string): string => {
    return raw
      .replace(/^@+/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 15);
  };

  const handleUsernameChange = (raw: string): void => {
    const username = normalizeUsername(raw);
    setFormData({ ...formData, username });
    if (username.length >= 3) {
      setIsCheckingUsername(true);
    }
  };

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
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-foreground font-serif">
          Set up your profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a username and add your basic info to get started.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-5"
      >
        <div>
          <Label className="mb-1.5 text-sm">Username</Label>
          <div className="relative">
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your-username"
              required
            />
            {formData.username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
                ) : usernameAvailable ? (
                  <span className="text-sm font-medium text-primary">
                    Available
                  </span>
                ) : (
                  <span className="text-sm font-medium text-destructive">
                    Taken
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Your profile will be at opencv.app/@{formData.username || '...'}
          </p>
        </div>

        <div>
          <Label className="mb-1.5 text-sm">Full Name</Label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Jane Doe"
            required
          />
        </div>

        <div>
          <Label className="mb-1.5 text-sm">Title</Label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Software Engineer"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-sm">Location</Label>
          <Input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="San Francisco, CA"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-sm">Bio</Label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="A brief introduction about yourself..."
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={
              !formData.username || !formData.name || !usernameAvailable
            }
            className="w-full"
          >
            Create Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
