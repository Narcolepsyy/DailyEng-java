"use client"

import type React from "react"
import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  Languages,
  ArrowRight,
  Loader2,
  Globe,
} from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const AuthScene3D = dynamic(() => import("@/components/auth/AuthScene3D"), { ssr: false });

export interface SignInStat {
  value: string;
  label: string;
}

export interface SignInPageClientProps {
  stats: SignInStat[];
}

export default function SignInPageClient({ stats }: SignInPageClientProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await login(email, password);

      if (result.success) {
        // Full page reload to hydrate auth state everywhere
        window.location.href = "/speaking-room";
      } else {
        setError(result.error || "Đăng nhập thất bại");
      }
    });
  };

  const isLoading = isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left side - 3D Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background behind 3D */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />

        {/* 3D Canvas */}
        <Suspense
          fallback={
            <div className="absolute inset-0">
              {/* Fallback gradient with floating icons (old design) */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
              </div>
            </div>
          }
        >
          <AuthScene3D variant="signin" />
        </Suspense>

        {/* Glassmorphic text overlay */}
        <div className="auth-glass-overlay">
          <div className="flex flex-col justify-center h-full px-12 text-white">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Master Languages
              <br />
              <span className="text-accent-200">Your Way</span>
            </h1>
            <p className="text-xl text-white/80 mb-4 max-w-md">
              Join thousands of learners improving their language skills with our
              AI-powered platform.
            </p>
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold border border-white/20">
                <Globe className="w-3.5 h-3.5" />
                English
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold border border-white/20">
                <Globe className="w-3.5 h-3.5" />
                Japanese
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((stat, index) => (
                <div key={index}>
                  <p className="text-4xl font-bold">{stat.value}</p>
                  <p className="text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gradient-to-b from-background to-primary-50/30">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 mb-4 shadow-lg shadow-primary-200">
              <Languages className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to continue your learning journey
            </p>
          </div>

          <Card className="p-8 border-2 border-primary-100 rounded-3xl shadow-xl shadow-primary-100/20 bg-white">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-error-50 border border-error-200 flex gap-3">
                <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-background focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-background focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                variant={"default"}
                className="w-full py-6 text-lg font-semibold bg-primary-500 hover:bg-primary-600 rounded-xl transition-all group"
                disabled={isLoading}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-muted-foreground">
                  or continue with
                </span>
              </div>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-1 gap-4">
              <GoogleAuthButton
                label="Continue with Google"
                disabled={isLoading}
                onError={setError}
              />
            </div>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-primary-500 hover:text-primary-600 font-semibold"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
