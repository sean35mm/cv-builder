'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, Trash2, Loader2 } from 'lucide-react';
import type { SectionId } from '@/lib/types';
import { DEFAULT_SECTIONS_ORDER } from '@/lib/types';

type VersionManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSectionsOrder: SectionId[];
  onLoadVersion: (version: {
    sectionsVisibility: Record<string, boolean>;
    sectionsOrder?: string[];
  }) => void;
};

export function VersionManager({
  open,
  onOpenChange,
  currentSectionsOrder,
  onLoadVersion,
}: VersionManagerProps) {
  const [newVersionName, setNewVersionName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const versions = useQuery(api.versions.getVersions);
  const createVersion = useMutation(api.versions.createVersion);
  const setDefaultVersion = useMutation(api.versions.setDefaultVersion);
  const deleteVersion = useMutation(api.versions.deleteVersion);

  const handleCreate = async () => {
    if (!newVersionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }

    setLoading('create');
    try {
      const sectionsVisibility: Record<string, boolean> = {};
      DEFAULT_SECTIONS_ORDER.forEach((section) => {
        sectionsVisibility[section] = true;
      });

      await createVersion({
        name: newVersionName.trim(),
        sectionsVisibility,
        sectionsOrder: currentSectionsOrder,
        makeDefault,
      });

      toast.success('Version created');
      setNewVersionName('');
      setMakeDefault(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create version'
      );
    } finally {
      setLoading(null);
    }
  };

  const handleLoad = async (versionId: string) => {
    setLoading(versionId);
    try {
      const version = await versions?.find((v) => v._id === versionId);
      if (version) {
        const details = await fetch(`/api/versions/${versionId}`).then((r) =>
          r.json()
        );
        if (details) {
          onLoadVersion({
            sectionsVisibility: details.sectionsVisibility,
            sectionsOrder: details.sectionsOrder,
          });
          toast.success('Version loaded');
          onOpenChange(false);
        }
      }
    } catch (error) {
      toast.error('Failed to load version');
    } finally {
      setLoading(null);
    }
  };

  const handleSetDefault = async (versionId: string) => {
    setLoading(`default-${versionId}`);
    try {
      await setDefaultVersion({ versionId });
      toast.success('Default version updated');
    } catch (error) {
      toast.error('Failed to set default');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm('Delete this version?')) return;

    setLoading(`delete-${versionId}`);
    try {
      await deleteVersion({ versionId });
      toast.success('Version deleted');
    } catch (error) {
      toast.error('Failed to delete version');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resume Versions</DialogTitle>
          <DialogDescription>
            Save different versions of your CV for different purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Create New Version</h4>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Software Engineer"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleCreate}
                disabled={loading === 'create' || !newVersionName.trim()}
              >
                {loading === 'create' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="makeDefault"
                checked={makeDefault}
                onCheckedChange={(c) => setMakeDefault(!!c)}
              />
              <Label htmlFor="makeDefault" className="text-sm">
                Set as public version
              </Label>
            </div>
          </div>

          {versions && versions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Saved Versions</h4>
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{version.name}</span>
                      {version.isDefault && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Check className="h-3 w-3" />
                          Public
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoad(version._id)}
                        disabled={loading === version._id}
                      >
                        {loading === version._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Load'
                        )}
                      </Button>
                      {!version.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(version._id)}
                          disabled={loading === `default-${version._id}`}
                        >
                          Set Public
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(version._id)}
                        disabled={loading === `delete-${version._id}`}
                        className="text-destructive hover:text-destructive"
                      >
                        {loading === `delete-${version._id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {versions && versions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No versions saved yet. Create your first version above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
