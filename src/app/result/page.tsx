"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Printer, ArrowLeft, Move } from "lucide-react";

export default function ResultPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);

  // For Drag and Drop & Resize
  const [pos, setPos] = useState({ x: 50, y: 70 }); // Center position percentages
  const [scale, setScale] = useState(60); // Height percentage of container
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const prompt = sessionStorage.getItem("userPrompt");
    const theme = sessionStorage.getItem("userTheme");
    const personImgStr = sessionStorage.getItem("capturedImage");
    const cachedBgImage = sessionStorage.getItem("bgImage");

    if (!prompt) {
      router.push("/");
      return;
    }

    if (personImgStr) {
      setPersonImage(personImgStr);
    }
    
    if (cachedBgImage) {
      setBgImage(cachedBgImage);
      setLoading(false);
    } else {
      generateBackground(prompt, theme || "space");
    }
  }, []);

  const generateBackground = async (prompt: string, theme: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, theme }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      
      setBgImage(data.image);
      sessionStorage.setItem("bgImage", data.image); // Cache it for when user goes back from print page
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 생성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: pos.x,
      posY: pos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      
      const dxPercent = (dx / rect.width) * 100;
      const dyPercent = (dy / rect.height) * 100;
      
      setPos({
        x: dragStartRef.current.posX + dxPercent,
        y: dragStartRef.current.posY + dyPercent
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const handlePrint = async () => {
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

      canvas.width = bg.width;
      canvas.height = bg.height;
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      if (personImage) {
        const person = new Image();
        person.src = personImage;
        await new Promise((resolve) => { person.onload = resolve; });

        // Calculate size based on scale (which is % of bg height)
        const targetHeight = (canvas.height * scale) / 100;
        const targetWidth = targetHeight * (person.width / person.height);

        // Calculate top-left position from center position percentages
        const x = (canvas.width * pos.x) / 100 - targetWidth / 2;
        const y = (canvas.height * pos.y) / 100 - targetHeight / 2;

        ctx.drawImage(person, x, y, targetWidth, targetHeight);
      }

      const finalImg = canvas.toDataURL("image/jpeg", 0.95);
      sessionStorage.setItem("finalImage", finalImg);
      router.push("/print");
    } catch (e) {
      console.error(e);
      setError("합성 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 p-6 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-6 left-6 z-20">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          4단계: 결과 확인 및 출력
        </span>
      </div>
      <div className="w-full max-w-5xl z-10 flex flex-col items-center">
        
        {loading ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-16 flex flex-col items-center justify-center w-full shadow-2xl">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"></div>
              <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-pink-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">마법을 부리는 중...</h2>
            <p className="text-xl text-slate-300">조금만 기다려주세요! 상상 속 세계가 곧 펼쳐집니다.</p>
          </div>
        ) : error ? (
          <div className="bg-white/10 backdrop-blur-xl border border-red-500/50 rounded-3xl p-12 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold text-red-400 mb-4">앗! 마법 스케치북이 잠시 쉬고 있어요</h2>
            <p className="text-white mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-slate-200"
            >
              처음으로 돌아가기
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center bg-white/5 p-6 rounded-3xl backdrop-blur-md">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">짜잔! 그림이 완성되었어요</h1>
            
            {personImage && (
              <p className="text-pink-300 font-medium mb-6 animate-pulse">
                사진을 드래그해서 위치를 맞추고, 아래 바를 조절해 크기를 맞춰보세요!
              </p>
            )}

            {bgImage && (
              <div 
                ref={containerRef}
                className="w-full max-w-4xl relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/10 mb-6 bg-black"
                style={{ aspectRatio: '16/9' }}
              >
                {/* Background Image */}
                <img src={bgImage} alt="AI Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                
                {/* Draggable Person Overlay */}
                {personImage && (
                  <div
                    className={`absolute cursor-move group ${isDragging ? 'opacity-90 scale-105' : 'hover:scale-105'} transition-transform duration-100 ease-out`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      height: `${scale}%`,
                      transform: 'translate(-50%, -50%)',
                      touchAction: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                  >
                    {/* Visual box around person when hovering/dragging */}
                    <div className="absolute inset-0 border-2 border-dashed border-white/0 group-hover:border-white/50 rounded-lg pointer-events-none transition-colors">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <img src={personImage} alt="User Person" className="h-full w-auto object-contain pointer-events-none" draggable={false} />
                  </div>
                )}
              </div>
            )}

            {/* Size Slider */}
            {personImage && (
              <div className="w-full max-w-md bg-black/40 p-4 rounded-2xl mb-8 flex items-center gap-4 border border-white/10">
                <span className="text-white/80 font-bold whitespace-nowrap">크기 조절</span>
                <input 
                  type="range" 
                  min="20" 
                  max="150" 
                  value={scale} 
                  onChange={(e) => setScale(Number(e.target.value))} 
                  className="flex-1 accent-pink-500 cursor-pointer"
                />
              </div>
            )}

            <div className="flex gap-4 flex-wrap justify-center w-full">
              <button
                onClick={() => router.push("/prompt")}
                className="flex items-center justify-center px-8 py-4 bg-white/10 border border-white/30 text-white text-xl font-bold rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 mr-3" />
                뒤로 가기
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center px-10 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-2xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              >
                <Printer className="w-8 h-8 mr-3" />
                사진 인쇄
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
