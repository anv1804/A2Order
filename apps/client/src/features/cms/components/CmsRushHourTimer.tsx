import React, { useState, useEffect } from "react";
import { Panel } from "@/components/ui";
import { Pause, Square, Play } from "lucide-react";
import { toast } from "@/stores/notificationStore";

export const CmsRushHourTimer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [seconds, setSeconds] = useState(5048);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Panel
      variant="dark"
      padding="lg"
      className="flex flex-col justify-between relative overflow-hidden bg-brand-950 border-brand-900 shadow-elevated"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full object-cover" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,20 50,50 T100,50 L100,100 L0,100 Z" fill="#2E795E" />
          <path d="M0,70 Q25,40 50,70 T100,70 L100,100 L0,100 Z" fill="#1B4D3E" />
        </svg>
      </div>

      <div className="relative z-10">
        <span className="text-xs font-bold text-brand-200">Đồng Hồ Giờ Cao Điểm</span>
      </div>

      <div className="relative z-10 my-4 text-center">
        <span className="text-3xl sm:text-4xl font-black text-white tracking-widest font-mono">
          {formatTime(seconds)}
        </span>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => {
            setIsRunning(!isRunning);
            toast.info(isRunning ? "Đã tạm dừng đếm ca" : "Đã tiếp tục đếm ca");
          }}
          className="w-10 h-10 rounded-full bg-white text-brand-950 flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          {isRunning ? <Pause className="w-4 h-4 fill-brand-950" /> : <Play className="w-4 h-4 fill-brand-950" />}
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            toast.warning("Đã chốt giờ ca trưa!");
          }}
          className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Square className="w-4 h-4 fill-white" />
        </button>
      </div>
    </Panel>
  );
};
