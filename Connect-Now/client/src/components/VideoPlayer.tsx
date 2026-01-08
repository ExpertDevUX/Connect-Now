import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  isLocal?: boolean;
  className?: string;
  label?: string;
}

export function VideoPlayer({ stream, muted = false, isLocal = false, className, label }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-black/50 border border-white/5 shadow-2xl group", className)}>
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white/20">{label?.[0] || "?"}</span>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted} // Always mute local video to prevent feedback
        className={cn(
          "w-full h-full object-cover transition-transform duration-500", 
          isLocal && "scale-x-[-1]" // Mirror local video
        )}
      />
      
      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-sm pointer-events-none">
        {label || (isLocal ? "You" : "Remote")} {muted && "(Muted)"}
      </div>
    </div>
  );
}
