"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, ChevronDown, ArrowLeft, Check, Image as ImageIcon, Heart, Palette, Compass, SunMedium, Scroll } from "lucide-react";
import { Suspense } from "react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { cn } from "@/lib/utils";

type OptionItem = {
  label: string;
  value: string;
  image?: string;
  desc?: string;
};

const CATEGORY_DATA: Record<string, { label: string; placeholder: string; icon: any; options: OptionItem[] }> = {
  medium: {
    label: "화풍 및 스타일 (어떤 느낌으로 그릴까요?)",
    placeholder: "화풍 선택하기",
    icon: Palette,
    options: [
      {
        label: "🎬 디즈니 3D 만화",
        value: "디즈니 픽사 3D 애니메이션 (Disney Pixar 3D)",
        image: "/samples/disney_3d.jpg",
        desc: "토이스토리 같은 생생한 입체 3D",
      },
      {
        label: "🌿 지브리 수채화",
        value: "지브리 스튜디오 수채화 (Studio Ghibli Watercolor)",
        image: "/samples/ghibli.jpg",
        desc: "이웃집 토토로 같은 따뜻한 수채화",
      },
      {
        label: "👾 레트로 픽셀 게임",
        value: "레트로 픽셀 아트 (Retro Pixel Art)",
        image: "/samples/pixel.jpg",
        desc: "마인크래프트·도트 게임 속 세상",
      },
      {
        label: "⚡ 사이버 네온",
        value: "화려한 사이버펑크 네온 (Cyberpunk Neon)",
        image: "/samples/cyberpunk.jpg",
        desc: "반짝이는 홀로그램과 미래 네온빛",
      },
      {
        label: "🧸 귀여운 점토 3D",
        value: "따뜻한 3D 클레이/점토 아트 (3D Clay Render)",
        image: "/samples/clay.jpg",
        desc: "말랑말랑 만지고 싶은 클레이 애니메이션",
      },
      {
        label: "🔮 마법 판타지",
        value: "신비로운 판타지 일러스트 (Fantasy Illustration)",
        image: "/samples/fantasy.jpg",
        desc: "신비한 마법 숲과 요정 이야기책",
      },
      {
        label: "🖌️ 맑은 수채화",
        value: "부드럽고 맑은 수채화 (Soft Watercolor)",
        desc: "투명하고 맑은 감성 일러스트",
      },
      {
        label: "🖼️ 생생한 유화",
        value: "두꺼운 붓터치의 유화 (Impasto Oil Painting)",
        desc: "캔버스에 붓으로 듬뿍 그린 명작",
      },
      {
        label: "🦸 코믹북 만화",
        value: "빈티지 코믹북 스타일 (Vintage Comic Book)",
        desc: "멋진 히어로 만화책 스타일",
      },
      {
        label: "📸 초고화질 실사",
        value: "언리얼 엔진 5 극사실주의 (Unreal Engine 5 Hyperrealism)",
        desc: "실제 사진처럼 정교한 3D",
      },
      {
        label: "✏️ 심플 벡터 아트",
        value: "단순하고 깔끔한 미니멀리스트 벡터 (Minimalist Vector)",
        desc: "깔끔하고 귀여운 캐릭터 그래픽",
      },
    ],
  },
  subject: {
    label: "주인공 (누가 등장하나요?)",
    placeholder: "주인공 선택하기",
    icon: Heart,
    options: [
      {
        label: "👨‍👩‍👧‍👦 다정한 우리 가족",
        value: "환하게 웃고 있는 다정한 우리 가족",
        desc: "가족 모두가 행복하게 웃는 모습",
      },
      {
        label: "🚀 멋진 우주 탐험가",
        value: "미래지향적인 우주복을 입은 귀여운 아이",
        desc: "우주복을 입고 우주를 누비는 모습",
      },
      {
        label: "🧚 숲속의 꼬마 요정",
        value: "마법 지팡이를 든 숲속의 꼬마 요정",
        desc: "날개와 마법 지팡이가 있는 요정",
      },
      {
        label: "🤿 신비한 바다 탐험가",
        value: "최첨단 장비를 착용한 심해 탐험가",
        desc: "잠수 장비로 바닷속을 탐험하는 모습",
      },
      {
        label: "🦸 멋진 슈퍼히어로",
        value: "망토를 두른 멋진 슈퍼히어로 가족",
        desc: "망토를 휘날리며 지구를 지키는 영웅",
      },
      {
        label: "🐱 귀여운 동물 친구",
        value: "동물 귀가 달린 귀여운 수인 캐릭터",
        desc: "앙증맞은 동물 귀와 꼬리가 달린 모습",
      },
      {
        label: "🤖 거대 로봇 조종사",
        value: "거대한 로봇에 탑승한 꼬마 조종사",
        desc: "로봇 콕핏에서 활약하는 멋진 조종사",
      },
      {
        label: "🧙 신비한 마법사",
        value: "책을 읽으며 미소 짓는 마법사",
        desc: "신비한 마법 책과 모자를 쓴 마법사",
      },
      {
        label: "🎸 신나는 락밴드",
        value: "악기를 신나게 연주하는 밴드",
        desc: "신나게 악기를 연주하는 밴드 스타",
      },
      {
        label: "🏞️ 자연 풍경 (인물 없음)",
        value: "인물이 전혀 등장하지 않는 순수한 풍경",
        desc: "사람 없이 자연과 배경만 아름답게",
      },
    ],
  },
  background: {
    label: "배경 장소 (어디에 있나요?)",
    placeholder: "배경 선택하기",
    icon: Compass,
    options: [
      {
        label: "🌌 별빛 은하수 우주",
        value: "빛나는 별과 은하수가 끝없이 펼쳐진 우주",
        desc: "신비로운 행성과 반짝이는 별무리",
      },
      {
        label: "🐠 신비한 바닷속 세상",
        value: "형형색색의 산호초와 열대어가 가득한 바닷속",
        desc: "물고기와 산호초가 헤엄치는 바다",
      },
      {
        label: "🍄 반딧불이 마법 숲",
        value: "거대한 버섯과 반딧불이가 빛나는 신비의 숲",
        desc: "거대한 버섯과 요정들이 사는 숲",
      },
      {
        label: "🏙️ 하늘을 나는 미래도시",
        value: "하늘을 나는 자동차가 오가는 사이버펑크 도시",
        desc: "날아다니는 자동차와 드높은 빌딩",
      },
      {
        label: "❄️ 눈 내리는 겨울 오두막",
        value: "포근한 눈이 내리는 한겨울의 통나무집 앞",
        desc: "소복이 눈이 쌓인 따스한 통나무집",
      },
      {
        label: "🌈 무지개 언덕 들판",
        value: "무지개가 떠 있는 평화로운 들판",
        desc: "푸른 잔디와 하늘에 걸린 무지개",
      },
      {
        label: "🍭 달콤한 사탕·과자 마을",
        value: "사탕과 젤리로 만들어진 달콤한 과자 마을",
        desc: "막대사탕과 초콜릿으로 지어진 동화 마을",
      },
      {
        label: "🏖️ 노을빛 열대 해변",
        value: "태양이 지고 있는 아름다운 열대의 해변",
        desc: "야자수와 황금빛으로 물든 모래사장",
      },
      {
        label: "🔮 비밀의 마법 연구실",
        value: "오래된 책과 마법 도구가 가득한 마법사의 방",
        desc: "신비한 마법 물약과 비밀 책들이 가득한 방",
      },
      {
        label: "🔬 최첨단 과학 실험실",
        value: "홀로그램 간판이 번쩍이는 미래의 연구실",
        desc: "홀로그램과 로봇 팔이 있는 과학실",
      },
    ],
  },
  composition: {
    label: "그림 구도 (어떻게 바라볼까요?)",
    placeholder: "구도 선택하기",
    icon: Compass,
    options: [
      {
        label: "🧍 온몸이 다 보이는 모습",
        value: "인물과 배경이 완벽히 조화로운 풀 샷 (Full Shot)",
        desc: "머리부터 발끝까지 배경과 함께",
      },
      {
        label: "🌟 멋지게 올려다보기",
        value: "웅장함이 느껴지는 로우 앵글 샷 (Low Angle)",
        desc: "영웅처럼 당당하고 웅장한 각도",
      },
      {
        label: "🦅 하늘에서 내려다보기",
        value: "위에서 내려다보는 신선한 드론 뷰 (Bird's-eye view)",
        desc: "새처럼 높은 곳에서 내려다보는 시원한 각도",
      },
      {
        label: "😊 환한 표정 클로즈업",
        value: "생생한 표정이 돋보이는 클로즈업 샷 (Close-up)",
        desc: "웃는 얼굴과 눈빛이 돋보이는 구도",
      },
      {
        label: "🎬 영화 같은 넓은 와이드",
        value: "영화의 한 장면 같은 와이드스크린 구도 (Cinematic Aspect)",
        desc: "극장 영화처럼 파노라마로 넓게",
      },
      {
        label: "🔍 주인공에게만 집중",
        value: "피사체에 집중되는 아웃포커싱 (Depth of Field / Bokeh)",
        desc: "배경을 부드럽게 흐려 주인공 강조",
      },
    ],
  },
  lighting: {
    label: "조명과 색감 (어떤 빛을 비출까요?)",
    placeholder: "조명 선택하기",
    icon: SunMedium,
    options: [
      {
        label: "🌅 따스한 황금빛 노을",
        value: "따뜻하고 낭만적인 황금빛 노을 조명 (Golden Hour)",
        desc: "포근하고 감성적인 주황빛 햇살",
      },
      {
        label: "✨ 반짝이는 보라·파랑 네온",
        value: "신비롭고 몽환적인 푸른빛과 보라색 네온광 (Neon Lighting)",
        desc: "미래적이고 신비로운 밤빛",
      },
      {
        label: "☀️ 맑고 화사한 햇살",
        value: "부드럽고 화사한 파스텔 톤 자연광 (Soft Natural Light)",
        desc: "맑은 날 오후의 투명한 자연 햇살",
      },
      {
        label: "🎆 반짝이는 마법 가루",
        value: "마법적인 빛의 가루가 흩날리는 신비로운 효과 (Magical Glowing)",
        desc: "반딧불이와 요정 가루가 반짝반짝",
      },
      {
        label: "🎨 알록달록 생생한 무지개",
        value: "동화책처럼 알록달록하고 생동감 넘치는 색감 (Vibrant Colors)",
        desc: "선명하고 밝은 기분 좋은 색채",
      },
      {
        label: "🌙 푸르스름한 새벽빛",
        value: "새벽의 상쾌함을 담은 블루 아워 조명 (Blue Hour)",
        desc: "신비롭고 차분한 파란 새벽 하늘빛",
      },
    ],
  },
  quality: {
    label: "화질 완성도",
    placeholder: "화질 선택하기",
    icon: Sparkles,
    options: [
      {
        label: "🏆 초고화질 최고 명작 (8k 디테일)",
        value: "8k resolution, masterpiece, intricate detail, highly detailed",
        desc: "디테일이 살아있는 최고 등급 작품",
      },
      {
        label: "💎 선명하고 또렷한 렌더링",
        value: "sharp focus, vibrant lighting, ultra-detailed masterpiece",
        desc: "눈부신 색감과 선명한 화질",
      },
      {
        label: "📖 명작 동화책 표지 감성",
        value: "storybook cover quality, warm fairytale atmosphere, award winning art",
        desc: "소장하고 싶은 포근한 동화책 퀄리티",
      },
      {
        label: "🥇 세계적인 수상작 일러스트",
        value: "award winning masterpiece, professional illustration, exquisite lighting",
        desc: "프로 화가가 공들여 그린 퀄리티",
      },
    ],
  },
};

