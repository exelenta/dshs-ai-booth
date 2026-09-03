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

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Step badge */}
        <div className="mb-5 flex items-center gap-2">
          <span className="px-4 py-1.5 bg-white/20 border border-white/40 rounded-full text-white font-semibold text-sm backdrop-blur-md">
            2단계: 사진 촬영
          </span>
        </div>

        {/* Glass card */}
        <div className="w-full rounded-[2rem] border border-white/50 bg-white/20 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6">
          <header className="mb-5 text-center">
            <p className="mb-1 flex items-center justify-center gap-1.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Spirited Booth
            </p>
            <h1 className="text-xl font-bold text-white drop-shadow">
              {capturedImage ? "멋진 사진이네요!" : "가족과 함께 예쁘게 포즈를 취해보세요"}
            </h1>
          </header>

          {/* Camera / Preview */}
          <div className="mb-5">
            <WebcamFrame recording={!capturedImage && !isProcessing}>
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <span className="text-8xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                        {countdown}
                      </span>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                      <Loader2 className="w-12 h-12 text-amber-300 animate-spin mb-3" />
                      <span className="text-base font-bold text-white text-center px-4">마법 스케치북이 인물을 오려내고 있어요...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full relative bg-slate-800 checkerboard-bg">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                </div>
              )}
            </WebcamFrame>
          </div>

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {error && <p className="mb-4 text-red-300 font-medium text-sm text-center">{error}</p>}

          {/* Action Buttons */}
          {!capturedImage ? (
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
                이전
              </button>
              <button
                onClick={startCapture}
                disabled={countdown !== null || isProcessing}
                className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                촬영하기
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <RefreshCcw className="h-4 w-4" />
                다시 찍기
              </button>
              <button
                onClick={handleNext}
                className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-[1.02]"
              >
                상상 기록하기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .checkerboard-bg {
          background-image: 
            linear-gradient(45deg, #334155 25%, transparent 25%), 
            linear-gradient(-45deg, #334155 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #334155 75%), 
            linear-gradient(-45deg, transparent 75%, #334155 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </main>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-white font-semibold">Loading...</div>
      </div>
    }>
      <CameraContent />
    </Suspense>
  );
}
