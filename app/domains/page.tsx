'use client';

import { useAction, useQuery } from 'convex/react';
import Link from 'next/link';
import { ArrowLeft, Copy, Loader2, RefreshCw, Trash2 } from 'lucide-react';
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
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Loading custom domain settings"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />
      </main>
    );
  }

  const domain = management.domain;
  return (
    <main
      className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 md:py-12"
      data-route-landmark="domains"
    >
      <div className="space-y-6">
        <Link
          href="/publish"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Publish
        </Link>
        <PageHeading
          title="Custom domain"
          description="Connect one hostname to your profile and verify its DNS status."
        />

        {!management.enabled ? (
          <section
            className="rounded-lg border border-border bg-secondary p-6 sm:p-8"
            aria-labelledby="domain-disabled-title"
          >
            <p className="text-sm font-medium text-muted-foreground">
              Unavailable
            </p>
            <h2 id="domain-disabled-title" className="mt-3 font-medium">
              Custom domains are not enabled.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This feature is disabled by default for this deployment.
            </p>
          </section>
        ) : !domain ? (
          <form
            className="space-y-5 rounded-lg border border-border bg-card p-6 sm:p-8"
            aria-busy={Boolean(pending)}
            onSubmit={(event) => {
              event.preventDefault();
              void run('claim', () => claim({ hostname }));
            }}
          >
            <div>
              <h2 className="text-xl font-semibold">Connect a hostname</h2>
            </div>
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
          <section
            className="space-y-6 border-y border-border py-6 sm:py-8"
            aria-busy={Boolean(pending)}
            aria-labelledby="connected-domain-title"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Connected address
                </p>
                <h2 id="connected-domain-title" className="mt-3 font-medium">
                  {domain.displayHostname}
                </h2>
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
                  className="text-sm text-accent underline-offset-4 hover:underline"
                >
                  Visit domain
                </a>
              )}
            </div>

            {domain.txt && (
              <div className="space-y-4 rounded border border-border bg-secondary p-5">
                <p className="text-sm">{domain.txt.instructions}</p>
                {[
                  ['TXT name', domain.txt.name],
                  ['TXT value', domain.txt.value],
                ].map(([label, value]) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <div className="mt-1 flex gap-2">
                      <code className="min-w-0 flex-1 break-all rounded border border-border bg-background p-3 text-xs">
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
