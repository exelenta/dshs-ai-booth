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
  { name: "흰색", value: "#FFFFFF", class: "bg-white" },
  { name: "레몬노랑", value: "#FDE047", class: "bg-yellow-300" },
  { name: "네온연두", value: "#4ADE80", class: "bg-emerald-400" },
  { name: "스카이블루", value: "#38BDF8", class: "bg-sky-400" },
  { name: "로즈핑크", value: "#F472B6", class: "bg-pink-400" },
  { name: "라벤더", value: "#C084FC", class: "bg-purple-400" },
  { name: "오렌지", value: "#FB923C", class: "bg-orange-400" },
  { name: "다크네이비", value: "#0F172A", class: "bg-slate-900 border border-white/40" },
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
  const [textColor, setTextColor] = useState("white");
  
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

      // Delay briefly to allow the final image to paint in the DOM before opening the print dialog
      setTimeout(() => {
        window.print();
        // Fallback in case browser does not trigger afterprint event
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
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
        <div className="relative z-10 rounded-[2rem] border border-white/50 bg-white/20 p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col items-center justify-center text-center max-w-2xl w-full">
          <CheckCircle2 className="w-20 h-20 text-amber-300 mb-5" />
          <h1 className="text-3xl font-bold text-white mb-3 drop-shadow">참여해 주셔서 감사합니다!</h1>
          <p className="text-white/75 text-lg mb-8">프린터에서 멋진 추억을 확인해보세요.</p>
          
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="flex items-center px-8 py-3.5 bg-white/20 text-white font-bold rounded-full hover:bg-white/30 transition-colors mb-4 cursor-pointer backdrop-blur"
          >
            <Home className="w-5 h-5 mr-2" />
            첫 화면으로 바로 가기
          </button>
          
          <p className="text-sm text-white/40 animate-pulse mt-2">잠시 후 자동으로 처음 화면으로 돌아갑니다...</p>
        </div>
      </main>
    );
  }

  const isPhoneValid = isValidKoreanPhoneInput(phoneNumber);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 overflow-hidden print-page">
      {/* Ghibli sky backdrop */}
      <img
        src="/ghibli-sky.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover print:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 print:hidden"
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
        {/* Step badge */}
        <div className="mb-5">
          <span className="px-4 py-1.5 bg-white/20 border border-white/40 rounded-full text-white font-semibold text-sm backdrop-blur-md">
            5단계: 마지막 꾸미기 및 인쇄
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel - Glass Card */}
          <div className="rounded-[2rem] border border-white/50 bg-white/15 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col h-fit">
            <h2 className="text-xl font-bold text-white mb-5 flex items-center drop-shadow">
              <Sparkles className="w-5 h-5 mr-2 text-amber-300" />
              마지막 꾸미기
            </h2>

            {printError && (
              <p className="mb-4 text-red-300 text-sm font-medium">{printError}</p>
            )}
            {uploadWarning && (
              <p className="mb-4 text-amber-300 text-sm">{uploadWarning}</p>
            )}
            {sendError && (
              <p className="mb-4 text-red-300 text-sm font-medium">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="mb-4 text-emerald-300 text-sm font-medium">
                문자로 사진 링크를 보냈어요! 휴대폰을 확인해 주세요.
              </p>
            )}
            {downloadSuccess && (
              <p className="mb-4 text-sky-300 text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                사진이 컴퓨터 다운로드 폴더에 저장되었습니다!
              </p>
            )}
            
            <div className="mb-5">
              <label className="block text-white/80 mb-2 font-medium text-sm">나만의 멘트 (선택)</label>
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="예: 우리가족 사랑해!"
                className="w-full bg-black/30 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-amber-400 placeholder-white/30 text-sm"
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/80 font-medium text-sm">글자 색상</label>
                <button
                  type="button"
                  onClick={handlePickColor}
                  className="flex items-center px-2.5 py-1 bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/40 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                  title="사진 속 원하는 색상을 스포이드로 직접 찍어보세요"
                >
                  <Pipette className="w-3 h-3 mr-1 text-amber-400" />
                  스포이드
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-black/20 border border-white/15 rounded-xl">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setTextColor(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all shadow-md cursor-pointer ${color.class} ${
                      textColor.toLowerCase() === color.value.toLowerCase()
                        ? "border-amber-400 scale-125 ring-2 ring-amber-400/60"
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
                    className="w-6 h-6 rounded-full cursor-pointer opacity-0 absolute inset-0 z-10"
                    title="직접 색상 선택"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform"
                    style={{ background: textColor }}
                    title={`현재 색상: ${textColor} (클릭하여 직접 선택)`}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      +
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-white/80 mb-2 font-medium text-sm">글꼴 선택</label>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-xl p-2.5 text-white outline-none focus:border-amber-400 appearance-none cursor-pointer text-sm"
                  style={{ fontFamily: selectedFont }}
                >
                  {FONTS.map(font => (
                    <option key={font.id} value={font.value} className="bg-slate-800 text-white py-2" style={{ fontFamily: font.value }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium text-sm">글자 크기</label>
                <div className="h-[42px] flex items-center">
                  <input 
                    type="range" 
                    min="2" 
                    max="15" 
                    step="0.5"
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))} 
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="mb-5">
              <button
                onClick={handleDownload}
                disabled={!baseImage}
                className="w-full flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(14,165,233,0.4)] cursor-pointer"
              >
                <Download className="w-5 h-5 mr-2" />
                내 컴퓨터에 사진 다운로드
              </button>
            </div>

            {/* SMS Section */}
            <div className="mb-6 p-4 bg-black/20 border border-white/15 rounded-2xl">
              <label className="block text-white/80 mb-2 font-medium text-sm">휴대폰 번호 (선택)</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setSendError(null);
                  setSendSuccess(false);
                }}
                placeholder="010-1234-5678"
                className="w-full bg-black/30 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-amber-400 mb-3 placeholder-white/30 text-sm"
              />
              <button
                onClick={handleSendPhoto}
                disabled={isSending || !isPhoneValid || !baseImage}
                className="w-full flex items-center justify-center px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-base font-bold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                {isSending ? (
                  "문자 보내는 중..."
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 mr-2" />
                    문자로 사진 받기
                  </>
                )}
              </button>
              <p className="text-xs text-white/40 mt-2">
                입력하신 번호로 사진 다운로드 링크가 문자로 전송됩니다.
              </p>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handlePrint}
                disabled={isPrinting || !baseImage}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white text-xl font-bold rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 shadow-[0_0_20px_rgba(251,191,36,0.5)] cursor-pointer"
              >
                {isPrinting ? (
                  "인쇄 준비 중..."
                ) : (
                  <>
                    <Printer className="w-6 h-6 mr-2" />
                    진짜 인쇄하기!
                  </>
                )}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/result")}
                  className="flex items-center justify-center px-4 py-3.5 rounded-2xl border border-white/40 bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5 shrink-0" />
                  결과로 가기
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center justify-center px-4 py-3.5 bg-white/5 text-white/70 font-bold rounded-2xl text-sm hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4 mr-1.5 shrink-0" />
                  처음으로
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel - Glass Card */}
          <div className="lg:col-span-2 rounded-[2rem] border border-white/50 bg-white/15 p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col items-center justify-center">
            {message && (
              <p className="text-amber-300 font-medium mb-4 animate-pulse shrink-0 select-none text-sm">
                글자를 드래그해서 원하는 위치로 옮겨보세요!
              </p>
            )}

            {baseImage ? (
              <div 
                ref={containerRef}
                className="w-full relative rounded-xl overflow-hidden shadow-inner border-2 border-white/20 bg-black select-none"
                style={{ aspectRatio: '16/9', containerType: 'size' }}
              >
                <img src={baseImage} alt="Print background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                
                <div className="absolute top-3 right-3 bg-white/50 backdrop-blur-md rounded-xl p-2 shadow-lg pointer-events-none z-10">
                  <img src="/logo.png" alt="Logo" className="h-5 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>

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
        <div className="relative z-10 text-white font-semibold">Loading...</div>
      </div>
    }>
      <PrintContent />
    </Suspense>
  );
}