type Selections = {
  medium: string;
  subject: string;
  background: string;
  composition: string;
  lighting: string;
  quality: string;
};

const initialSelections: Selections = {
  medium: CATEGORY_DATA.medium.options[0].value,
  subject: CATEGORY_DATA.subject.options[0].value,
  background: CATEGORY_DATA.background.options[0].value,
  composition: CATEGORY_DATA.composition.options[0].value,
  lighting: CATEGORY_DATA.lighting.options[0].value,
  quality: CATEGORY_DATA.quality.options[0].value,
};

// Internal prompt builder for high-quality synthesis
const buildInternalPrompt = (sel: Selections, hasCapturedPhoto: boolean = true) => {
  const m = sel.medium;
  const s = sel.subject;
  const b = sel.background;
  const c = sel.composition;
  const l = sel.lighting;
  const q = sel.quality;

  if (hasCapturedPhoto) {
    return `입력된 인물의 얼굴 형태와 고유 특징을 바탕으로 ${m} 화풍으로 완벽하게 재창조된 ${s}의 모습입니다. 인물과 이질감 없이 완전히 융합된 ${b} 배경을 바탕으로, ${c} 구도로 연출되었습니다. ${l}의 빛과 색채가 인물과 배경 전체에 동일하게 적용되어 완벽한 일체감을 주며, 최고의 화질(${q})을 보여주는 아름다운 마법 일러스트 걸작입니다.`;
  }

  return `${m} 화풍으로 표현된 ${s}의 모습입니다. ${b} 배경을 바탕으로, ${c} 구도로 연출되었습니다. ${l}의 빛과 색채가 전체적인 분위기를 더해주며 최고의 화질(${q})을 보여주는 아름다운 마법 일러스트 걸작입니다.`;
};

