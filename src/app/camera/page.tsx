"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { Camera, RefreshCcw, ArrowRight, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { WebcamFrame } from "@/components/webcam-frame";

function CameraContent() {
  useIdleTimeout();
  const router = useRouter();

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCapture = () => {
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      takePicture();
      setCountdown(null);
    }
  }, [countdown]);

  const takePicture = async () => {
    if (!webcamRef.current) return;
    
    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("사진을 캡처하지 못했습니다. 다시 시도해주세요.");
      return;
    }
    
    setIsProcessing(true);
    await processImage(imageSrc);
  };

  const processImage = async (imageSrc: string) => {
    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // MediaPipe Selfie Segmentation from window
      const SelfieSegmentation = (window as any).SelfieSegmentation;
      if (!SelfieSegmentation) {
        throw new Error("Selfie Segmentation script not loaded");
      }
      const selfieSegmentation = new SelfieSegmentation({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        },
      });

      selfieSegmentation.setOptions({
        modelSelection: 1, // 0 for general, 1 for landscape (faster)
      });

      selfieSegmentation.onResults((results: any) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Horizontal flip so the captured output matches what user saw in mirror preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        // Draw original image
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        // Use segmentation mask to keep only person (foreground)
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        
        // Restore to default composite operation
        ctx.restore();

        // Get final masked image
        const maskedImageBase64 = canvas.toDataURL("image/png");
        setCapturedImage(maskedImageBase64);
        setIsProcessing(false);
        
        // Save to sessionStorage to pass to next screen
        sessionStorage.setItem("capturedImage", maskedImageBase64);
      });

      await selfieSegmentation.initialize();
      await selfieSegmentation.send({ image: img });

    } catch (err: any) {
      console.error(err);
      setError(`배경 제거 오류: ${err.message || err}`);
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (!capturedImage) {
      setError("먼저 사진을 촬영해 주세요.");
      return;
    }
    router.push("/prompt");
  };

  const handleRetake = () => {
    setCapturedImage(null);
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

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white/90 z-50 animate-pulse pointer-events-none" />}

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Step badge */}
        <div className="mb-4 flex items-center gap-2">
          <span className="px-4 py-1.5 bg-white/85 border border-amber-200/80 rounded-full text-amber-900 font-bold text-xs backdrop-blur-md shadow-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            2단계: 사진 촬영
          </span>
        </div>

        {/* High-contrast Warm Glassmorphism Panel */}
        <div className="w-full rounded-[28px] border border-white/90 bg-white/88 p-5 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl sm:p-7">
          <header className="mb-4 text-center">
            <h1 className="text-2xl font-bold text-stone-800">
              {capturedImage ? "멋진 사진이 찍혔어요! ✨" : "가족과 함께 예쁘게 포즈를 취해보세요"}
            </h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">
              {capturedImage 
                ? "이 사진 속 인물이 선택하신 마법 화풍으로 완벽하게 다시 그려집니다"
                : "얼굴이 잘 보이도록 화면 중앙에 위치해주세요"}
            </p>
          </header>

          {/* Modern Polaroid Style Viewfinder */}
          <div className="mb-5">
            <WebcamFrame 
              recording={!capturedImage && !isProcessing}
              showFooter={!capturedImage}
              footerText="✨ 예쁜 표정 짓기! ✨"
            >
              {!capturedImage ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  {countdown !== null && countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900/30 backdrop-blur-[2px] z-10">
                      <span className="text-8xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] animate-pulse font-display">
                        {countdown}
                      </span>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 z-20 backdrop-blur-sm">
                      <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-3" />
                      <span className="text-base font-bold text-stone-800 text-center px-4">
                        마법 스케치북이 인물을 돋보이게 다듬고 있어요... ✨
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Pastel Magic Glow Background (Segmented Foreground View) */
                <div className="w-full h-full relative bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50 flex items-center justify-center">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
                  <div className="absolute inset-0 bg-radial from-amber-300/10 via-transparent to-transparent pointer-events-none" />
                </div>
              )}
            </WebcamFrame>
          </div>

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {error && <p className="mb-4 text-rose-600 font-bold text-sm text-center">{error}</p>}

          {/* Unified Warm Color Action Buttons */}
          {!capturedImage ? (
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-100/90 px-4 py-3.5 text-sm font-bold text-stone-700 transition-colors hover:bg-stone-200 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                이전으로
              </button>
              <button
                onClick={startCapture}
                disabled={countdown !== null || isProcessing}
                className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-4 py-3.5 text-base font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                <Camera className="h-5 w-5" />
                촬영하기
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-stone-100/90 px-4 py-3.5 text-sm font-bold text-stone-700 transition-colors hover:bg-stone-200 cursor-pointer shadow-xs"
              >
                <RefreshCcw className="h-4 w-4" />
                다시 찍기
              </button>
              <button
                onClick={handleNext}
                className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-4 py-3.5 text-base font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                상상 기록하기
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-stone-800 font-bold bg-white/80 px-6 py-3 rounded-full backdrop-blur-md">카메라를 준비하는 중...</div>
      </div>
    }>
      <CameraContent />
    </Suspense>
  );
}
