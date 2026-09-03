"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Printer, Home, CheckCircle2, Move, ArrowLeft, Smartphone, Download, Pipette, Sparkles } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { composeFinalImage } from "@/lib/compose-image";
import { isValidKoreanPhoneInput } from "@/lib/phone";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";

const FONTS = [
  { id: "sans", name: "단정한 고딕체", value: "sans-serif" },
  { id: "serif", name: "진지한 명조체", value: "serif" },
  { id: "cursive", name: "귀여운 손글씨", value: "cursive" },
];

const PRESET_COLORS = [
  { name: "흰색", value: "#FFFFFF", class: "bg-white border border-stone-300" },
  { name: "레몬노랑", value: "#FDE047", class: "bg-yellow-300" },
  { name: "네온연두", value: "#4ADE80", class: "bg-emerald-400" },
  { name: "스카이블루", value: "#38BDF8", class: "bg-sky-400" },
  { name: "로즈핑크", value: "#F472B6", class: "bg-pink-400" },
  { name: "라벤더", value: "#C084FC", class: "bg-purple-400" },
  { name: "오렌지", value: "#FB923C", class: "bg-orange-400" },
  { name: "다크네이비", value: "#0F172A", class: "bg-slate-900 border border-stone-400" },
];

function PrintContent() {
  useIdleTimeout();
  const router = useRouter();
  
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState(5);
  const [textColor, setTextColor] = useState("#FFFFFF");
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [textPos, setTextPos] = useState({ x: 50, y: 85 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handlePickColor = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          setTextColor(result.sRGBHex);
        }
      } catch {
        // User cancelled picker
      }
    } else {
      colorInputRef.current?.click();
    }
  };

  useEffect(() => {
    const imgStr = sessionStorage.getItem("finalImage");
    if (!imgStr) {
      router.push("/");
      return;
    }
    setBaseImage(imgStr);
  }, [router]);

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

  const generateComposedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) throw new Error("Canvas not available");

    return composeFinalImage(canvas, {
      baseImage,
      message,
      selectedFont,
      fontSize,
      textColor,
      textPos,
    });
  };

  const uploadComposedImage = async (imageData: string): Promise<string> => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      throw new Error(
        "Firebase Storage 버킷(.env.local의 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)이 설정되지 않았습니다."
      );
    }
    const fileName = `booth_${Date.now()}_guest.jpg`;
    const storageRef = ref(storage, `prints/${fileName}`);

    const uploadPromise = (async () => {
      try {
        await uploadString(storageRef, imageData, "data_url");
        return await getDownloadURL(storageRef);
      } catch (err: any) {
        console.error("Firebase uploadString detailed error:", err);
        if (err?.code === "storage/unauthorized") {
          throw new Error(
            "Firebase Storage 접근 권한(403)이 없습니다. Firebase 콘솔 > Storage > Rules(규칙)에서 /prints 경로의 읽기/쓰기 권한(allow read, write: if true;)을 허용해 주세요."
          );
        } else if (err?.code === "storage/unknown" || err?.code === "storage/bucket-not-found") {
          throw new Error(
            "Firebase Storage 버킷을 찾을 수 없거나 아직 생성되지 않았습니다. Firebase 콘솔에서 Storage 메뉴의 [시작하기]를 눌러 버킷을 생성했는지와 .env.local의 버킷명을 확인해 주세요."
          );
        } else if (err?.code === "storage/retry-limit-exceeded") {
          throw new Error(
            "Firebase Storage 서버 연결 재시도 한도 초과. Storage 버킷 상태나 보안 규칙, 네트워크를 확인해 주세요."
          );
        }
        throw new Error(
          err?.message || "Firebase Storage 업로드 중 오류가 발생했습니다."
        );
      }
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Firebase Storage 이미지 업로드 시간 초과 (15초). Firebase 콘솔의 Storage 활성화 상태 및 보안 규칙(Rules)을 확인해 주세요."
            )
          ),
        15000
      )
    );

    return Promise.race([uploadPromise, timeoutPromise]);
  };

  const handlePrint = async () => {
    if (!baseImage) return;
    setIsPrinting(true);
    setPrintError(null);
    setUploadWarning(null);

    try {
      const generatedFinalImage = await generateComposedImage();
      setFinalImage(generatedFinalImage);

      // Async background upload to Firebase Storage (non-blocking for print)
      try {
        await uploadComposedImage(generatedFinalImage);
      } catch (e) {
        console.error("Firebase upload failed", e);
        setUploadWarning("클라우드 백업에 실패했지만 인쇄는 계속 진행됩니다.");
      }

      const completePrint = () => {
        setIsPrinting(false);
        setIsDone(true);
        setTimeout(() => {
          sessionStorage.clear();
          router.push("/");
        }, 10000);
      };

      const handleAfterPrint = () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        completePrint();
      };

      window.addEventListener("afterprint", handleAfterPrint, { once: true });

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          window.removeEventListener("afterprint", handleAfterPrint);
          completePrint();
        }, 2500);
      }, 300);

    } catch (err) {
      console.error(err);
      setPrintError("인쇄 준비 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsPrinting(false);
    }
  };

  const handleSendPhoto = async () => {
    if (!baseImage || !phoneNumber) return;
    if (!isValidKoreanPhoneInput(phoneNumber)) {
      setSendError("올바른 휴대폰 번호를 입력해 주세요. (예: 010-1234-5678)");
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 20000);

    try {
      const generatedFinalImage = await generateComposedImage();
      const imageUrl = await uploadComposedImage(generatedFinalImage);

      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, photoUrl: imageUrl }),
        signal: controller.signal,
      });

      clearTimeout(abortTimeout);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "문자 발송에 실패했습니다.");

      setSendSuccess(true);
    } catch (err: any) {
      clearTimeout(abortTimeout);
      console.error(err);
      const msg =
        err.name === "AbortError"
          ? "문자 발송 서버 요청 시간이 초과되었습니다 (20초)."
          : err.message || "문자 발송 중 오류가 발생했습니다.";
      setSendError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    if (!baseImage) return;
    try {
      const generatedFinalImage = await generateComposedImage();
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const fileName = `dshs_booth_${timestamp}.jpg`;

      const link = document.createElement("a");
      link.href = generatedFinalImage;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error("Download failed:", err);
      setPrintError("사진 다운로드 중 오류가 발생했습니다.");
    }
  };

  if (isDone) {
    return (
      <main className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-900/20" />
        
        <div className="relative z-10 rounded-[28px] border border-white/95 bg-[#FDFBF7] p-12 shadow-2xl flex flex-col items-center justify-center text-center max-w-xl w-full">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-5 text-amber-600 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-800 mb-2 font-display">
            참여해 주셔서 감사합니다! 🎉
          </h1>
          <p className="text-stone-600 text-base mb-8 font-medium">
            프린터에서 출력된 소중한 우리가족 추억 사진을 확인해보세요.
          </p>
          
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer hover:scale-[1.01]"
          >
            <Home className="w-5 h-5 mr-2" />
            첫 화면으로 바로 가기
          </button>
          
          <p className="text-xs text-stone-400 animate-pulse mt-4 font-medium">잠시 후 자동으로 처음 화면으로 돌아갑니다...</p>
        </div>
      </main>
    );
  }

  const isPhoneValid = isValidKoreanPhoneInput(phoneNumber);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 overflow-hidden print-page">
      {/* Sky Backdrop */}
      <img
        src="/ghibli-sky.jpg"
        alt="Sky background"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover print:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-900/20 print:hidden"
      />

      {/* Hidden Print Container for Perfect Landscape A4 Output */}
      {finalImage && (
        <div className="hidden print:block fixed inset-0 w-screen h-screen z-[999999] bg-white m-0 p-0 pointer-events-none">
          <img
            src={finalImage}
            alt="Print output"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl flex flex-col print:hidden">
        {/* Step Badge */}
        <div className="mb-4">
          <span className="px-4 py-1.5 bg-white/90 border border-amber-200/80 rounded-full text-amber-900 font-bold text-xs backdrop-blur-md shadow-xs flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            5단계: 마지막 꾸미기 및 인쇄
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form Panel - Soft Cream Background with Unified Orange/Amber Theme */}
          <div className="rounded-[28px] border border-amber-200/80 bg-[#FDFBF7] p-6 md:p-7 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] flex flex-col h-fit">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-amber-200/60">
              <h2 className="text-xl font-extrabold text-stone-800 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                마지막 꾸미기
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60">
                인쇄 전 설정
              </span>
            </div>

            {printError && (
              <p className="mb-4 text-rose-600 text-xs font-bold p-2.5 bg-rose-50 rounded-xl border border-rose-200">{printError}</p>
            )}
            {uploadWarning && (
              <p className="mb-4 text-amber-800 text-xs font-semibold p-2.5 bg-amber-50 rounded-xl border border-amber-200">{uploadWarning}</p>
            )}
            {sendError && (
              <p className="mb-4 text-rose-600 text-xs font-bold p-2.5 bg-rose-50 rounded-xl border border-rose-200">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="mb-4 text-emerald-700 text-xs font-bold p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                문자로 사진 링크를 보냈어요! 휴대폰을 확인해 주세요.
              </p>
            )}
            {downloadSuccess && (
              <p className="mb-4 text-sky-800 text-xs font-bold p-2.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                사진이 컴퓨터 다운로드 폴더에 저장되었습니다!
              </p>
            )}
            
            {/* Message Input - 1.5x Padding & Clean Light Gray Border */}
            <div className="mb-4">
              <label className="block text-stone-700 mb-1.5 font-bold text-sm">나만의 멘트 넣기 (선택)</label>
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="예: 2026 우리 가족 사랑해!"
                className="w-full bg-white border border-stone-200 rounded-xl py-3.5 px-4 text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 placeholder-stone-400 text-sm md:text-base font-medium transition-all shadow-xs"
              />
            </div>

            {/* Text Color Picker */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-stone-700 font-bold text-sm">글자 색상</label>
                <button
                  type="button"
                  onClick={handlePickColor}
                  className="flex items-center px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="사진 속 원하는 색상을 스포이드로 직접 찍어보세요"
                >
                  <Pipette className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  스포이드 추출
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-stone-200 rounded-xl shadow-xs">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTextColor(color.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all shadow-xs cursor-pointer ${color.class} ${
                      textColor.toLowerCase() === color.value.toLowerCase()
                        ? "border-amber-500 scale-120 ring-2 ring-amber-400/50"
                        : "border-transparent hover:scale-110"
                    }`}
                    title={color.name}
                  />
                ))}

                {/* Custom Color Wheel Picker */}
                <div className="relative flex items-center ml-auto">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={textColor.startsWith("#") ? textColor : "#FFFFFF"}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                    title="직접 색상 선택"
                  />
                  <div
                    className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center cursor-pointer shadow-xs hover:scale-110 transition-transform"
                    style={{ background: textColor }}
                    title={`현재 색상: ${textColor} (클릭하여 직접 선택)`}
                  >
                    <span className="text-[10px] font-bold text-stone-700 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                      +
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Font and Size Controls - 1.5x Padding & Clean Border */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-stone-700 mb-1.5 font-bold text-sm">글꼴 선택</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl py-3 px-3.5 text-stone-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 cursor-pointer text-sm font-semibold shadow-xs"
                  style={{ fontFamily: selectedFont }}
                >
                  {FONTS.map(font => (
                    <option key={font.id} value={font.value} className="bg-white text-stone-800 py-2" style={{ fontFamily: font.value }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 mb-1.5 font-bold text-sm">글자 크기 ({fontSize})</label>
                <div className="h-[46px] flex items-center px-2 bg-white border border-stone-200 rounded-xl shadow-xs">
                  <input 
                    type="range" 
                    min="2" 
                    max="15" 
                    step="0.5"
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))} 
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Secondary Action 1: Download Button (Outline/Soft Warm Style) */}
            <div className="mb-3">
              <button
                onClick={handleDownload}
                disabled={!baseImage}
                className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 hover:border-amber-400 text-sm md:text-base font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-4 h-4 mr-2 text-amber-600" />
                내 컴퓨터에 사진 다운로드
              </button>
            </div>

            {/* Secondary Action 2: SMS Section (Outline/Soft Warm Style) */}
            <div className="mb-5 p-3.5 bg-white border border-stone-200 rounded-2xl shadow-xs">
              <label className="block text-stone-700 mb-1.5 font-bold text-xs">휴대폰 번호로 사진 받기 (선택)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setSendError(null);
                  setSendSuccess(false);
                }}
                placeholder="010-1234-5678"
                className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-2.5 px-3.5 text-stone-800 outline-none focus:border-amber-500 focus:bg-white mb-2.5 text-sm font-medium"
              />
              <button
                onClick={handleSendPhoto}
                disabled={isSending || !isPhoneValid || !baseImage}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 hover:border-amber-400 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                {isSending ? (
                  "문자 발송 중..."
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-1.5 text-amber-600" />
                    문자로 사진 링크 받기
                  </>
                )}
              </button>
            </div>

            {/* Primary Action Button: Solid Orange/Amber Gradient */}
            <div className="mt-auto space-y-3">
              <button
                onClick={handlePrint}
                disabled={isPrinting || !baseImage}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xl font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer font-display"
              >
                {isPrinting ? (
                  "인쇄 준비 중..."
                ) : (
                  <>
                    <Printer className="w-6 h-6 mr-2.5" />
                    진짜 인쇄하기! 🖨️
                  </>
                )}
              </button>

              {/* Navigation Ghost Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => router.push("/result")}
                  className="flex items-center justify-center px-4 py-3 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  결과로 가기
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center justify-center px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 mr-1" />
                  처음으로
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Drag-and-Drop Preview Panel - Modern Polaroid Frame */}
          <div className="lg:col-span-2 rounded-[28px] border border-white/95 bg-white/90 p-6 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl flex flex-col items-center justify-center">
            {message ? (
              <p className="text-amber-800 font-bold mb-3.5 animate-pulse shrink-0 select-none text-sm bg-amber-100/80 px-4 py-1.5 rounded-full border border-amber-200/80 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-600" />
                화면 속 글자를 마우스나 손가락으로 드래그해서 원하는 위치로 옮겨보세요!
              </p>
            ) : (
              <p className="text-stone-400 font-medium mb-3.5 text-xs">
                좌측에서 '나만의 멘트'를 입력하면 사진 위에 예쁜 글씨가 나타납니다.
              </p>
            )}

            {baseImage ? (
              <div className="w-full p-2 sm:p-3 bg-white rounded-3xl shadow-xl shadow-stone-400/20 border border-stone-200/80">
                <div 
                  ref={containerRef}
                  className="w-full relative rounded-2xl overflow-hidden bg-stone-900 select-none shadow-inner"
                  style={{ aspectRatio: '16/9', containerType: 'size' }}
                >
                  <img src={baseImage} alt="Print background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                  
                  <div className="absolute top-3 right-3 bg-white/60 backdrop-blur-md rounded-xl p-1.5 shadow-md pointer-events-none z-10">
                    <img src="/logo.png" alt="Logo" className="h-5 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>

                  {message && (
                    <div
                      className={`absolute cursor-move group ${isDragging ? 'opacity-90' : 'hover:opacity-85'} transition-opacity z-20 whitespace-nowrap`}
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
                        <div className="absolute inset-[-8px] border-2 border-dashed border-amber-300/80 group-hover:border-amber-400 rounded-lg pointer-events-none transition-colors">
                          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-amber-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <Move className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <span 
                          className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-bold pointer-events-none"
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
              </div>
            ) : (
              <div className="text-stone-400 font-medium animate-pulse">미리보기를 준비중입니다...</div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 0; 
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-stone-800 font-bold bg-white/80 px-6 py-3 rounded-full backdrop-blur-md">인쇄 스튜디오를 준비하는 중...</div>
      </div>
    }>
      <PrintContent />
    </Suspense>
  );
}
