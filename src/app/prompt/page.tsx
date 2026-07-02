"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Wand2, RefreshCcw, ChevronDown, Loader2 } from "lucide-react";
import { Suspense } from "react";

const CATEGORY_OPTIONS = {
  medium: {
    label: "매체 및 스타일 (Medium & Style)",
    placeholder: "[매체/스타일]",
    options: [
      "디즈니 픽사 3D 애니메이션 (Disney Pixar 3D)",
      "지브리 스튜디오 수채화 (Studio Ghibli Watercolor)",
      "부드럽고 맑은 수채화 (Soft Watercolor)",
      "두꺼운 붓터치의 유화 (Impasto Oil Painting)",
      "레트로 픽셀 아트 (Retro Pixel Art)",
      "화려한 사이버펑크 네온 (Cyberpunk Neon)",
      "언리얼 엔진 5 극사실주의 (Unreal Engine 5 Hyperrealism)",
      "따뜻한 3D 클레이/점토 아트 (3D Clay Render)",
      "빈티지 코믹북 스타일 (Vintage Comic Book)",
      "단순하고 깔끔한 미니멀리스트 벡터 (Minimalist Vector)",
      "신비로운 판타지 일러스트 (Fantasy Illustration)"
    ]
  },
  subject: {
    label: "피사체 및 세부묘사 (Subject)",
    placeholder: "[피사체 및 세부묘사]",
    options: [
      "환하게 웃고 있는 다정한 우리 가족",
      "미래지향적인 우주복을 입은 귀여운 아이",
      "마법 지팡이를 든 숲속의 꼬마 요정",
      "최첨단 장비를 착용한 심해 탐험가",
      "망토를 두른 멋진 슈퍼히어로 가족",
      "동물 귀가 달린 귀여운 수인 캐릭터",
      "멋진 정장과 드레스를 입은 영화 주인공",
      "거대한 로봇에 탑승한 꼬마 조종사",
      "책을 읽으며 미소 짓는 마법사",
      "악기를 신나게 연주하는 밴드",
      "인물이 전혀 등장하지 않는 순수한 풍경"
    ]
  },
  background: {
    label: "배경 및 환경 (Background)",
    placeholder: "[배경/환경]",
    options: [
      "빛나는 별과 은하수가 끝없이 펼쳐진 우주",
      "형형색색의 산호초와 열대어가 가득한 바닷속",
      "거대한 버섯과 반딧불이가 빛나는 신비의 숲",
      "하늘을 나는 자동차가 오가는 사이버펑크 도시",
      "포근한 눈이 내리는 한겨울의 통나무집 앞",
      "무지개가 떠 있는 평화로운 들판",
      "오래된 책과 마법 도구가 가득한 마법사의 방",
      "사탕과 젤리로 만들어진 달콤한 과자 마을",
      "태양이 지고 있는 아름다운 열대의 해변",
      "홀로그램 간판이 번쩍이는 미래의 연구실"
    ]
  },
  composition: {
    label: "구도 및 카메라 (Composition)",
    placeholder: "[구도/카메라]",
    options: [
      "인물과 배경이 완벽히 조화로운 풀 샷 (Full Shot)",
      "웅장함이 느껴지는 로우 앵글 샷 (Low Angle)",
      "위에서 내려다보는 신선한 드론 뷰 (Bird's-eye view)",
      "생생한 표정이 돋보이는 클로즈업 샷 (Close-up)",
      "넓은 공간감을 주는 와이드 앵글 (Wide Angle)",
      "피사체에 집중되는 아웃포커싱 (Depth of Field / Bokeh)",
      "영화의 한 장면 같은 와이드스크린 구도 (Cinematic Aspect)",
      "주인공의 등 뒤에서 바라보는 시점 (Over the shoulder)",
      "대칭이 완벽하게 맞는 웨스 앤더슨 스타일 구도",
      "역동적이고 비스듬한 더치 앵글 (Dutch Angle)"
    ]
  },
  lighting: {
    label: "조명 및 색감 (Lighting)",
    placeholder: "[조명/색감]",
    options: [
      "따뜻하고 낭만적인 황금빛 노을 조명 (Golden Hour)",
      "신비롭고 몽환적인 푸른빛과 보라색 네온광 (Neon Lighting)",
      "부드럽고 화사한 파스텔 톤 자연광 (Soft Natural Light)",
      "강렬한 명암 대비로 입체감을 살린 시네마틱 라이팅",
      "등 뒤에서 빛이 뿜어져 나오는 극적인 역광 (Backlighting)",
      "차갑고 전문적인 느낌의 스튜디오 조명 (Studio Lighting)",
      "동화책처럼 알록달록하고 생동감 넘치는 색감 (Vibrant Colors)",
      "차분하고 감성적인 모노크롬/흑백 (Monochrome)",
      "마법적인 빛의 가루가 흩날리는 신비로운 효과 (Magical Glowing)",
      "새벽의 상쾌함을 담은 블루 아워 조명 (Blue Hour)"
    ]
  },
  quality: {
    label: "기술적 제어 및 품질 (Quality)",
    placeholder: "[품질 키워드]",
    options: [
      "8k 해상도, 완벽한 걸작, 극강의 디테일 (8k resolution, masterpiece)",
      "선명한 포커스, 눈부신 색채, 하이엔드 렌더링 (sharp focus, vibrant)",
      "수상작 수준의 일러스트레이션, 프로페셔널 아트 (award winning)",
      "동화책 표지 퀄리티, 따뜻한 감성 (storybook cover quality)",
      "초현실주의 사진 퀄리티, 사실적인 텍스처 (photorealistic, 4k)",
      "부드러운 블렌딩, 깔끔한 라인워크 (smooth blending, clean linework)"
    ]
  }
};

