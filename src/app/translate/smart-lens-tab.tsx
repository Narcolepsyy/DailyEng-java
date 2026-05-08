"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { analyzeImage, SmartLensLine } from "@/actions/smartlens";
import {
  Upload, Camera, Loader2, ChevronDown, Copy, Check, X,
  ImageIcon, Video, CameraIcon, SwitchCamera, Eye, EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Language = { code: string; label: string; flag: string };
type Mode = "camera" | "upload";

const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "vi", label: "Vietnamese", flag: "🇻🇳" },
];

export function SmartLensTab() {
  const [mode, setMode] = useState<Mode>("camera");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [lines, setLines] = useState<SmartLensLine[]>([]);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [translatedFullText, setTranslatedFullText] = useState("");
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [imgDisplaySize, setImgDisplaySize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const MAX_SIZE = 4 * 1024 * 1024;

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new ResizeObserver(() => {
      if (imgRef.current)
        setImgDisplaySize({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [imagePreview]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowLangDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { return () => stopCamera(); }, []);
  useEffect(() => { if (mode === "upload") stopCamera(); }, [mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraActive(true);
    } catch {
      setCameraError("Unable to access camera. Check permissions or use image upload.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const switchCamera = async () => {
    stopCamera();
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCameraActive(true);
      } catch {}
    }, 100);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      setImagePreview(canvas.toDataURL("image/jpeg", 0.9));
      setImageFile(file);
      stopCamera();
      doAnalyze(file, targetLang.code);
    }, "image/jpeg", 0.9);
  }, [targetLang]);

  const doAnalyze = async (file: File, to: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeImage(file, to);
      setLines(result.lines || []);
      setTranslatedFullText(result.translatedFullText || "");
      if (result.detectedLanguage) setDetectedLang(result.detectedLanguage);
      if (result.message && result.lines.length === 0) setError(result.message);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > MAX_SIZE) { setError("Image must be under 4MB"); return; }
    setError(null); setImageFile(file); setLines([]); setTranslatedFullText(""); setDetectedLang(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    doAnalyze(file, targetLang.code);
  }, [targetLang]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file);
  };

  const handleTargetLangChange = (lang: Language) => {
    setTargetLang(lang); setShowLangDropdown(false);
    if (imageFile) doAnalyze(imageFile, lang.code);
  };

  const handleCopy = async () => {
    if (!translatedFullText) return;
    await navigator.clipboard.writeText(translatedFullText);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setImagePreview(null); setImageFile(null); setLines([]); setTranslatedFullText("");
    setError(null); setDetectedLang(null);
    setImgNaturalSize({ w: 0, h: 0 }); setImgDisplaySize({ w: 0, h: 0 });
  };

  const handleRetake = () => { handleClear(); startCamera(); };

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
      setImgDisplaySize({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    }
  };

  const getRenderedImageRect = () => {
    const { w: nw, h: nh } = imgNaturalSize;
    const { w: cw, h: ch } = imgDisplaySize;
    if (!nw || !nh || !cw || !ch) return { renderedW: 0, renderedH: 0, offsetX: 0, offsetY: 0, sx: 1, sy: 1 };
    const imgAspect = nw / nh, containerAspect = cw / ch;
    let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
    if (imgAspect > containerAspect) {
      renderedW = cw; renderedH = cw / imgAspect; offsetX = 0; offsetY = (ch - renderedH) / 2;
    } else {
      renderedH = ch; renderedW = ch * imgAspect; offsetX = (cw - renderedW) / 2; offsetY = 0;
    }
    return { renderedW, renderedH, offsetX, offsetY, sx: renderedW / nw, sy: renderedH / nh };
  };

  const { renderedW, renderedH, offsetX, offsetY, sx: scaleX, sy: scaleY } = getRenderedImageRect();
  const detectedLangLabel = detectedLang ? LANGUAGES.find((l) => l.code === detectedLang)?.label || detectedLang : null;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Controls Row */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
        {/* Mode Toggle */}
        <div className="inline-flex rounded-xl bg-gray-100/80 p-1 border border-gray-200/50">
          <button onClick={() => setMode("camera")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${mode === "camera" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Video className="h-4 w-4" /> Live Camera
          </button>
          <button onClick={() => setMode("upload")} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${mode === "upload" ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Upload className="h-4 w-4" /> Image Upload
          </button>
        </div>

        {/* Language Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowLangDropdown(!showLangDropdown)} className="flex items-center gap-2 rounded-xl bg-white/80 border border-gray-200/60 px-4 py-2 shadow-sm backdrop-blur-sm hover:border-teal-300 transition-colors cursor-pointer min-w-[150px]">
            <span className="text-lg">{targetLang.flag}</span>
            <span className="font-semibold text-gray-700 text-sm flex-1 text-left">{targetLang.label}</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showLangDropdown ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showLangDropdown && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-1.5 z-50 w-full min-w-[170px] rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden">
                {LANGUAGES.map((lang) => (
                  <button key={lang.code} onClick={() => handleTargetLangChange(lang)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${targetLang.code === lang.code ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"}`}>
                    <span className="text-base">{lang.flag}</span><span>{lang.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {lines.length > 0 && (
          <>
            <button onClick={() => setShowOverlay(!showOverlay)} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all cursor-pointer border ${showOverlay ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-gray-500 border-gray-200 hover:text-gray-700"}`}>
              {showOverlay ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Overlay
            </button>
            <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </>
        )}

        {detectedLang && (
          <span className="text-xs font-medium text-teal-500 bg-teal-50 px-2.5 py-1 rounded-full">
            Detected: {detectedLangLabel}
          </span>
        )}
      </div>

      {/* Main Image Area */}
      <AnimatePresence mode="wait">
        {imagePreview ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative rounded-2xl border border-gray-200/60 bg-white/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {mode === "camera" ? "Captured" : "Uploaded"}{lines.length > 0 && ` · ${lines.length} text regions found`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {mode === "camera" && (
                  <button onClick={handleRetake} className="text-xs text-teal-500 hover:text-teal-700 font-semibold px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer">Retake</button>
                )}
                <button onClick={handleClear} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div ref={containerRef} className="relative inline-block w-full">
              <img ref={imgRef} src={imagePreview} alt="Analyzed image" className="w-full max-h-[600px] object-contain bg-gray-50" onLoad={handleImageLoad} />
              {showOverlay && lines.length > 0 && imgNaturalSize.w > 0 && (
                <div className="absolute pointer-events-none" style={{ width: `${renderedW}px`, height: `${renderedH}px`, left: `${offsetX}px`, top: `${offsetY}px` }}>
                  {lines.map((line, idx) => {
                    if (!line.boundingPolygon || line.boundingPolygon.length < 4) return null;
                    const xs = line.boundingPolygon.map((p) => p.x);
                    const ys = line.boundingPolygon.map((p) => p.y);
                    const left = Math.min(...xs) * scaleX;
                    const top = Math.min(...ys) * scaleY;
                    const width = (Math.max(...xs) - Math.min(...xs)) * scaleX;
                    const height = (Math.max(...ys) - Math.min(...ys)) * scaleY;
                    const fontSize = Math.max(7, Math.min(height * 0.65, 18));
                    return (
                      <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }} className="absolute flex items-start" style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, minHeight: `${height}px`, padding: "1px 2px" }}>
                        <div className="absolute inset-0 backdrop-blur-[1px]" style={{ backgroundColor: "rgba(255,255,255,0.92)" }} />
                        <span className="relative z-10 font-semibold leading-tight w-full" style={{ fontSize: `${fontSize}px`, color: "#1a56db", lineHeight: 1.2, wordBreak: "break-word" }}>{line.translated}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-3 bg-white/90 rounded-2xl px-6 py-4 shadow-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    <span className="text-sm font-semibold text-gray-700">Analyzing image...</span>
                  </div>
                </div>
              )}
            </div>
            {error && <div className="border-t border-gray-100 px-4 py-2"><span className="text-xs text-amber-500 font-medium">{error}</span></div>}
          </motion.div>
        ) : mode === "camera" ? (
          <motion.div key="camera" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative rounded-2xl border border-gray-200/60 bg-black overflow-hidden min-h-[400px]">
            {cameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full min-h-[400px] object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-6 border-2 border-white/30 rounded-xl" />
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                  <button onClick={switchCamera} className="rounded-full bg-black/40 backdrop-blur-sm p-3 text-white hover:bg-black/60 cursor-pointer"><SwitchCamera className="h-5 w-5" /></button>
                  <button onClick={captureFrame} className="rounded-full bg-white w-16 h-16 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer border-4 border-teal-400"><CameraIcon className="h-7 w-7 text-teal-600" /></button>
                  <button onClick={stopCamera} className="rounded-full bg-black/40 backdrop-blur-sm p-3 text-white hover:bg-black/60 cursor-pointer"><X className="h-5 w-5" /></button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-900 to-gray-800">
                {cameraError ? (
                  <div className="text-center px-8">
                    <div className="rounded-2xl bg-red-500/10 p-4 mb-4 inline-block"><Camera className="h-8 w-8 text-red-400" /></div>
                    <p className="text-sm text-red-300 mb-4 max-w-xs">{cameraError}</p>
                    <button onClick={startCamera} className="px-5 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 cursor-pointer">Try Again</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <div className="rounded-2xl bg-teal-500/20 p-5 mb-5 inline-block"><Camera className="h-10 w-10 text-teal-400" /></div>
                    </motion.div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">Point your camera at text</p>
                    <p className="text-xs text-gray-500 mb-5">Signs, menus, documents, labels...</p>
                    <button onClick={startCamera} className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg cursor-pointer">Start Camera</button>
                  </div>
                )}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 min-h-[400px] transition-all cursor-pointer ${isDragOver ? "border-teal-400 bg-teal-50/50 scale-[1.01]" : "border-gray-300/60 bg-white/50 hover:border-teal-300 hover:bg-teal-50/20"}`}>
            <div className="rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 p-4 mb-4"><Upload className="h-8 w-8 text-teal-500" /></div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Drop an image here or click to upload</p>
            <p className="text-xs text-gray-400">JPEG, PNG, BMP, GIF, TIFF · Max 4MB</p>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />

      <div className="mt-6 text-center text-xs text-gray-400">
        <p>{mode === "camera" ? "Point camera at text, signs, menus, or labels · Capture to analyze" : "Drag & drop or click to upload · Supports photos, screenshots, menus, signs · Max 4MB"}</p>
      </div>
    </div>
  );
}
