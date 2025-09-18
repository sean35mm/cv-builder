"use client";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInForm } from "@/components/sign-in-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Toaster } from "sonner";
import { ProfileEditor } from "@/components/profile-editor";
import { ProfileSetup } from "@/components/profile-setup";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border shadow-sm px-6">
        <h2 className="text-xl font-semibold text-foreground">CV Builder</h2>
        <Authenticated>
          <div className="flex items-center gap-4">
            <ViewProfileButton />
            <SignOutButton />
          </div>
        </Authenticated>
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster theme="light" />
    </div>
  );
}

function ViewProfileButton() {
  const profile = useQuery(api.profiles.getMyProfile);
  if (!profile || !profile.isPublic) return null;
  return (
    <a
      href={`/@${profile.username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-primary hover:text-primary font-medium transition-colors"
    >
      View Public Profile
    </a>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const profile = useQuery(api.profiles.getMyProfile);

  if (loggedInUser === undefined || profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bone-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Unauthenticated>
        <div className="max-w-md mx-auto mt-16 px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Build Your CV
            </h1>
            <p className="text-lg text-muted-foreground">
              Create a beautiful, shareable CV in minutes
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {!profile ? <ProfileSetup /> : <ProfileEditor profile={profile} />}
      </Authenticated>
    </div>
  );
}
