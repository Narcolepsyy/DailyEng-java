"use client"

import { useGoogleLogin } from "@react-oauth/google"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface GoogleAuthButtonProps {
  label?: string
  disabled?: boolean
  onError?: (error: string) => void
}

/**
 * Shared Google OAuth button for sign-in and sign-up pages.
 * Uses Google Identity Services to get a credential,
 * then calls the backend /auth/google endpoint via useAuth().
 */
export function GoogleAuthButton({
  label = "Continue with Google",
  disabled = false,
  onError,
}: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuth()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const hasClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  let useGoogleLoginHook: () => void;
  try {
    useGoogleLoginHook = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        setIsPending(true)
        try {
          const result = await loginWithGoogle(tokenResponse.access_token)
          if (result.success) {
            window.location.href = "/"
          } else {
            onError?.(result.error || "Google sign-in failed")
          }
        } catch {
          onError?.("Google sign-in failed. Please try again.")
        } finally {
          setIsPending(false)
        }
      },
      onError: () => {
        onError?.("Google sign-in was cancelled or failed.")
      },
    });
  } catch (err) {
    useGoogleLoginHook = () => {
      onError?.("Google sign-in is not configured on this environment.")
    };
  }

  const googleLogin = useGoogleLoginHook;

  if (!hasClientId) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="py-5 rounded-xl border-2 hover:bg-gray-50 transition-colors bg-transparent w-full"
      onClick={() => googleLogin()}
      disabled={disabled || isPending}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : (
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {label}
    </Button>
  )
}
