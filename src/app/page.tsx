"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Camera, Palette, ArrowRight, Wand2 } from "lucide-react";
import { Suspense, useState } from "react";
import { clearSessionImages } from "@/lib/session-image-store";

function HomeContent() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"camera" | "pure" | null>(null);
  const [privacyNoticeAccepted, setPrivacyNoticeAccepted] = useState(false);

  const handleSelectMode = async (mode: "camera" | "pure") => {
    if (!privacyNoticeAccepted) return;
    setSelectedMode(mode);
    await clearSessionImages();
    sessionStorage.clear();
    sessionStorage.setItem("userTheme", "fantasy");
    sessionStorage.setItem("privacyNoticeAcceptedAt", new Date().toISOString());

    if (mode === "camera") {
      router.push("/camera");
    } else {
      router.push("/prompt");
    }
  };

  // Soft white glow text shadow style for clear readability on watercolor background
  const whiteGlowStyle = {
    textShadow: "0 0 10px rgba(255, 255, 255, 0.95), 0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.6)",
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Soft Sky Watercolor Backdrop */}
      <img
        src="/ghibli-sky.jpg"
        alt="Sky background"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* Light warm wash overlay for soft fairytale mood */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-900/20"
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header with warm storybook badge and soft black text with white glow */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/90 border border-stone-200/90 text-stone-800 text-xs font-bold shadow-xs backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span style={whiteGlowStyle} className="tracking-wider">SPIRITED BOOTH · 따뜻한 마법 스케치북</span>
          </div>

          <h1 
            style={whiteGlowStyle}
            className="text-4xl md:text-5xl font-extrabold text-[#1F2937] tracking-tight font-display"
          >
            우리가족 상상스케치
          </h1>

          <p 
            style={whiteGlowStyle}
            className="mt-2 text-[#333333] text-base md:text-lg font-bold"
          >
            말로 그리는 우리 가족의 꿈
          </p>
        </div>

        {/* High-contrast Warm Glassmorphism Panel */}
        <div className="w-full rounded-[28px] border border-white/90 bg-white/88 p-6 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl sm:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center flex items-center justify-center text-stone-800">
            <Wand2 className="w-6 h-6 mr-2 text-amber-500" />
            어떤 마법으로 그림을 시작할까요?
          </h2>

          <label className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 p-4 text-sm leading-relaxed text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyNoticeAccepted}
              onChange={(event) => setPrivacyNoticeAccepted(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-sky-500"
            />
            <span>
              <strong className="text-stone-900">AI 처리 안내를 확인했습니다.</strong>
              <br />
              입력 문장과 선택한 경우의 촬영 사진은 그림 생성을 위해 Google
              Gemini로 전송됩니다. 촬영 원본과 중간 이미지는 이 기기에 임시
              저장되며, 2분간 조작이 없으면 자동 삭제됩니다.
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Webcam Photo Synthesis */}
            <button
              onClick={() => handleSelectMode("camera")}
              disabled={!privacyNoticeAccepted}
              className={`relative overflow-hidden group flex flex-col items-center p-7 rounded-3xl border-2 text-center transition-all duration-300 cursor-pointer ${
                selectedMode === "camera"
                  ? "border-amber-400 bg-amber-50/90 scale-[1.02] shadow-[0_8px_24px_rgba(245,158,11,0.2)]"
                  : "border-amber-100 bg-white/85 hover:bg-white hover:border-amber-400/80 hover:scale-[1.02] shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              }`}
            >
              {/* Pastel Pill Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full border border-rose-200/80 shadow-xs">
                인기 최고 ⭐
              </div>

              {/* High-quality Gradient Circle Shape Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 p-0.5 shadow-md flex items-center justify-center mb-5 group-hover:scale-108 transition-transform duration-300">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-inner">
                  <Camera className="w-9 h-9 text-white drop-shadow-sm" />
                </div>
              </div>

              <h3 className="text-xl font-extrabold mb-2 text-stone-800 group-hover:text-amber-700 transition-colors">
                내 얼굴 넣고 그리기
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-6 font-medium">
                카메라로 사진을 찍어 내 얼굴과 포즈가 그대로 살아있는 마법 동화 일러스트를 만들어요!
              </p>
              
              <span className="mt-auto inline-flex items-center px-5 py-2.5 rounded-full bg-amber-100/80 text-amber-900 font-bold text-sm border border-amber-200/80 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all shadow-xs">
                사진 찍고 시작하기
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Option 2: Pure Imagination Art */}
            <button
              onClick={() => handleSelectMode("pure")}
              disabled={!privacyNoticeAccepted}
              className={`relative overflow-hidden group flex flex-col items-center p-7 rounded-3xl border-2 text-center transition-all duration-300 cursor-pointer ${
                selectedMode === "pure"
                  ? "border-sky-400 bg-sky-50/90 scale-[1.02] shadow-[0_8px_24px_rgba(56,189,248,0.2)]"
                  : "border-stone-200/80 bg-white/85 hover:bg-white hover:border-sky-400/80 hover:scale-[1.02] shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              }`}
            >
              {/* Pastel Pill Badge */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold rounded-full border border-sky-200/80 shadow-xs">
                빠르고 간편 🚀
              </div>

              {/* High-quality Gradient Circle Shape Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 via-teal-300 to-emerald-400 p-0.5 shadow-md flex items-center justify-center mb-5 group-hover:scale-108 transition-transform duration-300">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center shadow-inner">
                  <Palette className="w-9 h-9 text-white drop-shadow-sm" />
                </div>
              </div>

              <h3 className="text-xl font-extrabold mb-2 text-stone-800 group-hover:text-sky-700 transition-colors">
                순수 상상화 그리기
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-6 font-medium">
                사진 촬영 없이, AI가 상상한 신비로운 판타지 세계와 아름다운 동화 풍경을 자유롭게 그려요!
              </p>

              <span className="mt-auto inline-flex items-center px-5 py-2.5 rounded-full bg-sky-100/80 text-sky-900 font-bold text-sm border border-sky-200/80 group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500 transition-all shadow-xs">
                바로 상상화 그리기
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-stone-800 font-bold bg-white/80 px-6 py-3 rounded-full backdrop-blur-md">마법 스케치북을 여는 중...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
