'use client';

import { useAction, useQuery } from 'convex/react';
import { Copy, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import { PageHeading } from '@/components/platform/page-heading';

const statusLabels: Record<string, string> = {
  pending_dns: 'Waiting for DNS proof',
  pending_provider: 'Attaching to Vercel',
  pending_verification: 'Waiting for provider verification',
  active: 'Active',
  misconfigured: 'DNS configuration needs attention',
  reconciling: 'Checking provider state',
  removing: 'Removing',
  remove_failed: 'Removal needs retry',
  removed: 'Removed',
};

export default function DomainsPage() {
  const management = useQuery(api.customDomains.getMine);
  const claim = useAction(api.customDomainsNode.claim);
  const verify = useAction(api.customDomainsNode.verifyAndAttach);
  const refresh = useAction(api.customDomainsNode.refresh);
  const remove = useAction(api.customDomainsNode.remove);
  const [hostname, setHostname] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const run = async (label: string, operation: () => Promise<unknown>) => {
    setPending(label);
    try {
      await operation();
      toast.success('Domain status updated');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      toast.error(
        code.includes('DNS_PROOF_NOT_FOUND')
          ? 'The exact TXT proof was not found yet'
          : code.includes('RATE_LIMITED')
            ? 'Too many attempts. Please try again later.'
            : 'Unable to update the domain. Please try again.'
      );
    } finally {
      setPending(null);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success('Copied');
  };

  if (management === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const domain = management.domain;
  return (
    <main className="platform-page min-h-screen" data-route-landmark="domains">
      <div className="space-y-6">
        <PageHeading
          index="07 / Address"
          title="Custom domain"
          description="Connect one exact hostname to your profile. DNS verification and TLS provisioning may take time."
        />

        {!management.enabled ? (
          <section className="border-y bg-card py-6">
            <p className="font-medium">Custom domains are not enabled.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This feature is disabled by default for this deployment.
            </p>
          </section>
        ) : !domain ? (
          <form
            className="space-y-4 border-y bg-card py-6"
            onSubmit={(event) => {
              event.preventDefault();
              void run('claim', () => claim({ hostname }));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Hostname</Label>
              <Input
                id="custom-domain"
                value={hostname}
                onChange={(event) => setHostname(event.target.value)}
                placeholder="portfolio.example.com"
                autoComplete="url"
                required
                disabled={Boolean(pending)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a hostname only—no scheme, path, port, IP address, or
                wildcard.
              </p>
            </div>
            <Button type="submit" disabled={Boolean(pending)}>
              {pending === 'claim' && <Loader2 className="animate-spin" />}
              Claim hostname
            </Button>
          </form>
        ) : (
          <section className="space-y-5 border-y bg-card py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{domain.displayHostname}</p>
                {domain.displayHostname !== domain.hostname && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {domain.hostname}
                  </p>
                )}
                <p className="mt-2 text-sm" role="status">
                  {statusLabels[domain.status] ?? 'Status unavailable'}
                </p>
                {domain.lastErrorCode && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {domain.lastErrorCode}
                  </p>
                )}
              </div>
              {domain.status === 'active' && (
                <a
                  href={`https://${domain.hostname}/`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Visit domain
                </a>
              )}
            </div>

            {domain.txt && (
              <div className="space-y-3 border-y py-4">
                <p className="text-sm">{domain.txt.instructions}</p>
                {[
                  ['TXT name', domain.txt.name],
                  ['TXT value', domain.txt.value],
                ].map(([label, value]) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <div className="mt-1 flex gap-2">
                      <code className="min-w-0 flex-1 break-all border bg-muted p-2 text-xs">
                        {value}
                      </code>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label={`Copy ${label}`}
                        onClick={() => void copy(value)}
                      >
                        <Copy />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => void run('verify', () => verify({}))}
                >
                  {pending === 'verify' && <Loader2 className="animate-spin" />}
                  Verify DNS and attach
                </Button>
              </div>
            )}

            {!domain.txt && domain.status !== 'removed' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(pending)}
                  onClick={() => void run('refresh', () => refresh({}))}
                >
                  <RefreshCw
                    className={pending === 'refresh' ? 'animate-spin' : ''}
                  />
                  Refresh status
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={Boolean(pending)}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Remove this hostname? Routing stops immediately, but ownership remains reserved until Vercel confirms removal.'
                      )
                    ) {
                      void run('remove', () => remove({}));
                    }
                  }}
                >
                  <Trash2 /> Remove domain
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
