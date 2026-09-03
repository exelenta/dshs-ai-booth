"use client";

import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Wand2, Sparkles } from "lucide-react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { getErrorMessage } from "@/lib/errors";
import {
  getSessionImage,
  setSessionImage,
} from "@/lib/session-image-store";

function ResultContent() {
  useIdleTimeout();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>("space");
  const fetchedRef = useRef(false);

  const generateBackground = useCallback(async (
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
      await setSessionImage("bgImage", data.image);
      setLoading(false);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "이미지 생성 중 오류가 발생했습니다."));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    void (async () => {
      const prompt = sessionStorage.getItem("userPrompt");
      const theme = sessionStorage.getItem("userTheme") || "space";
      const [personImgStr, cachedBgImage] = await Promise.all([
        getSessionImage("capturedImage"),
        getSessionImage("bgImage"),
      ]);

      setCurrentTheme(theme);

      if (!prompt) {
        router.push("/");
        return;
      }

      if (cachedBgImage) {
        setBgImage(cachedBgImage);
        setLoading(false);
      } else {
        await generateBackground(prompt, theme, personImgStr);
      }
    })();
  }, [generateBackground, router]);

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
        cropH = bg.width / targetAR;
        cropY = (bg.height - cropH) / 2;
      } else if (imgAR > targetAR) {
        cropW = bg.height * targetAR;
        cropX = (bg.width - cropW) / 2;
      }

      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);

      ctx.drawImage(bg, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

      const finalImg = canvas.toDataURL("image/jpeg", 0.95);
      await setSessionImage("finalImage", finalImg);
      router.push("/print");
    } catch (e) {
      console.error(e);
      setError("이미지 처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Sky backdrop */}
      <img
        src="/ghibli-sky.jpg"
        alt="Sky background"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-900/20"
      />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Step Badge */}
        <div className="mb-4">
          <span className="px-4 py-1.5 bg-white/90 border border-amber-200/80 rounded-full text-amber-900 font-bold text-xs backdrop-blur-md shadow-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            4단계: 마법 결과 확인
          </span>
        </div>

        {loading ? (
          /* Loading State - Warm Magic Sketchbook Card */
          <div className="w-full rounded-[28px] border border-white/95 bg-white/90 p-12 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-amber-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
              <Wand2 className="absolute inset-0 m-auto w-9 h-9 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-stone-800 mb-2 font-display">
              마법 스케치북이 그림을 그리고 있어요 ✨
            </h2>
            <p className="text-stone-600 text-sm md:text-base mb-2 font-medium">
              선택하신 화풍과 배경에 맞춰 우리 가족의 소중한 순간을 한 폭의 명작으로 완성하고 있습니다.
            </p>
            <p className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 mt-2">
              잠시만 기다려주시면 아름다운 작품이 펼쳐집니다
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="w-full rounded-[28px] border border-rose-200 bg-white/92 p-10 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-rose-600 mb-3">앗! 마법 스케치북이 잠시 숨을 고르고 있어요</h2>
            <p className="text-stone-600 mb-6 font-medium">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full font-bold text-sm transition-colors cursor-pointer border border-stone-200"
            >
              처음으로 돌아가기
            </button>
          </div>
        ) : (
          /* Result State - Modern Polaroid Frame Presentation */
          <div className="w-full rounded-[28px] border border-white/95 bg-white/90 p-6 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl md:p-8">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center px-4 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                마법 일러스트 완성!
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-stone-800 mb-1 font-display">
                짜잔! 상상 속 그림이 완성되었어요 🎉
              </h1>
              {/* Guideline 10: Updated description text */}
              <p className="text-stone-600 text-sm md:text-base font-medium">
                세상에 하나밖에 없는 당신의 특별한 사진입니다.
              </p>
            </div>

            {bgImage && (
              <div className="w-full max-w-4xl mx-auto p-2 sm:p-3 bg-white rounded-3xl shadow-xl shadow-stone-400/20 border border-stone-200/80 mb-6">
                <div 
                  className="w-full relative rounded-2xl overflow-hidden bg-stone-100 select-none shadow-inner"
                  style={{ aspectRatio: '16/9' }}
                >
                  <img
                    src={bgImage}
                    alt="AI Redrawn Masterpiece"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[0.7rem] font-bold text-stone-800 backdrop-blur-md border border-white/60 shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    마법 완성작
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => router.push(`/prompt?theme=${currentTheme}`)}
                className="flex items-center justify-center px-5 py-3.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                화풍 다시 고르기
              </button>
              <button
                onClick={handleNextStep}
                className="flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-base md:text-lg font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                마지막 꾸미기 및 인쇄
                <ArrowRight className="w-5 h-5 ml-2" />
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
        <div className="relative z-10 text-stone-800 font-bold bg-white/80 px-6 py-3 rounded-full backdrop-blur-md">결과를 준비하는 중...</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
