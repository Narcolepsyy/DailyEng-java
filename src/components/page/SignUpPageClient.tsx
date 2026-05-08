"use client";

import type React from "react";
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
  Check,
  Loader2,
  HelpCircle,
  Globe,
} from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AuthScene3D = dynamic(() => import("@/components/auth/AuthScene3D"), { ssr: false });

export interface SignUpPageClientProps {
  benefits: string[];
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength calculation
type PasswordStrength = {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  bgColor: string;
};

const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password || password.length < 8) {
    return {
      level: 0,
      label: "Too Short",
      color: "text-gray-400",
      bgColor: "bg-gray-200",
    };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Level 1: At least 8 chars (weak)
  if (!hasLetter || !hasNumber) {
    return {
      level: 1,
      label: "Weak",
      color: "text-error-500",
      bgColor: "bg-error-500",
    };
  }

  // Level 2: Has letters + numbers (fair - minimum acceptable)
  if (!hasUppercase) {
    return {
      level: 2,
      label: "Fair",
      color: "text-warning-500",
      bgColor: "bg-warning-500",
    };
  }

  // Level 3: Has letters + numbers + uppercase (good)
  if (!hasSpecial) {
    return {
      level: 3,
      label: "Good",
      color: "text-success-500",
      bgColor: "bg-success-500",
    };
  }

  // Level 4: Has all (strong)
  return {
    level: 4,
    label: "Strong",
    color: "text-primary-500",
    bgColor: "bg-primary-500",
  };
};

export default function SignUpPageClient({ benefits }: SignUpPageClientProps) {
  const router = useRouter();
  const { register } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Real-time validation states
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Computed validations
  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2 && trimmedName.length <= 50;
  const isEmailValid = emailRegex.test(email);
  const passwordStrength = getPasswordStrength(password);
  const isPasswordValid = passwordStrength.level >= 2; // Fair or above

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!isNameValid) {
      setError("Name must be between 2 and 50 characters");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must contain both letters and numbers");
      return;
    }

    startTransition(async () => {
      // Register auto-sets httpOnly cookies (auto-login)
      const result = await register(trimmedName, email, password);

      if (result.success) {
        // Full page reload to hydrate auth state everywhere
        window.location.href = "/speaking-room";
      } else {
        setError(result.error || "Đăng ký thất bại");
      }
    });
  };

  const isLoading = isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-gradient-to-b from-background to-primary-50/30">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 mb-4 shadow-lg shadow-primary-200">
              <Languages className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Create Account
            </h1>
            <p className="text-muted-foreground mt-2">
              Start your language learning journey today
            </p>
          </div>

          <Card className="p-8 border-2 border-primary-100 rounded-3xl shadow-xl shadow-primary-100/20 bg-white">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-error-50 border border-error-200 flex gap-3">
                <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  placeholder="John Doe"
                  className={`w-full mt-2 px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 transition-all ${
                    nameTouched && !isNameValid && name.length > 0
                      ? "border-error-300 focus:border-error-400 focus:ring-error-100"
                      : "border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  }`}
                  required
                  disabled={isLoading}
                />
                {nameTouched && !isNameValid && name.length > 0 && (
                  <p className="text-xs text-error-500 mt-1">
                    Name must be between 2 and 50 characters
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  className={`w-full mt-2 px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 transition-all ${
                    emailTouched && !isEmailValid && email.length > 0
                      ? "border-error-300 focus:border-error-400 focus:ring-error-100"
                      : "border-gray-200 focus:border-primary-400 focus:ring-primary-100"
                  }`}
                  required
                  disabled={isLoading}
                />
                {emailTouched && !isEmailValid && email.length > 0 && (
                  <p className="text-xs text-error-500 mt-1">
                    Please enter a valid email address (e.g., name@example.com)
                  </p>
                )}
              </div>

              {/* Password Field with Strength Indicator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="max-w-xs p-3 text-left"
                    >
                      <p className="font-semibold mb-2">
                        Password Requirements:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li
                          className={
                            password.length >= 8 ? "text-success-400" : ""
                          }
                        >
                          • At least 8 characters
                        </li>
                        <li
                          className={
                            /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
                              ? "text-success-400"
                              : ""
                          }
                        >
                          • Contains letters and numbers (minimum)
                        </li>
                        <li
                          className={
                            /[A-Z]/.test(password) ? "text-success-400" : ""
                          }
                        >
                          • Contains uppercase letter (recommended)
                        </li>
                        <li
                          className={
                            /[!@#$%^&*(),.?":{}|<>]/.test(password)
                              ? "text-success-400"
                              : ""
                          }
                        >
                          • Contains special character (strongest)
                        </li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-background focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      {/* Strength Bars */}
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              passwordStrength.level >= level
                                ? passwordStrength.bgColor
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      {/* Strength Label */}
                      <span
                        className={`text-xs font-medium ${passwordStrength.color}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
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
                    Đang tạo tài khoản...
                  </>
                ) : (
                  <>
                    Create Account
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
                  or sign up with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <GoogleAuthButton
                label="Continue with Google"
                disabled={isLoading}
                onError={setError}
              />
            </div>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-primary-500 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary-500 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-primary-500 hover:text-primary-600 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - 3D Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background behind 3D */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800" />

        {/* 3D Canvas */}
        <Suspense
          fallback={
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600">
                <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
              </div>
            </div>
          }
        >
          <AuthScene3D variant="signup" />
        </Suspense>

        {/* Glassmorphic text overlay */}
        <div className="auth-glass-overlay">
          <div className="flex flex-col justify-center h-full px-12 text-white">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Learn Languages
              <br />
              <span className="text-accent-300">The Smart Way</span>
            </h1>
            <p className="text-xl text-white/80 mb-4 max-w-md">
              Join our community and unlock your full potential with personalized
              learning.
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

            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-400 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-white/90">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