const DEFAULT_TEMPLATE = "[매체/스타일]로 표현된 [피사체 및 세부묘사]의 모습입니다. 배경은 [배경/환경]으로 꾸며져 있고, [구도/카메라]로 연출되었습니다. [조명/색감]이 전체적인 분위기를 더해주며 최고의 화질([품질 키워드])을 보여줍니다.";

function PromptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme") || "space";
  
  const [prompt, setPrompt] = useState(DEFAULT_TEMPLATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selections, setSelections] = useState({
    medium: "",
    subject: "",
    background: "",
    composition: "",
    lighting: "",
    quality: ""
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.removeItem("capturedImage");
        router.push("/");
      }, 120000); 
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [router]);

  const handleSelectChange = (category: keyof typeof CATEGORY_OPTIONS, value: string) => {
    setSelections(prev => ({ ...prev, [category]: value }));
    
    setPrompt(prevPrompt => {
      const placeholder = CATEGORY_OPTIONS[category].placeholder;
      let newPrompt = prevPrompt;
      
      if (selections[category] && newPrompt.includes(selections[category])) {
        newPrompt = newPrompt.replace(selections[category], value);
      } 
      else if (newPrompt.includes(placeholder)) {
        newPrompt = newPrompt.replace(placeholder, value);
      }
      else {
        newPrompt += ` ${value}`;
      }
      return newPrompt;
    });
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsSubmitting(true);
    
    sessionStorage.setItem("userPrompt", prompt);
    sessionStorage.setItem("userTheme", theme);
    sessionStorage.removeItem("bgImage"); // Clear old cache

    router.push("/result");
  };

  const handleReset = () => {
    setPrompt(DEFAULT_TEMPLATE);
    setSelections({ medium: "", subject: "", background: "", composition: "", lighting: "", quality: "" });
  };

  return (
    <main className="min-h-screen bg-slate-900 p-6 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-6 left-6 z-20">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          3단계: 상상 스케치 설정
        </span>
      </div>

      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-600/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[150px]" />

      <div className="w-full max-w-7xl h-[85vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center shrink-0">
          <Wand2 className="w-8 h-8 mr-3 text-pink-400" />
          상상하는 모습을 자세히 알려주세요!
        </h1>
        <p className="text-slate-300 text-lg mb-8 shrink-0">
          왼쪽 메뉴에서 6가지 요소를 선택하면, 오른쪽에 마법의 주문이 완성됩니다.
        </p>

        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
          {/* Left Column: Dropdowns */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
            {(Object.keys(CATEGORY_OPTIONS) as Array<keyof typeof CATEGORY_OPTIONS>).map((key) => {
              const cat = CATEGORY_OPTIONS[key];
              return (
                <div key={key} className="flex flex-col bg-black/20 p-4 rounded-2xl border border-white/5">
                  <label className="text-white/90 text-sm font-bold mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-pink-500 mr-2"></span>
                    {cat.label}
                  </label>
                  <div className="relative">
                    <select
                      value={selections[key]}
                      onChange={(e) => handleSelectChange(key, e.target.value)}
                      className="w-full appearance-none bg-black/50 border border-white/20 text-white text-base rounded-xl px-4 py-3 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all cursor-pointer hover:bg-black/70"
                    >
                      <option value="" disabled hidden>{cat.placeholder} 선택하기</option>
                      {cat.options.map((opt, idx) => (
                        <option key={idx} value={opt} className="bg-slate-800 text-white py-2">
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Prompt & Submit */}
          <div className="flex-1 flex flex-col">
            <div className="bg-black/40 rounded-3xl p-6 flex-1 flex flex-col border border-white/10 shadow-inner">
              <h3 className="text-white/80 font-bold text-lg mb-4 flex justify-between items-center">
                <span>완성된 마법 주문 (프롬프트)</span>
                <button 
                  onClick={handleReset}
                  className="text-white/50 hover:text-white flex items-center text-sm transition-colors font-normal px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  템플릿 초기화
                </button>
              </h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full flex-1 bg-transparent text-white text-xl md:text-2xl outline-none resize-none placeholder-white/30 leading-relaxed"
                placeholder="마법 주문을 직접 수정할 수도 있어요..."
              />
            </div>

            <div className="mt-6 flex gap-4 shrink-0">
              <button
                onClick={() => router.push(`/camera?theme=${theme}`)}
                className="flex items-center justify-center px-6 py-6 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors"
              >
                이전 단계
              </button>
              <button
                onClick={handleGenerate}
                disabled={!prompt || isSubmitting}
                className={`flex-1 flex items-center justify-center py-6 text-2xl font-bold rounded-2xl transition-all duration-300 ${
                  prompt && !isSubmitting
                    ? "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white hover:scale-[1.02] shadow-[0_0_40px_rgba(236,72,153,0.5)]"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse flex items-center">
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    마법 그리는 중...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-8 h-8 mr-3" />
                    이대로 마법 그리기 시작!
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </main>
  );
}

export default function PromptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <PromptContent />
    </Suspense>
  );
}
