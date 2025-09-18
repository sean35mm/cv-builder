import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ProfileSetup() {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    title: "",
    location: "",
    bio: "",
    email: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
  });

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );

  const createProfile = useMutation(api.profiles.createProfile);
  const checkUsername = useQuery(
    api.profiles.checkUsernameAvailable,
    formData.username.length >= 3 ? { username: formData.username } : "skip",
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
      toast.error("Username and name are required");
      return;
    }

    if (!usernameAvailable) {
      toast.error("Username is not available");
      return;
    }

    try {
      await createProfile(formData);
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create profile",
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Set up your profile
        </h1>
        <p className="text-muted-foreground">
          Create your unique CV profile to get started
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-6"
      >
        <div>
          <Label className="mb-2">Username *</Label>
          <div className="relative">
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="your-username"
              required
            />
            {formData.username.length >= 3 && (
              <div className="absolute right-3 top-3">
                {isCheckingUsername ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-bone-400"></div>
                ) : usernameAvailable ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <span className="text-red-400">✗</span>
                )}
              </div>
            )}
          </div>
          {formData.username.length >= 3 && !isCheckingUsername && (
            <p
              className={`text-sm mt-1 ${usernameAvailable ? "text-green-400" : "text-red-400"}`}
            >
              {usernameAvailable ? "Username available" : "Username taken"}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Your profile will be available at /@{formData.username}
          </p>
        </div>

        <div>
          <Label className="mb-2">Full Name *</Label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <Label className="mb-2">Title</Label>
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
          <Label className="mb-2">Location</Label>
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
          <Label className="mb-2">Bio</Label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="Tell us about yourself..."
          />
        </div>

        <Button
          type="submit"
          disabled={!formData.username || !formData.name || !usernameAvailable}
          className="w-full"
        >
          Create Profile
        </Button>
      </form>
    </div>
  );
}