function PromptContent() {
  useIdleTimeout();
  const router = useRouter();
  
  const [hasPhoto, setHasPhoto] = useState(true);
  const [selections, setSelections] = useState<Selections>(initialSelections);

  useEffect(() => {
    const photo = sessionStorage.getItem("capturedImage");
    const photoExists = !!photo;
    setHasPhoto(photoExists);
  }, []);

  const handleSelectChange = (category: keyof Selections, fullValue: string) => {
    const updatedSelections = { ...selections, [category]: fullValue };
    setSelections(updatedSelections);
  };

  // Dynamically constructed full prompt from current selections
  const currentPrompt = useMemo(() => {
    return buildInternalPrompt(selections, hasPhoto);
  }, [selections, hasPhoto]);

  const handleGenerate = () => {
    sessionStorage.setItem("userPrompt", currentPrompt);
    sessionStorage.setItem("userTheme", "fantasy");
    sessionStorage.removeItem("bgImage");

    router.push("/result");
  };

  const handlePrev = () => {
    const hasCapturedImage = !!sessionStorage.getItem("capturedImage");
    if (hasCapturedImage) {
      router.push("/camera");
    } else {
      router.push("/");
    }
  };

  // Find label items for warm UI preview
  const activeMediumItem = CATEGORY_DATA.medium.options.find(
    (opt) => opt.value === selections.medium
  ) || CATEGORY_DATA.medium.options[0];

  // Clean medium name for emotion message
  const mediumShortName = activeMediumItem.label.replace(/^[^\s]+\s*/, '');

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-6">
      {/* Soft Sky Watercolor Backdrop */}
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

      <div className="relative z-10 w-full max-w-7xl flex flex-col" style={{ height: '92vh' }}>
        {/* Step Badge */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 bg-white/90 border border-amber-200/80 rounded-full text-amber-900 font-bold text-xs backdrop-blur-md shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {hasPhoto ? "3단계: 상상 스케치 설정" : "2단계: 상상 스케치 설정"}
            </span>
            {hasPhoto && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 bg-rose-100/90 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                ✨ 얼굴 사진 변신 준비 완료
              </span>
            )}
          </div>
        </div>

        {/* High-contrast Warm Glassmorphism Main Panel */}
        <div className="flex-1 min-h-0 rounded-[28px] border border-white/95 bg-white/88 p-5 shadow-[0_16px_40px_-12px_rgba(100,70,30,0.15)] backdrop-blur-xl md:p-7 flex flex-col">
          {/* Header */}
          <div className="mb-4 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-stone-800 flex items-center">
                <Wand2 className="w-6 h-6 mr-2 text-amber-500" />
                마음에 드는 그림의 모습을 골라주세요!
              </h1>
              <p className="text-stone-500 text-xs md:text-sm mt-0.5 font-medium">
                화풍과 배경을 고르면, 우리 가족만의 특별한 마법 동화책이 펼쳐집니다.
              </p>
            </div>
          </div>

          {/* Main 2-column layout */}
          <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
            {/* Left Column: Visual Style Cards + Easy Selectors */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 warm-scrollbar">
              {/* Visual Style Showcase with Example Photos */}
              <div className="bg-white/90 p-4 rounded-2xl border border-amber-200/60 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-stone-800 font-bold text-sm flex items-center">
                    <ImageIcon className="w-4 h-4 text-amber-500 mr-1.5" />
                    대표 화풍 예시 (터치해서 바로 선택!)
                  </label>
                  <span className="text-xs text-stone-400">사진을 누르면 화풍이 바뀝니다</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CATEGORY_DATA.medium.options.filter((opt) => opt.image).map((opt) => {
                    const isSelected = selections.medium === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectChange("medium", opt.value)}
                        className={cn(
                          "group relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer flex flex-col text-left",
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-400/40 scale-[1.02] shadow-md shadow-amber-500/20 bg-amber-50/50"
                            : "border-stone-200/80 bg-white hover:border-amber-300 hover:scale-[1.01] shadow-xs"
                        )}
                      >
                        <div className="aspect-square w-full relative overflow-hidden bg-stone-100">
                          {opt.image && (
                            <img
                              src={opt.image}
                              alt={opt.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/85 via-stone-900/40 to-transparent p-2 pt-4">
                            <span className="text-white font-bold text-xs block truncate drop-shadow-xs">
                              {opt.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Child-friendly Detail Selectors */}
              {(Object.keys(CATEGORY_DATA) as Array<keyof Selections>).map((key) => {
                const cat = CATEGORY_DATA[key];
                const selectedOpt = cat.options.find((o) => o.value === selections[key]);
                const IconComponent = cat.icon;

                return (
                  <div key={key} className="flex flex-col bg-white/90 p-3.5 rounded-2xl border border-stone-200/70 hover:border-amber-300/80 transition-all shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-stone-800 text-sm font-bold flex items-center">
                        <IconComponent className="w-4 h-4 text-amber-500 mr-2 shrink-0" />
                        {cat.label}
                      </label>
                      {selectedOpt?.desc && (
                        <span className="text-xs text-amber-700/80 truncate max-w-[200px] font-medium">
                          {selectedOpt.desc}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={selections[key]}
                        onChange={(e) => handleSelectChange(key, e.target.value)}
                        className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-800 text-sm font-semibold rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200/50 transition-all cursor-pointer hover:border-stone-300"
                      >
                        {cat.options.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-white text-stone-800 py-2">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Warm Emotion Sketchbook Preview with Live Prompt */}
            <div className="flex-1 flex flex-col gap-3.5">
              {/* Active Style Visual Spotlight Card */}
              {activeMediumItem && activeMediumItem.image && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-rose-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3.5 shrink-0 shadow-xs">
                  <img
                    src={activeMediumItem.image}
                    alt={activeMediumItem.label}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-amber-300 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-1 border border-amber-200/60">
                      선택된 화풍
                    </div>
                    <h3 className="text-base font-bold text-stone-800 truncate">{activeMediumItem.label}</h3>
                    <p className="text-xs text-stone-600 truncate font-medium">{activeMediumItem.desc}</p>
                  </div>
                </div>
              )}

              {/* Warm Fairy Tale Magic Sketchbook Note Card */}
              <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF6EE] rounded-2xl p-5 flex-1 flex flex-col border border-amber-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-amber-200/50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-stone-800 font-bold text-sm md:text-base">
                      상상 마법 스케치북 미리보기
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-800 border border-amber-200/60">
                    준비 완료 ✨
                  </span>
                </div>

                {/* Emotional Guideline Header */}
                <div className="flex items-center gap-3 mb-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200/60">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-xs shrink-0">
                    <Wand2 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-extrabold text-amber-950 font-display leading-tight">
                      가족의 따뜻한 미소를 {mediumShortName} 마법 세계로 옮기고 있어요 ✨
                    </h3>
                    <p className="text-xs text-amber-800/80 font-medium mt-0.5">
                      아래 마법 주문서(프롬프트)에 맞춰 AI가 그림을 그려냅니다.
                    </p>
                  </div>
                </div>

                {/* Prompt Display Card (Replaces option tags as requested) */}
                <div className="flex-1 flex flex-col p-4 bg-white/95 rounded-xl border border-amber-200/80 shadow-inner overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-amber-800">
                    <Scroll className="w-3.5 h-3.5 text-amber-600" />
                    <span>완성된 마법 주문 (프롬프트)</span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 warm-scrollbar">
                    <p className="text-stone-700 text-xs md:text-sm leading-relaxed font-medium whitespace-pre-wrap select-text bg-[#FAF8F5] p-3 rounded-lg border border-stone-200/60">
                      {currentPrompt}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-[0.75rem] text-stone-400 font-medium">
                    '마법 그리기 시작' 버튼을 누르면 위 주문에 맞춰 멋진 그림이 완성됩니다.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={handlePrev}
                  className="flex items-center justify-center px-5 py-3.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  이전으로
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 flex items-center justify-center py-3.5 text-base md:text-lg font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  이대로 마법 그리기 시작!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PromptPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-screen items-center justify-center">
        <img src="/ghibli-sky.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 text-stone-800 font-bold bg-white/80 px-6 py-3 rounded-full backdrop-blur-md">마법 설정을 불러오는 중...</div>
      </div>
    }>
      <PromptContent />
    </Suspense>
  );
}
