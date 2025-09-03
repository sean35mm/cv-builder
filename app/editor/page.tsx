"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProfileEditor } from "@/components/profile-editor";
import { ProfileSetup } from "@/components/profile-setup";

export default function EditorPage() {
  const profile = useQuery(api.profiles.getMyProfile);
  if (profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bone-400"></div>
      </div>
    );
  }
  return !profile ? <ProfileSetup /> : <ProfileEditor profile={profile} />;
}
