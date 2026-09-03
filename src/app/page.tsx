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
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          1단계: 모드 선택
        </span>
      </div>

      <div className="max-w-4xl w-full z-10 flex flex-col items-center">
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-5 shadow-2xl">
            <Sparkles className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400">
              우리가족 상상스케치
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-slate-300 font-medium">말로 그리는 우리 가족의 꿈</p>
        </div>

        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-500">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center flex items-center justify-center">
            <Wand2 className="w-7 h-7 mr-3 text-pink-400" />
            어떻게 AI 그림을 그려볼까요?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            {/* Option 1: Webcam Photo Synthesis */}
            <button
              onClick={() => handleSelectMode("camera")}
              className={`relative overflow-hidden group flex flex-col items-center p-8 rounded-3xl border-2 text-center transition-all duration-300 cursor-pointer ${
                selectedMode === "camera"
                  ? "border-pink-400 bg-pink-500/20 scale-[1.02] shadow-[0_0_30px_rgba(236,72,153,0.4)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-pink-400/50 hover:scale-[1.02]"
              }`}
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-xs font-bold rounded-full shadow-md">
                인기 최고 ⭐
              </div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-white group-hover:text-pink-300 transition-colors">
                내 얼굴 넣고 그리기
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                웹캠으로 사진을 찍어 내 얼굴이 주인공인 멋진 AI 일러스트를 만들어요!
              </p>
              <span className="mt-auto inline-flex items-center px-6 py-2.5 rounded-full bg-pink-500/30 text-pink-200 font-bold text-sm border border-pink-500/40 group-hover:bg-pink-500 group-hover:text-white transition-all">
                사진 찍고 시작하기
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Option 2: Pure Imagination Art */}
            <button
              onClick={() => handleSelectMode("pure")}
              className={`relative overflow-hidden group flex flex-col items-center p-8 rounded-3xl border-2 text-center transition-all duration-300 cursor-pointer ${
                selectedMode === "pure"
                  ? "border-cyan-400 bg-cyan-500/20 scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/50 hover:scale-[1.02]"
              }`}
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-bold rounded-full shadow-md">
                빠르고 간편 🚀
              </div>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                <Palette className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-white group-hover:text-cyan-300 transition-colors">
                순수 상상화 그리기
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                사진 촬영 없이, AI가 상상한 신비로운 풍경과 마법 세계를 자유롭게 그려요!
              </p>
              <span className="mt-auto inline-flex items-center px-6 py-2.5 rounded-full bg-cyan-500/30 text-cyan-200 font-bold text-sm border border-cyan-500/40 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                바로 프롬프트 만들기
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
