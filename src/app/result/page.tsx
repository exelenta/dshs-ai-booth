"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
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
    <main className="min-h-screen bg-slate-900 p-6 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-6 left-6 z-20">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          4단계: 결과 확인
        </span>
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col items-center">
        {loading ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-16 flex flex-col items-center justify-center w-full shadow-2xl text-center">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
              <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-pink-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">인물 화풍 변환 마법을 부리는 중...</h2>
            <p className="text-xl text-slate-300 mb-2">얼굴과 포즈의 특징을 살려 선택하신 화풍으로 그림을 다시 그리고 있어요.</p>
            <p className="text-sm text-pink-300">이질감 없는 완벽한 일체형 작품이 곧 완성됩니다!</p>
          </div>
        ) : error ? (
          <div className="bg-white/10 backdrop-blur-xl border border-red-500/50 rounded-3xl p-12 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-red-400 mb-4">앗! 마법 스케치북이 잠시 쉬고 있어요</h2>
            <p className="text-white mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-slate-200 cursor-pointer"
            >
              처음으로 돌아가기
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center bg-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl border border-white/10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-2 px-4 bg-pink-500/20 border border-pink-500/30 rounded-full mb-3">
                <Wand2 className="w-5 h-5 text-pink-400 mr-2" />
                <span className="text-pink-300 font-bold text-sm">인물 화풍 완벽 일체화 완료!</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">짜잔! 상상 속 그림이 완성되었어요</h1>
              <p className="text-slate-300 text-base md:text-lg">
                인물과 배경이 어색한 오려 붙이기가 아닌, 동일한 화풍과 조명으로 하나가 된 예술 작품입니다.
              </p>
            </div>

            {bgImage && (
              <div 
                className="w-full max-w-4xl relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.6)] border-4 border-white/20 mb-8 bg-black select-none"
                style={{ aspectRatio: '16/9' }}
              >
                <img
                  src={bgImage}
                  alt="AI Redrawn Masterpiece"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              </div>
            )}

            <div className="flex gap-4 flex-wrap justify-center w-full">
              <button
                onClick={() => router.push(`/prompt?theme=${currentTheme}`)}
                className="flex items-center justify-center px-8 py-4 bg-white/10 border border-white/30 text-white text-xl font-bold rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 mr-3" />
                프롬프트 다시 수정
              </button>
              <button
                onClick={handleNextStep}
                className="flex items-center justify-center px-10 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white text-2xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(236,72,153,0.5)] cursor-pointer"
              >
                마지막 꾸미기 및 인쇄
                <ArrowRight className="w-8 h-8 ml-3" />
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
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <ResultContent />
    </Suspense>
  );
}
