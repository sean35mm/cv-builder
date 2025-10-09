"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

type Props = { onClaim: () => void };

function normalize(raw: string) {
  const v = raw.replace(/^@+/, "").toLowerCase();
  return v.replace(/[^a-z0-9-]/g, "").slice(0, 15);
}

function isValid(u: string) {
  return /^[a-z0-9-]{3,15}$/.test(u);
}

export function UsernameClaim({ onClaim }: Props) {
  const [raw, setRaw] = useState("");
  const username = useMemo(() => normalize(raw), [raw]);
  const valid = isValid(username);
  const availability = useQuery(
    api.profiles.checkUsernameAvailable,
    valid ? { username } : "skip",
  );

  const shouldReduceMotion = useReducedMotion();
  const status =
    !valid || username.length < 3
      ? "idle"
      : availability === undefined
        ? "loading"
        : availability
          ? "available"
          : "taken";

  return (
    <div className="mx-auto w-full max-w-2xl px-1 sm:px-0">
      <div className="mb-4 text-sm font-medium tracking-wide text-muted-foreground">
        Secure your personal URL below
      </div>

      <div className="relative">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-2xl opacity-65 blur-xl"
          style={{
            background:
              "linear-gradient(120deg, hsl(var(--primary)), hsl(var(--secondary)))",
            backgroundSize: "200% 200%",
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
          }
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative rounded-2xl border border-border/60 bg-background/95 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.6)] backdrop-blur-xl focus-within:ring-2 focus-within:ring-primary/45">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_80%_at_50%_0%,hsla(var(--primary),0.25),transparent_70%)]" />
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-3">
            <div className="flex-none rounded-md bg-muted/80 px-3 py-2 text-xs font-mono uppercase tracking-[0.35em] text-foreground/80">
              opencv.app/@
            </div>
            <Input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="username"
              className="h-10 min-w-[220px] w-full flex-1 rounded-md border border-border bg-background text-base text-foreground placeholder:text-muted-foreground/60 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Desired username"
            />
            <Button
              size="sm"
              className="flex-none shrink-0 whitespace-nowrap px-5"
              disabled={status !== "available"}
              onClick={() => {
                if (status === "available") {
                  try {
                    sessionStorage.setItem("desiredUsername", username);
                  } catch {
                    // sessionStorage not available
                  }
                  onClaim();
                }
              }}
            >
              {status === "available" ? `Claim @${username}` : "Claim"}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground/80 sm:text-sm">
        This will be your public link:{" "}
        <span className="font-medium">opencv.app/@username</span>
      </p>

      <div className="mt-3 text-center">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Checking availability...
          </p>
        )}
        {status === "available" && (
          <p className="text-sm font-medium text-green-600">
            ✓ Username available
          </p>
        )}
        {status === "taken" && (
          <p className="text-sm font-medium text-red-600">✗ Username taken</p>
        )}
        {status === "idle" && username.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Username must be 3-15 characters using lowercase letters, numbers,
            or hyphens.
          </p>
        )}
      </div>
    </div>
  );
}
