"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { useNavigation } from "@/contexts/NavigationContext"
import { SkeletonRouter } from "@/components/layout/skeleton-router"

// Footer is always below the fold — defer its JS to reduce initial bundle
const Footer = dynamic(
  () => import("@/components/layout/footer").then((m) => m.Footer),
  { ssr: true }
)

const noNavPrefixRoutes = ["/placement-test", "/speaking-room/session", "/vocabulary-hub/", "/grammar-hub/", "/build-plan", "/auth", "/why-dailylang", "/how-it-works"]
const noNavExactRoutes = ["/"]

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isNavigating, targetPath } = useNavigation()

  // Decide which path governs navbar visibility:
  // when navigating, use the target path so skeleton appears with correct chrome
  const effectivePath = isNavigating && targetPath ? targetPath : pathname
  const shouldHideNav =
    noNavExactRoutes.includes(effectivePath) ||
    noNavPrefixRoutes.some((route) => effectivePath.startsWith(route))

  // Render skeleton for the target page during navigation
  const content = isNavigating && targetPath ? (
    <main className="min-h-screen">
      <SkeletonRouter targetPath={targetPath} />
    </main>
  ) : (
    children
  )

  if (shouldHideNav) {
    return <>{content}</>
  }

  return (
    <>
      <Navbar />
      {content}
      <Footer />
    </>
  )
}
