"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Printer, Home, CheckCircle2, Move, ArrowLeft } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadString } from "firebase/storage";

const FONTS = [
  { id: "sans", name: "단정한 고딕체", value: "sans-serif" },
  { id: "serif", name: "진지한 명조체", value: "serif" },
  { id: "cursive", name: "귀여운 손글씨", value: "cursive" },
];

export default function PrintPage() {
  const router = useRouter();
  
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState(5); // Percentage of height
  const [textColor, setTextColor] = useState("white");
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag and Drop State
  const [textPos, setTextPos] = useState({ x: 50, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  useEffect(() => {
    const imgStr = sessionStorage.getItem("finalImage");
    if (!imgStr) {
      router.push("/");
      return;
    }
    setBaseImage(imgStr);
  }, [router]);

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!message) return;
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: textPos.x,
      posY: textPos.y
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
      
      setTextPos({
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
    if (!baseImage) return;
    setIsPrinting(true);
    setPrintError(null);
    setUploadWarning(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      const img = new Image();
      img.src = baseImage;
      await new Promise((resolve) => { img.onload = resolve; });

      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Draw base image
      ctx.drawImage(img, 0, 0);

      // 2. Draw text
      if (message) {
        ctx.fillStyle = textColor;
        ctx.font = `bold ${Math.floor(canvas.height * (fontSize / 100))}px ${selectedFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Add strong shadow instead of stroke for readability
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        const textX = (canvas.width * textPos.x) / 100;
        const textY = (canvas.height * textPos.y) / 100;
        
        ctx.fillText(message, textX, textY);
        
        // Reset shadow for other drawings
        ctx.shadowColor = "transparent";
      }

      // 3. Draw DSHS Logo in top-right rounded box (Half size)
      try {
        const logo = new Image();
        logo.src = "/logo.png";
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
        });
        
        const logoHeight = canvas.height * 0.04; // Reduced to half
        const scale = logoHeight / logo.height;
        const logoWidth = logo.width * scale;
        
        const padding = canvas.height * 0.01; // Reduced padding proportionally
        const boxWidth = logoWidth + padding * 2;
        const boxHeight = logoHeight + padding * 2;
        const boxX = canvas.width - boxWidth - padding;
        const boxY = padding;
        const radius = canvas.height * 0.01;

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.moveTo(boxX + radius, boxY);
        ctx.lineTo(boxX + boxWidth - radius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
        ctx.lineTo(boxX + radius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
        ctx.closePath();
        ctx.fill();

        ctx.drawImage(logo, boxX + padding, boxY + padding, logoWidth, logoHeight);
      } catch (e) {
        // Fallback text if logo fails
        const fallbackText = "DSHS AI Booth";
        ctx.fillStyle = "black";
        ctx.font = `bold ${Math.floor(canvas.height * 0.02)}px sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(fallbackText, canvas.width - 40, 40);
      }

      const generatedFinalImage = canvas.toDataURL("image/jpeg", 0.95);
      setFinalImage(generatedFinalImage);

      const fileName = `booth_${Date.now()}_guest.jpg`;
      const storageRef = ref(storage, `prints/${fileName}`);
      try {
        await uploadString(storageRef, generatedFinalImage, "data_url");
      } catch (e) {
        console.error("Firebase upload failed", e);
        setUploadWarning("클라우드 백업에 실패했지만 인쇄는 계속 진행됩니다.");
      }

      // Show the generated image for a split second so the browser captures it for printing
      setTimeout(() => {
        window.print();
        setIsDone(true);
        setTimeout(() => {
          sessionStorage.clear();
          router.push("/");
        }, 10000);
      }, 500);

    } catch (err) {
      console.error(err);
      setPrintError("인쇄 준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsPrinting(false);
    }
  };

  if (isDone) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-16 flex flex-col items-center justify-center text-center max-w-2xl w-full">
          <CheckCircle2 className="w-24 h-24 text-green-400 mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">참여해 주셔서 감사합니다!</h1>
          <p className="text-xl text-slate-300 mb-8">프린터에서 멋진 추억을 확인해보세요.</p>
          
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="flex items-center px-8 py-4 bg-white/20 text-white font-bold rounded-full hover:bg-white/30 transition-colors mb-4"
          >
            <Home className="w-5 h-5 mr-2" />
            첫 화면으로 바로 가기
          </button>
          
          <p className="text-sm text-slate-500 animate-pulse mt-4">잠시 후 자동으로 처음 화면으로 돌아갑니다...</p>
        </div>
      </main>
    );
  }

  // If printing, we need to hide the normal UI and show the final image for the browser print engine
  if (finalImage) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <img src={finalImage} alt="Print output" className="w-full h-auto" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6 flex items-center justify-center print-page relative">
      <div className="absolute top-6 left-6 z-20 print:hidden">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          5단계: 마지막 꾸미기 및 인쇄
        </span>
      </div>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        
        {/* Settings Panel */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col no-print h-fit">
          <h2 className="text-2xl font-bold text-white mb-6">마지막 꾸미기</h2>

          {printError && (
            <p className="mb-4 text-red-400 text-sm font-medium">{printError}</p>
          )}
          {uploadWarning && (
            <p className="mb-4 text-yellow-300 text-sm">{uploadWarning}</p>
          )}
          
          <div className="mb-6">
            <label className="block text-slate-300 mb-2 font-medium">나만의 멘트 (선택)</label>
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="예: 우리가족 사랑해!"
              className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-slate-300 mb-2 font-medium">글자 색상</label>
              <div className="flex gap-4">
                {[
                  { name: '흰색', value: 'white', class: 'bg-white' },
                  { name: '노랑', value: '#FDE047', class: 'bg-yellow-300' },
                  { name: '하늘색', value: '#7DD3FC', class: 'bg-sky-300' },
                ].map(color => (
                  <button
                    key={color.value}
                    onClick={() => setTextColor(color.value)}
                    className={`w-10 h-10 rounded-full border-4 transition-transform shadow-md ${color.class} ${textColor === color.value ? 'border-pink-500 scale-110' : 'border-transparent hover:scale-105'}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">글꼴 선택</label>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl p-2.5 text-white outline-none focus:border-cyan-400 appearance-none cursor-pointer"
                style={{ fontFamily: selectedFont }}
              >
                {FONTS.map(font => (
                  <option key={font.id} value={font.value} className="bg-slate-800 text-white py-2" style={{ fontFamily: font.value }}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-10">
            <label className="block text-slate-300 mb-2 font-medium">글자 크기 조절</label>
            <input 
              type="range" 
              min="2" 
              max="15" 
              step="0.5"
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))} 
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="mt-auto space-y-4">
            <button
              onClick={handlePrint}
              disabled={isPrinting || !baseImage}
              className="w-full flex items-center justify-center px-8 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-2xl font-bold rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            >
              {isPrinting ? (
                "처리중..."
              ) : (
                <>
                  <Printer className="w-7 h-7 mr-3" />
                  진짜 인쇄하기!
                </>
              )}
            </button>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/result")}
                className="flex items-center justify-center px-4 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2 shrink-0" />
                결과로 가기
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center px-4 py-4 bg-white/5 text-slate-300 font-bold rounded-2xl hover:bg-white/10 transition-colors"
              >
                <Home className="w-5 h-5 mr-2 shrink-0" />
                처음으로
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
          {message && (
            <p className="text-pink-300 font-medium mb-4 animate-pulse shrink-0">
              글자를 드래그해서 원하는 위치로 옮겨보세요!
            </p>
          )}

          {baseImage ? (
            <div 
              ref={containerRef}
              className="w-full relative rounded-xl overflow-hidden shadow-inner border-4 border-white/10 bg-black"
              style={{ aspectRatio: '16/9', containerType: 'size' }}
            >
              {/* Background */}
              <img src={baseImage} alt="Print background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              
              {/* Top-Right Logo Overlay */}
              <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-md rounded-xl p-2 shadow-lg pointer-events-none z-10">
                <img src="/logo.png" alt="Logo" className="h-5 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>

              {/* Draggable Text Overlay */}
              {message && (
                <div
                  className={`absolute cursor-move group ${isDragging ? 'opacity-90' : 'hover:opacity-80'} transition-opacity z-20 whitespace-nowrap`}
                  style={{
                    left: `${textPos.x}%`,
                    top: `${textPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none'
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                >
                  <div className="relative">
                    <div className="absolute inset-[-10px] border-2 border-dashed border-white/0 group-hover:border-white/50 rounded-lg pointer-events-none transition-colors">
                      <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-black/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <span 
                      className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] font-bold pointer-events-none"
                      style={{ 
                        fontFamily: selectedFont, 
                        fontSize: `${fontSize}cqh`,
                        color: textColor
                      }}
                    >
                      {message}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/50 animate-pulse">미리보기를 준비중입니다...</div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 0; 
          }
          html, body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </main>
  );
}
