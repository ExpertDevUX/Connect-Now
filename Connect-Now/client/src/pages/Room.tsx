import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useRoom } from "@/hooks/use-rooms";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Copy, Check, Users, Signal, Loader2, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Room() {
  const [, params] = useRoute("/room/:id");
  const [, setLocation] = useLocation();
  const roomId = params?.id || "";
  
  const { data: room, isLoading } = useRoom(roomId);
  const { localStream, remoteStream, connectionStatus, toggleAudio, toggleVideo, updateNickname } = useWebRTC(roomId);
  
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    const handleParticipantsUpdate = (e: any) => {
      setParticipants(e.detail);
    };
    window.addEventListener('participants-updated', handleParticipantsUpdate);
    return () => window.removeEventListener('participants-updated', handleParticipantsUpdate);
  }, []);

  useEffect(() => {
    if (joined && nickname) {
      updateNickname(nickname);
    }
  }, [joined, nickname, updateNickname]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) setIsVerified(true);
      else alert("Invalid password");
    } finally {
      setVerifying(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      setJoined(true);
    }
  };

  const handleToggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    toggleAudio(!audioEnabled);
  };

  const handleToggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    toggleVideo(!videoEnabled);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Joining room...</p>
        </div>
      </div>
    );
  }

  if (!room && !isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (room?.password && !isVerified) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-card rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-display tracking-tight">Private Room</h2>
            <p className="text-muted-foreground">This room is password protected.</p>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-secondary/50 border-transparent focus:border-primary/50"
              autoFocus
            />
            <Button type="submit" className="w-full h-12 bg-primary font-semibold" disabled={verifying}>
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Room"}
            </Button>
          </form>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation("/")}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 bg-card rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-display tracking-tight">Ready to join?</h2>
            <p className="text-muted-foreground">Enter your nickname to enter the room.</p>
          </div>
          <form onSubmit={handleJoinMeeting} className="space-y-4">
            <Input
              placeholder="Your Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-12 bg-secondary/50 border-transparent focus:border-primary/50"
              autoFocus
              required
            />
            <div className="flex gap-4">
              <Button
                type="button"
                variant={audioEnabled ? "outline" : "destructive"}
                className="flex-1 h-12"
                onClick={handleToggleAudio}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              <Button
                type="button"
                variant={videoEnabled ? "outline" : "destructive"}
                className="flex-1 h-12"
                onClick={handleToggleVideo}
              >
                {videoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            </div>
            <Button type="submit" className="w-full h-12 bg-primary font-semibold">
              Join Meeting
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black/95 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-lg z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">{room?.name || "Meeting"}</h1>
          <div className="h-4 w-px bg-white/10" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-white gap-2 h-8"
            onClick={copyRoomId}
          >
            <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">{roomId}</span>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium">
            <Signal className={cn("w-3.5 h-3.5", connectionStatus === 'connected' ? "text-green-500" : "text-yellow-500")} />
            <span className="capitalize">{connectionStatus}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{remoteStream ? participants.length + 1 : 1}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <main className="flex-1 p-4 md:p-6 relative flex items-center justify-center gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {remoteStream ? (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex-1 h-full max-h-[calc(100vh-160px)] w-full max-w-5xl relative"
              >
                <VideoPlayer 
                  stream={remoteStream} 
                  isLocal={false} 
                  className="w-full h-full bg-zinc-900 border-zinc-800"
                  label="Remote Peer"
                />
              </motion.div>
            ) : (
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-3xl h-full max-h-[600px] w-full max-w-4xl bg-white/5"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                  <Users className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-medium mb-2">Waiting for others to join...</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Share the room ID with someone to start the video call.
                </p>
                <Button onClick={copyRoomId} variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Room ID
                </Button>
              </motion.div>
            )}

            <motion.div 
              layout
              className={cn(
                "overflow-hidden shadow-2xl transition-all duration-500 ease-spring",
                remoteStream 
                  ? "absolute bottom-6 right-6 w-48 md:w-64 aspect-video rounded-xl border-2 border-white/10 z-20" 
                  : "w-full max-w-2xl aspect-video rounded-3xl border-2 border-white/10"
              )}
            >
               <VideoPlayer 
                  stream={localStream} 
                  isLocal={true} 
                  className="w-full h-full bg-zinc-800"
                  label={nickname || "You"}
                />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Participants Sidebar */}
        <aside className="w-64 border-l border-white/5 bg-black/20 backdrop-blur-lg hidden lg:flex flex-col p-4">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Participants</h2>
          </div>
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-primary/50" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{nickname} (You)</span>
                <span className="text-[10px] text-green-500">Active</span>
              </div>
            </div>
            {participants.map((p, i) => (
              <div key={`${p.id}-${i}`} className="flex items-center gap-3">
                <UserCircle className="w-8 h-8 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{p.name || "Guest"}</span>
                  <span className="text-[10px] text-muted-foreground">Participant</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Control Bar */}
      <footer className="h-24 flex items-center justify-center gap-4 relative z-20">
        <div className="p-3 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-2 md:gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={audioEnabled ? "ghost" : "destructive"}
                className={cn("rounded-xl h-12 w-12 p-0", audioEnabled && "bg-white/5 hover:bg-white/10")}
                onClick={handleToggleAudio}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={videoEnabled ? "ghost" : "destructive"}
                className={cn("rounded-xl h-12 w-12 p-0", videoEnabled && "bg-white/5 hover:bg-white/10")}
                onClick={handleToggleVideo}
              >
                {videoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <Button
            size="lg"
            variant="destructive"
            className="rounded-xl h-12 px-6 gap-2 font-semibold shadow-lg shadow-red-500/20"
            onClick={leaveRoom}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden md:inline">End Call</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
