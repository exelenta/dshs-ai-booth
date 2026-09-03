"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Camera, Palette, ArrowRight, Wand2 } from "lucide-react";
import { Suspense, useState } from "react";

function HomeContent() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"camera" | "pure" | null>(null);

  const handleSelectMode = (mode: "camera" | "pure") => {
    setSelectedMode(mode);
    sessionStorage.setItem("userTheme", "fantasy");

    if (mode === "camera") {
      router.push("/camera");
    } else {
      sessionStorage.removeItem("capturedImage");
      router.push("/prompt");
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Ghibli sky backdrop */}
      <img
        src="/ghibli-sky.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* warm wash overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="mb-2 flex items-center justify-center gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white drop-shadow">
            <Sparkles className="h-3.5 w-3.5" />
            Spirited Booth
          </p>
          <h1 className="font-bold text-3xl md:text-4xl text-white drop-shadow-lg">
            우리가족 상상스케치
          </h1>
          <p className="mt-2 text-white/80 text-base md:text-lg drop-shadow">
            말로 그리는 우리 가족의 꿈
          </p>
        </div>

        {/* Glass card */}
        <div className="w-full rounded-[2rem] border border-white/50 bg-white/20 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center flex items-center justify-center text-white drop-shadow">
            <Wand2 className="w-6 h-6 mr-2 text-amber-300" />
            어떻게 AI 그림을 그려볼까요?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Webcam Photo Synthesis */}
            <button
              onClick={() => handleSelectMode("camera")}
              className={`relative overflow-hidden group flex flex-col items-center p-7 rounded-2xl border-2 text-center transition-all duration-300 cursor-pointer ${
                selectedMode === "camera"
                  ? "border-amber-400 bg-amber-400/20 scale-[1.02] shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                  : "border-white/30 bg-white/10 hover:bg-white/20 hover:border-amber-400/60 hover:scale-[1.02]"
              }`}
            >
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-xs font-bold rounded-full shadow-md text-white">
                인기 최고 ⭐
              </div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 transition-transform">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-2 text-white group-hover:text-amber-200 transition-colors drop-shadow">
                내 얼굴 넣고 그리기
              </h3>
              <p className="text-white/75 text-sm leading-relaxed mb-5">
                웹캠으로 사진을 찍어 내 얼굴이 주인공인 멋진 AI 일러스트를 만들어요!
              </p>
              <span className="mt-auto inline-flex items-center px-5 py-2 rounded-full bg-amber-400/30 text-amber-100 font-bold text-sm border border-amber-400/50 group-hover:bg-amber-400 group-hover:text-white transition-all">
                사진 찍고 시작하기
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Option 2: Pure Imagination Art */}
            <button
              onClick={() => handleSelectMode("pure")}
              className={`relative overflow-hidden group flex flex-col items-center p-7 rounded-2xl border-2 text-center transition-all duration-300 cursor-pointer ${
                selectedMode === "pure"
                  ? "border-sky-300 bg-sky-400/20 scale-[1.02] shadow-[0_0_30px_rgba(125,211,252,0.4)]"
                  : "border-white/30 bg-white/10 hover:bg-white/20 hover:border-sky-300/60 hover:scale-[1.02]"
              }`}
            >
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-sky-400 to-blue-500 text-xs font-bold rounded-full shadow-md text-white">
                빠르고 간편 🚀
              </div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 transition-transform">
                <Palette className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-extrabold mb-2 text-white group-hover:text-sky-200 transition-colors drop-shadow">
                순수 상상화 그리기
              </h3>
              <p className="text-white/75 text-sm leading-relaxed mb-5">
                사진 촬영 없이, AI가 상상한 신비로운 풍경과 마법 세계를 자유롭게 그려요!
              </p>
              <span className="mt-auto inline-flex items-center px-5 py-2 rounded-full bg-sky-400/30 text-sky-100 font-bold text-sm border border-sky-400/50 group-hover:bg-sky-400 group-hover:text-white transition-all">
                바로 프롬프트 만들기
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
        <div className="relative z-10 text-white font-semibold">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
