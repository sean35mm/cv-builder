"use client";

import { SignInForm } from "@/components/sign-in-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Sign In to OpenCV</h1>
          <p className="text-muted-foreground mt-2">
            Access your account to build your CV
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
