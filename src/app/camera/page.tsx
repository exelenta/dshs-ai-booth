"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, RefreshCcw, ArrowRight, Loader2 } from "lucide-react";

import { Suspense } from "react";

function CameraContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme");

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
        
        // Draw original image
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        
        // Use segmentation mask to keep only person (foreground)
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
        
        // Restore to default composite operation
        ctx.globalCompositeOperation = "source-over";
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
      sessionStorage.removeItem("capturedImage");
    }
    router.push(`/prompt?theme=${theme || 'space'}`);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <main className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center relative">
      <div className="absolute top-6 left-6 z-20">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          2단계: 사진 촬영
        </span>
      </div>
      
      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-6">
          {capturedImage ? "멋진 사진이네요!" : "가족과 함께 예쁘게 포즈를 취해보세요"}
        </h1>

        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
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
                  <span className="text-9xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse">
                    {countdown}
                  </span>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                  <Loader2 className="w-16 h-16 text-pink-400 animate-spin mb-4" />
                  <span className="text-xl font-bold text-white">마법 스케치북이 인물을 오려내고 있어요...</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full relative bg-slate-800 checkerboard-bg">
              {/* Checkerboard CSS pattern for transparency visual */}
              <style jsx>{`
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
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {error && <p className="mt-4 text-red-400 font-bold">{error}</p>}

        <div className="mt-8 flex gap-4 w-full justify-center">
          {!capturedImage ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center px-8 py-4 bg-white/5 border border-white/20 text-white text-xl font-bold rounded-full hover:bg-white/10 transition-colors"
              >
                이전 단계
              </button>
              <button
                onClick={startCapture}
                disabled={countdown !== null || isProcessing}
                className="flex items-center justify-center px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl font-bold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
              >
                <Camera className="w-8 h-8 mr-3" />
                촬영하기
              </button>
              <button
                onClick={handleNext}
                disabled={countdown !== null || isProcessing}
                className="flex items-center justify-center px-8 py-4 bg-white/10 border border-white/30 text-white text-xl font-bold rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                사진 찍지 않고 넘어가기
                <ArrowRight className="w-6 h-6 ml-2" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center justify-center px-8 py-4 bg-white/10 border border-white/30 text-white text-xl font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                <RefreshCcw className="w-6 h-6 mr-2" />
                다시 찍기
              </button>
              <button
                onClick={handleNext}
                className="flex items-center justify-center px-8 py-4 bg-white text-purple-900 text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              >
                상상 기록하기
                <ArrowRight className="w-6 h-6 ml-2" />
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <CameraContent />
    </Suspense>
  );
}
