"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight, Wand2, Sparkles } from "lucide-react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";

function ResultContent() {
  useIdleTimeout();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>("space");
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const prompt = sessionStorage.getItem("userPrompt");
    const theme = sessionStorage.getItem("userTheme") || "space";
    const personImgStr = sessionStorage.getItem("capturedImage");
    const cachedBgImage = sessionStorage.getItem("bgImage");

    setCurrentTheme(theme);

    if (!prompt) {
      router.push("/");
      return;
    }
    
    if (cachedBgImage) {
      setBgImage(cachedBgImage);
      setLoading(false);
    } else {
      generateBackground(prompt, theme, personImgStr);
    }
  }, [router]);

  const generateBackground = async (
    prompt: string,
    theme: string,
    userImage: string | null
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          theme,
          userImage: userImage || undefined,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "이미지 생성에 실패했습니다.");
      
      setBgImage(data.image);
      sessionStorage.setItem("bgImage", data.image); // Cache it
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 생성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (!bgImage) return;
    setLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bg = new Image();
      bg.src = bgImage;
      await new Promise((resolve) => { bg.onload = resolve; });

      // Match exact 16:9 aspect ratio and center-crop background image
      const targetAR = 16 / 9;
      const imgAR = bg.width / bg.height;

      let cropX = 0;
      let cropY = 0;
      let cropW = bg.width;
      let cropH = bg.height;

      if (imgAR < targetAR) {
        // Image is taller than 16:9 (e.g. 1:1)
        cropH = bg.width / targetAR;
        cropY = (bg.height - cropH) / 2;
      } else if (imgAR > targetAR) {
        // Image is wider than 16:9
        cropW = bg.height * targetAR;
        cropX = (bg.width - cropW) / 2;
      }

      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);

      // Draw 16:9 cropped background onto canvas
      ctx.drawImage(bg, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

      const finalImg = canvas.toDataURL("image/jpeg", 0.95);
      sessionStorage.setItem("finalImage", finalImg);
      router.push("/print");
    } catch (e) {
      console.error(e);
      setError("이미지 처리 중 오류가 발생했습니다.");
      setLoading(false);
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"
      />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Step badge */}
        <div className="mb-5">
          <span className="px-4 py-1.5 bg-white/20 border border-white/40 rounded-full text-white font-semibold text-sm backdrop-blur-md">
            4단계: 결과 확인
          </span>
        </div>

        {loading ? (
          /* Loading State - Glass Card */
          <div className="w-full rounded-[2rem] border border-white/50 bg-white/15 p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <div className="relative w-28 h-28 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
              <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-amber-300 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 drop-shadow">인물 화풍 변환 마법을 부리는 중...</h2>
            <p className="text-white/70 mb-2">얼굴과 포즈의 특징을 살려 선택하신 화풍으로 그림을 다시 그리고 있어요.</p>
            <p className="text-sm text-amber-300">이질감 없는 완벽한 일체형 작품이 곧 완성됩니다!</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="w-full rounded-[2rem] border border-red-400/40 bg-red-900/20 p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-red-300 mb-4">앗! 마법 스케치북이 잠시 쉬고 있어요</h2>
            <p className="text-white/80 mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-white/20 text-white rounded-full font-bold text-lg hover:bg-white/30 transition-colors cursor-pointer backdrop-blur"
            >
              처음으로 돌아가기
            </button>
          </div>
        ) : (
          /* Result State - Glass Card */
          <div className="w-full rounded-[2rem] border border-white/50 bg-white/15 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center px-4 py-1.5 bg-amber-400/20 border border-amber-400/40 rounded-full mb-3">
                <Wand2 className="w-4 h-4 text-amber-300 mr-2" />
                <span className="text-amber-200 font-bold text-sm">인물 화풍 완벽 일체화 완료!</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow">짜잔! 상상 속 그림이 완성되었어요</h1>
              <p className="text-white/70 text-sm md:text-base">
                인물과 배경이 어색한 오려 붙이기가 아닌, 동일한 화풍과 조명으로 하나가 된 예술 작품입니다.
              </p>
            </div>

            {bgImage && (
              <div 
                className="w-full max-w-4xl mx-auto relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-white/30 mb-6 bg-black select-none"
                style={{ aspectRatio: '16/9' }}
              >
                <img
                  src={bgImage}
                  alt="AI Redrawn Masterpiece"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-white backdrop-blur">
                  <Sparkles className="inline w-3 h-3 mr-1 text-amber-300" />
                  AI 생성 작품
                </span>
              </div>
            )}

            <div className="flex gap-4 flex-wrap justify-center">
              <button
                onClick={() => router.push(`/prompt?theme=${currentTheme}`)}
                className="flex items-center justify-center px-6 py-3.5 rounded-full border border-white/40 bg-white/10 text-white font-bold hover:bg-white/20 transition-colors cursor-pointer backdrop-blur"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                프롬프트 다시 수정
              </button>
              <button
                onClick={handleNextStep}
                className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(251,191,36,0.5)] cursor-pointer"
              >
                마지막 꾸미기 및 인쇄
                <ArrowRight className="w-6 h-6 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for compositing at print time */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-white font-semibold">Loading...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
