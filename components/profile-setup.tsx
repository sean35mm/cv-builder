'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function ProfileSetup() {
  const [isCreating, setIsCreating] = useState(false);
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
        // Hydrate browser-only intent after mount to avoid an SSR mismatch.
        setFormData((prev) => ({ ...prev, username: desiredUsername }));
        sessionStorage.removeItem('desiredUsername');
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  const createProfile = useMutation(api.profiles.createProfile);
  const checkUsername = useQuery(
    api.profiles.checkUsernameAvailable,
    formData.username.length >= 3 ? { username: formData.username } : 'skip'
  );
  const isCheckingUsername =
    formData.username.length >= 3 && checkUsername === undefined;
  const usernameAvailable = checkUsername ?? null;

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
  };

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

    setIsCreating(true);
    try {
      await createProfile(formData);
      toast.success('Profile created');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create profile'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <header className="pt-4 lg:sticky lg:top-16 lg:self-start lg:pt-10">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Your space starts here
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
            Introduce yourself.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Claim a memorable address and share the essentials. You can shape
            the full story, add work, and choose a visual style next.
          </p>
          <ol className="mt-8 max-w-md divide-y divide-border border-y border-border">
            {[
              ['01', 'Claim your profile address'],
              ['02', 'Add the essentials'],
              ['03', 'Refine everything in the editor'],
            ].map(([step, label]) => (
              <li key={step} className="flex items-center gap-4 py-3 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  {step}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Creating the profile does not make it public. Access and sharing are
            managed separately in Publish.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-6 rounded-lg border border-border bg-card p-5 sm:p-8"
          aria-busy={isCreating}
        >
          <div>
            <Label htmlFor="setup-username" className="mb-1.5 text-sm">
              Username
            </Label>
            <div className="relative">
              <Input
                id="setup-username"
                type="text"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_name"
                autoComplete="username"
                aria-describedby="setup-username-help setup-username-status"
                className="pr-24"
                aria-invalid={
                  formData.username.length >= 3 && usernameAvailable === false
                }
                required
              />
              <div
                id="setup-username-status"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                role="status"
                aria-live="polite"
              >
                {formData.username.length >= 3 &&
                  (isCheckingUsername ? (
                    <>
                      <span className="sr-only">Checking availability</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
                    </>
                  ) : usernameAvailable ? (
                    <span className="text-sm font-medium text-accent">
                      Available
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-destructive">
                      Taken
                    </span>
                  ))}
              </div>
            </div>
            <p
              id="setup-username-help"
              className="mt-1.5 text-xs text-muted-foreground"
            >
              Your profile will be at opencv.app/@{formData.username || '...'}
            </p>
          </div>

          <div>
            <Label htmlFor="setup-name" className="mb-1.5 text-sm">
              Full name
            </Label>
            <Input
              id="setup-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <Label htmlFor="setup-title" className="mb-1.5 text-sm">
              Professional title
            </Label>
            <Input
              id="setup-title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <Label htmlFor="setup-location" className="mb-1.5 text-sm">
              Location
            </Label>
            <Input
              id="setup-location"
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <Label htmlFor="setup-bio" className="mb-1.5 text-sm">
              Short bio
            </Label>
            <Textarea
              id="setup-bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              placeholder="A brief introduction about yourself..."
            />
          </div>

          <fieldset className="space-y-4 rounded border border-border bg-secondary p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold text-foreground">
              Make it easy to reach you
            </legend>
            <p className="text-sm leading-6 text-muted-foreground">
              These details are optional and can be changed or hidden later.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="setup-email" className="mb-1.5 text-sm">
                  Email
                </Label>
                <Input
                  id="setup-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="setup-website" className="mb-1.5 text-sm">
                  Website
                </Label>
                <Input
                  id="setup-website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  autoComplete="url"
                  placeholder="https://your.site"
                />
              </div>
              <div>
                <Label htmlFor="setup-github" className="mb-1.5 text-sm">
                  GitHub
                </Label>
                <Input
                  id="setup-github"
                  value={formData.github}
                  onChange={(e) =>
                    setFormData({ ...formData, github: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div>
                <Label htmlFor="setup-linkedin" className="mb-1.5 text-sm">
                  LinkedIn
                </Label>
                <Input
                  id="setup-linkedin"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="setup-twitter" className="mb-1.5 text-sm">
                  X / Twitter
                </Label>
                <Input
                  id="setup-twitter"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
            </div>
          </fieldset>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={
                isCreating ||
                isCheckingUsername ||
                !formData.username ||
                !formData.name ||
                !usernameAvailable
              }
              className="w-full"
            >
              {isCreating ? 'Creating profile…' : 'Create profile'}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You will continue to the full editor after creation.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
