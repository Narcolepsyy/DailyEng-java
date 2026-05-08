"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import dynamic from "next/dynamic"

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/speaking-room", label: "Speaking Room" },
  { href: "/vocabulary-hub", label: "Vocabulary Hub" },
  { href: "/grammar-hub", label: "Grammar Hub" },
  { href: "/notebook", label: "Notebook" },
  { href: "/translate", label: "Translate" },
  { href: "/study-plan", label: "Study Plan" },
]

const NavbarAuthSection = dynamic(
  () =>
    import("@/components/layout/navbar-auth-section").then((m) => ({
      default: m.NavbarAuthSection,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 rounded-xl bg-gray-100 animate-pulse hidden sm:block" />
        <div className="h-8 w-20 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    ),
  }
)

export function PublicNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-40 px-3 pt-3"
      aria-label="Public navigation"
    >
      <div
        className="mx-auto max-w-7xl rounded-2xl border border-primary-100/50 bg-[#F8FAFF]/90 shadow-lg shadow-primary-100/20 backdrop-blur-[20px]"
        style={{
          boxShadow:
            "0 4px 24px rgba(79, 70, 229, 0.04), 0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:px-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo.webp"
              alt="DailyEng Logo"
              width={32}
              height={32}
              className=""
              style={{ width: "auto", height: "auto" }}
              priority
            />
            <div className="flex items-center">
              <span className="text-xl sm:inline text-gray-800 tracking-tight">Daily</span>
              <span className="text-xl sm:inline text-primary-600 font-extrabold tracking-tight">Eng</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {publicNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[13.5px] px-3 py-1.5 rounded-xl font-semibold transition-all duration-300 ${isActive
                      ? "bg-primary-100 text-primary-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right Section: Auth / Profile */}
          <div className="flex items-center gap-2">
            <NavbarAuthSection />

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 pb-4 pt-3 space-y-1">
            {publicNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
