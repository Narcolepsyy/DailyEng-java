"use client"

import { useAppStore } from "@/lib/store"
import { useTranslation } from "@/hooks/use-translation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

import { useState, useEffect } from "react"

export function LanguageSwitcher() {
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayLang = mounted ? language : "en"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center">
        <Languages className="h-5 w-5" />
        <span className="sr-only">{t("common.language")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`cursor-pointer ${displayLang === "en" ? "bg-primary-50 text-primary-600 font-semibold" : ""}`}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("vi")}
          className={`cursor-pointer ${displayLang === "vi" ? "bg-primary-50 text-primary-600 font-semibold" : ""}`}
        >
          Tiếng Việt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
