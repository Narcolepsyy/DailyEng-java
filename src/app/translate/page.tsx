"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { translateText } from "@/actions/translate";
import { Languages, ArrowRightLeft, Copy, Check, Loader2, Sparkles, ChevronDown, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SmartLensTab } from "./smart-lens-tab";

type Language = {
  code: string;
  label: string;
  flag: string;
  placeholder: string;
};

const AUTO_DETECT: Language = {
  code: "auto",
  label: "Detect Language",
  flag: "🌐",
  placeholder: "Type or paste text here...",
};

const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "🇺🇸", placeholder: "Type or paste English text here..." },
  { code: "ja", label: "Japanese", flag: "🇯🇵", placeholder: "日本語のテキストを入力してください..." },
  { code: "vi", label: "Vietnamese", flag: "🇻🇳", placeholder: "Nhập hoặc dán văn bản tiếng Việt..." },
];

const SOURCE_OPTIONS = [AUTO_DETECT, ...LANGUAGES];

type Tab = "text" | "smartlens";

export default function TranslatePage() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [fromLang, setFromLang] = useState<Language>(AUTO_DETECT);
  const [toLang, setToLang] = useState<Language>(LANGUAGES[1]); // Japanese
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  const MAX_CHARS = 5000;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(e.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(e.target as Node)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleTranslate = useCallback(
    async (text: string, from: Language, to: Language) => {
      if (!text.trim()) {
        setTranslatedText("");
        setDetectedLang(null);
        return;
      }

      setIsTranslating(true);
      setError(null);

      try {
        const result = await translateText({
          text: text.trim(),
          from: from.code === "auto" ? undefined : from.code,
          to: to.code,
        });
        setTranslatedText(result.translatedText);
        if (result.detectedLanguage) {
          setDetectedLang(result.detectedLanguage);
        }
      } catch (err) {
        setError("Translation failed. Please try again.");
        console.error("Translation error:", err);
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  const handleSourceChange = (value: string) => {
    if (value.length > MAX_CHARS) return;
    setSourceText(value);
    setCharCount(value.length);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setTranslatedText("");
      setDetectedLang(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleTranslate(value, fromLang, toLang);
    }, 500);
  };

  const handleSwapLanguages = () => {
    // Can't swap if source is auto-detect
    if (fromLang.code === "auto") {
      if (!detectedLang) return;
      // Use detected language as the new "to" language
      const detectedOption = LANGUAGES.find((l) => l.code === detectedLang);
      if (!detectedOption) return;
      setFromLang(toLang);
      setToLang(detectedOption);
    } else {
      const newFrom = toLang;
      const newTo = fromLang;
      setFromLang(newFrom);
      setToLang(newTo);
    }

    // Swap texts
    const oldTranslated = translatedText;
    setSourceText(oldTranslated);
    setTranslatedText(sourceText);
    setCharCount(oldTranslated.length);
    setDetectedLang(null);

    if (oldTranslated.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const newFrom = fromLang.code === "auto"
          ? toLang
          : toLang;
        const newTo = fromLang.code === "auto"
          ? (LANGUAGES.find((l) => l.code === detectedLang) || LANGUAGES[0])
          : fromLang;
        handleTranslate(oldTranslated, newFrom, newTo);
      }, 300);
    }
  };

  const handleSelectFromLang = (lang: Language) => {
    setFromLang(lang);
    setShowFromDropdown(false);
    setDetectedLang(null);

    // If same as target, swap target to something else
    if (lang.code !== "auto" && lang.code === toLang.code) {
      const alt = LANGUAGES.find((l) => l.code !== lang.code);
      if (alt) setToLang(alt);
    }

    if (sourceText.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        handleTranslate(sourceText, lang, toLang);
      }, 200);
    }
  };

  const handleSelectToLang = (lang: Language) => {
    setToLang(lang);
    setShowToDropdown(false);

    // If same as source, swap source
    if (fromLang.code !== "auto" && lang.code === fromLang.code) {
      const alt = LANGUAGES.find((l) => l.code !== lang.code);
      if (alt) setFromLang(alt);
    }

    if (sourceText.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        handleTranslate(sourceText, fromLang, lang);
      }, 200);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setCharCount(0);
    setError(null);
    setDetectedLang(null);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const detectedLangLabel = detectedLang
    ? LANGUAGES.find((l) => l.code === detectedLang)?.label || detectedLang
    : null;

  const isJapaneseFont = (code: string) => code === "ja";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Translate
            </span>
          </h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Text translation & image Smart Lens — all in one place
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-7 flex justify-center"
        >
          <div className="inline-flex rounded-2xl bg-gray-100/80 p-1.5 border border-gray-200/60 gap-1">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "text"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Text Translate
            </button>
            <button
              onClick={() => setActiveTab("smartlens")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "smartlens"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Camera className="h-4 w-4" />
              Smart Lens
            </button>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "smartlens" ? (
            <motion.div
              key="smartlens"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SmartLensTab />
            </motion.div>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
        {/* Language Selector Bar */}
        <div
          className="mb-4 flex items-center justify-center gap-3"
        >
          {/* From Language Dropdown */}
          <div className="relative" ref={fromDropdownRef}>
            <button
              onClick={() => { setShowFromDropdown(!showFromDropdown); setShowToDropdown(false); }}
              className="flex items-center gap-2 rounded-xl bg-white/80 border border-gray-200/60 px-4 py-2.5 shadow-sm backdrop-blur-sm hover:border-indigo-300 transition-colors cursor-pointer min-w-[160px]"
            >
              <span className="text-lg">{fromLang.flag}</span>
              <span className="font-semibold text-gray-700 text-sm sm:text-base flex-1 text-left">
                {fromLang.label}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showFromDropdown ? "rotate-180" : ""}`} />
            </button>
            {detectedLang && fromLang.code === "auto" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-5 left-0 text-[11px] font-medium text-indigo-500"
              >
                Detected: {detectedLangLabel}
              </motion.div>
            )}
            <AnimatePresence>
              {showFromDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 z-50 w-full min-w-[180px] rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
                >
                  {SOURCE_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectFromLang(lang)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                        fromLang.code === lang.code
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Swap Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", damping: 12 }}
            onClick={handleSwapLanguages}
            className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-2.5 text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-shadow cursor-pointer"
            aria-label="Swap languages"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </motion.button>

          {/* To Language Dropdown */}
          <div className="relative" ref={toDropdownRef}>
            <button
              onClick={() => { setShowToDropdown(!showToDropdown); setShowFromDropdown(false); }}
              className="flex items-center gap-2 rounded-xl bg-white/80 border border-gray-200/60 px-4 py-2.5 shadow-sm backdrop-blur-sm hover:border-purple-300 transition-colors cursor-pointer min-w-[160px]"
            >
              <span className="text-lg">{toLang.flag}</span>
              <span className="font-semibold text-gray-700 text-sm sm:text-base flex-1 text-left">
                {toLang.label}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showToDropdown ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showToDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 z-50 w-full min-w-[180px] rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectToLang(lang)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                        toLang.code === lang.code
                          ? "bg-purple-50 text-purple-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Translation Cards */}
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {/* Source */}
          <div className="group relative rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-indigo-200/60">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Source
                </span>
              </div>
              {sourceText && (
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(e) => handleSourceChange(e.target.value)}
              placeholder={fromLang.placeholder}
              className="w-full resize-none border-0 bg-transparent px-4 py-4 text-[15px] text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-0 min-h-[200px] sm:min-h-[260px]"
              style={{ fontFamily: isJapaneseFont(fromLang.code) ? "'Noto Sans JP', sans-serif" : "inherit" }}
            />
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
              <span
                className={`text-xs font-medium ${
                  charCount > MAX_CHARS * 0.9 ? "text-amber-500" : "text-gray-300"
                }`}
              >
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Translation */}
          <div className="relative rounded-2xl border border-gray-200/60 bg-gradient-to-br from-indigo-50/40 to-purple-50/30 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between border-b border-indigo-100/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Translation
                </span>
              </div>
              <div className="flex items-center gap-1">
                {translatedText && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={handleCopy}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-white/60 hover:text-gray-600 transition-all cursor-pointer"
                    aria-label="Copy translation"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Check className="h-4 w-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Copy className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>
            </div>

            <div className="min-h-[200px] sm:min-h-[260px] px-4 py-4 relative">
              <AnimatePresence mode="wait">
                {isTranslating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-indigo-400"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Translating...</span>
                  </motion.div>
                ) : error ? (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                ) : translatedText ? (
                  <motion.p
                    key="result"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: isJapaneseFont(toLang.code) ? "'Noto Sans JP', sans-serif" : "inherit" }}
                  >
                    {translatedText}
                  </motion.p>
                ) : (
                  <motion.p
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="text-[15px] text-gray-300 italic"
                  >
                    Translation will appear here...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-indigo-100/50 px-4 py-2">
              <span className="text-xs text-gray-300 font-medium">
                Powered by Azure Translator
              </span>
            </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Start typing to auto-translate · Max 5,000 characters · Swap languages with the arrow button</p>
          </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
