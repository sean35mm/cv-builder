import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ProfilePreview } from "./profile-preview";
import { Doc } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface ProfileEditorProps {
  profile: Doc<"profiles">;
}

// Inline MonthInput using shadcn Calendar storing value as YYYY-MM
function MonthInput({
  value,
  onChange,
  disabled,
  placeholder = "Select month",
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const parse = (v: string | undefined): Date | undefined => {
    if (!v) return undefined;
    const [y, m] = v.split("-");
    const year = Number(y);
    const month = Number(m);
    if (!year || !month) return undefined;
    return new Date(year, month - 1, 1);
  };
  const toYMM = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };
  const label = (v: string | undefined): string => {
    const d = parse(v);
    if (!d) return placeholder;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  const selected = parse(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          type="button"
          className="justify-start w-full"
        >
          {label(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <div className="p-2">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) onChange(toYMM(d));
            }}
            captionLayout="dropdown"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onChange("")}>
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    title: profile.title || "",
    location: profile.location || "",
    bio: profile.bio || "",
    email: profile.email || "",
    website: profile.website || "",
    github: profile.github || "",
    linkedin: profile.linkedin || "",
    twitter: profile.twitter || "",
    experience: profile.experience,
    education: profile.education,
    skills: profile.skills,
    isPublic: profile.isPublic,
    sectionsOrder: (profile as any).sectionsOrder || [
      "header",
      "bio",
      "contact",
      "experience",
      "education",
      "skills",
    ],
  });

  const [activeTab, setActiveTab] = useState<
    "basic" | "experience" | "education" | "skills"
  >("basic");
  const [newSkill, setNewSkill] = useState("");

  const updateProfile = useMutation(api.profiles.updateProfile);
  const [layoutDirty, setLayoutDirty] = useState(false);

  const handleSave = async (): Promise<void> => {
    try {
      await updateProfile(formData as any);
      toast.success("Profile updated successfully!");
      setLayoutDirty(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const addExperience = (): void => {
    const newExp = {
      id: Date.now().toString(),
      role: "",
      company: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    setFormData({
      ...formData,
      experience: [...formData.experience, newExp],
    });
  };

  const updateExperience = (
    id: string,
    field: string,
    value: unknown,
  ): void => {
    setFormData({
      ...formData,
      experience: formData.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp,
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
      degree: "",
      school: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
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
        edu.id === id ? { ...edu, [field]: value } : edu,
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
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string): void => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Editor Panel */}
      <div className="w-1/2 border-r border overflow-y-auto bg-card">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Edit Profile</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isPublic}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, isPublic: Boolean(v) })
                  }
                />
                <span className="text-sm text-muted-foreground">Public</span>
              </label>
              <Button
                onClick={() => {
                  void handleSave();
                }}
              >
                Save
              </Button>
            </div>
          </div>

          {formData.isPublic && (
            <div className="mb-6 p-4 bg-secondary border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Your profile is public at:{" "}
                <a
                  href={`/@${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline text-primary hover:text-primary"
                >
                  /@{profile.username}
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                This URL is server-rendered for fast loading and optimal SEO.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border mb-6">
            {[
              { id: "basic", label: "Basic Info" },
              { id: "experience", label: "Experience" },
              { id: "education", label: "Education" },
              { id: "skills", label: "Skills" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-none border-b-2 ${
                  activeTab === tab.id ? "border-primary" : "border-transparent"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2">Name</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                />
              </div>

              <div>
                <Label className="mb-2">Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div>
                <Label className="mb-2">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2">Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2">GitHub</Label>
                <Input
                  type="text"
                  value={formData.github}
                  onChange={(e) =>
                    setFormData({ ...formData, github: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2">LinkedIn</Label>
                <Input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-2">Twitter</Label>
                <Input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) =>
                    setFormData({ ...formData, twitter: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-foreground">
                  Experience
                </h3>
                <Button onClick={addExperience}>Add Experience</Button>
              </div>

              {formData.experience.map((exp) => (
                <div key={exp.id} className="border rounded-xl p-5 bg-card">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-foreground">
                      Experience Entry
                    </h4>
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 text-sm"
                      onClick={() => removeExperience(exp.id)}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="mb-1">Role</Label>
                      <Input
                        type="text"
                        value={exp.role}
                        onChange={(e) =>
                          updateExperience(exp.id, "role", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1">Company</Label>
                      <Input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(exp.id, "company", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="mb-1">Start Date</Label>
                      <MonthInput
                        value={exp.startDate}
                        onChange={(v) =>
                          updateExperience(exp.id, "startDate", v)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1">End Date</Label>
                      <MonthInput
                        value={exp.endDate || ""}
                        onChange={(v) => updateExperience(exp.id, "endDate", v)}
                        disabled={exp.current}
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <Checkbox
                      checked={exp.current}
                      onCheckedChange={(v) =>
                        updateExperience(exp.id, "current", Boolean(v))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      Current position
                    </span>
                  </div>

                  <div>
                    <Label className="mb-1">Description</Label>
                    <Textarea
                      value={exp.description || ""}
                      onChange={(e) =>
                        updateExperience(exp.id, "description", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-foreground">
                  Education
                </h3>
                <Button onClick={addEducation}>Add Education</Button>
              </div>

              {formData.education.map((edu) => (
                <div key={edu.id} className="border rounded-xl p-5 bg-card">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-foreground">
                      Education Entry
                    </h4>
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 text-sm"
                      onClick={() => removeEducation(edu.id)}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="mb-1">Degree</Label>
                      <Input
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(edu.id, "degree", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1">School</Label>
                      <Input
                        type="text"
                        value={edu.school}
                        onChange={(e) =>
                          updateEducation(edu.id, "school", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="mb-1">Start Date</Label>
                      <MonthInput
                        value={edu.startDate}
                        onChange={(v) =>
                          updateEducation(edu.id, "startDate", v)
                        }
                      />
                    </div>
                    <div>
                      <Label className="mb-1">End Date</Label>
                      <MonthInput
                        value={edu.endDate || ""}
                        onChange={(v) => updateEducation(edu.id, "endDate", v)}
                        disabled={edu.current}
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <Checkbox
                      checked={edu.current}
                      onCheckedChange={(v) =>
                        updateEducation(edu.id, "current", Boolean(v))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      Currently studying
                    </span>
                  </div>

                  <div>
                    <Label className="mb-1">Description</Label>
                    <Textarea
                      value={edu.description || ""}
                      onChange={(e) =>
                        updateEducation(edu.id, "description", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Skills
                </h3>

                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill..."
                  />
                  <Button onClick={addSkill}>Add</Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      <span>{skill}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2 text-muted-foreground hover:text-red-500"
                        onClick={() => removeSkill(skill)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-1/2 bg-background overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground">
              Live Preview
            </h3>
            {layoutDirty && (
              <Button
                onClick={() => {
                  void handleSave();
                }}
              >
                Save
              </Button>
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
            showDragHandles={true}
          />
        </div>
      </div>
    </div>
  );
}
