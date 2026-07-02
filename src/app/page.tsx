"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Camera, ArrowRight, Wand2 } from "lucide-react";
import { useState } from "react";

const THEMES = [
  { id: "space", title: "우주 탐험", emoji: "🚀", desc: "별과 행성이 있는 신비로운 우주", color: "from-indigo-600 to-purple-600" },
  { id: "ocean", title: "바닷속 여행", emoji: "🐠", desc: "신비한 해양 생물들과 함께", color: "from-cyan-500 to-blue-500" },
  { id: "forest", title: "마법의 숲", emoji: "🌲", desc: "요정이 살 것 같은 신비한 숲", color: "from-emerald-500 to-teal-600" },
  { id: "city", title: "미래 도시", emoji: "🏙️", desc: "하늘을 나는 자동차와 로봇", color: "from-rose-500 to-orange-500" },
];

export default function Home() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [includePhoto, setIncludePhoto] = useState<boolean>(true);

  const handleStart = () => {
    if (!selectedTheme) return;
    
    if (includePhoto) {
      router.push(`/camera?theme=${selectedTheme}`);
    } else {
      sessionStorage.removeItem("capturedImage");
      router.push(`/prompt?theme=${selectedTheme}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 font-bold tracking-wider backdrop-blur-md">
          1단계: 세계 선택
        </span>
      </div>

      <div className="max-w-5xl w-full z-10 flex flex-col items-center">
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-6 shadow-2xl">
            <Sparkles className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400">
              우리가족 상상스케치
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-slate-300 font-medium">말로 그리는 우리 가족의 꿈</p>
        </div>

        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-500">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center flex items-center justify-center">
            <Wand2 className="w-6 h-6 mr-3 text-pink-400" />
            어떤 세계로 떠나볼까요?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`relative overflow-hidden group flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                  selectedTheme === theme.id 
                    ? 'border-white bg-white/20 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${theme.color}`} />
                <span className="text-6xl mb-4 drop-shadow-xl">{theme.emoji}</span>
                <h3 className="text-xl font-bold mb-2">{theme.title}</h3>
                <p className="text-sm text-slate-400 text-center">{theme.desc}</p>
                {selectedTheme === theme.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-purple-600 rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center space-y-6">
            <label className="flex items-center space-x-3 cursor-pointer group p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={includePhoto}
                  onChange={(e) => setIncludePhoto(e.target.checked)}
                  className="w-6 h-6 rounded-md border-2 border-pink-400 bg-transparent checked:bg-pink-500 checked:border-pink-500 appearance-none outline-none cursor-pointer transition-colors"
                />
                {includePhoto && <Sparkles className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />}
              </div>
              <span className="text-lg text-white font-medium select-none">
                웹캠으로 내 얼굴 합성하기 (선택)
              </span>
            </label>

            <button
              onClick={handleStart}
              disabled={!selectedTheme}
              className={`group relative flex items-center justify-center px-12 py-5 text-2xl font-bold rounded-full transition-all duration-300 overflow-hidden ${
                selectedTheme 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-105 shadow-[0_0_40px_rgba(79,70,229,0.5)]' 
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {selectedTheme && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              )}
              다음 단계로
              <ArrowRight className={`w-7 h-7 ml-3 transition-transform ${selectedTheme ? 'group-hover:translate-x-2 animate-pulse' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
