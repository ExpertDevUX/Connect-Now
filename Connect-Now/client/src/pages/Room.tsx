import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useRoom } from "@/hooks/use-rooms";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Copy, Check, Users, Signal, Loader2, UserCircle, MonitorUp, MonitorOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Room() {
  const [, params] = useRoute("/room/:id");
  const [, setLocation] = useLocation();
  const roomId = params?.id || "";
  
  const { data: room, isLoading } = useRoom(roomId);
  const { localStream, remoteStream, screenStream, connectionStatus, toggleAudio, toggleVideo, startScreenShare, stopScreenShare, updateNickname, isBoss } = useWebRTC(roomId);
  
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [captions, setCaptions] = useState("");
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const stream = await startScreenShare();
      if (stream) setIsScreenSharing(true);
    }
  };

  const [targetLang, setTargetLang] = useState('en');

  const translateText = async (text: string, lang: string) => {
    if (!text || lang === 'en') return text;
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0][0][0];
    } catch (err) {
      console.error("Translation error:", err);
      return text;
    }
  };

  useEffect(() => {
    if (!showCC) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          const translated = await translateText(transcript, targetLang);
          setCaptions(translated);
        }
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [showCC, targetLang]);

  useEffect(() => {
    const handleParticipantsUpdate = (e: any) => {
      setParticipants(e.detail);
    };
    const handlePeerMuteStatus = (e: any) => {
      const { peerId, payload } = e.detail;
      setParticipants(prev => {
        const updated = prev.map(p => 
          p.id === peerId ? { ...p, audioEnabled: payload.audio } : p
        );
        console.log("Updated participants mute status:", updated);
        return updated;
      });
    };
    window.addEventListener('participants-updated', handleParticipantsUpdate);
    window.addEventListener('peer-mute-status', handlePeerMuteStatus);
    return () => {
      window.removeEventListener('participants-updated', handleParticipantsUpdate);
      window.removeEventListener('peer-mute-status', handlePeerMuteStatus);
    };
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
                <div className="relative">
                  <UserCircle className="w-8 h-8 text-muted-foreground" />
                  {p.audioEnabled === false && (
                    <div className="absolute -bottom-1 -right-1 bg-destructive rounded-full p-0.5 border border-black">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {p.name || "Guest"} {p.audioEnabled === false && <span className="text-[10px] text-destructive ml-1">(Muted)</span>}
                  </span>
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

          {isBoss && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant={isScreenSharing ? "destructive" : "ghost"}
                  className={cn("rounded-xl h-12 w-12 p-0", !isScreenSharing && "bg-white/5 hover:bg-white/10")}
                  onClick={handleToggleScreenShare}
                >
                  {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isScreenSharing ? "Stop Sharing" : "Share Screen"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={showCC ? "outline" : "ghost"}
                className={cn("rounded-xl h-12 w-12 p-0", !showCC && "bg-white/5 hover:bg-white/10")}
                onClick={() => setShowCC(!showCC)}
              >
                <Signal className={cn("w-5 h-5", showCC && "text-primary")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {showCC ? "Hide Captions" : "Show Captions"}
            </TooltipContent>
          </Tooltip>

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

      {showCC && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 flex flex-col gap-4">
          <div className="flex justify-center">
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value="en">English</option>
              <option value="af">Afrikaans</option>
              <option value="sq">Albanian</option>
              <option value="am">Amharic</option>
              <option value="ar">Arabic</option>
              <option value="hy">Armenian</option>
              <option value="az">Azerbaijani</option>
              <option value="eu">Basque</option>
              <option value="be">Belarusian</option>
              <option value="bn">Bengali</option>
              <option value="bs">Bosnian</option>
              <option value="bg">Bulgarian</option>
              <option value="ca">Catalan</option>
              <option value="ceb">Cebuano</option>
              <option value="zh">Chinese</option>
              <option value="co">Corsican</option>
              <option value="hr">Croatian</option>
              <option value="cs">Czech</option>
              <option value="da">Danish</option>
              <option value="nl">Dutch</option>
              <option value="eo">Esperanto</option>
              <option value="et">Estonian</option>
              <option value="fi">Finnish</option>
              <option value="fr">French</option>
              <option value="fy">Frisian</option>
              <option value="gl">Galician</option>
              <option value="ka">Georgian</option>
              <option value="de">German</option>
              <option value="el">Greek</option>
              <option value="gu">Gujarati</option>
              <option value="ht">Haitian Creole</option>
              <option value="ha">Hausa</option>
              <option value="haw">Hawaiian</option>
              <option value="iw">Hebrew</option>
              <option value="hi">Hindi</option>
              <option value="hmn">Hmong</option>
              <option value="hu">Hungarian</option>
              <option value="is">Icelandic</option>
              <option value="ig">Igbo</option>
              <option value="id">Indonesian</option>
              <option value="ga">Irish</option>
              <option value="it">Italian</option>
              <option value="ja">Japanese</option>
              <option value="jw">Javanese</option>
              <option value="kn">Kannada</option>
              <option value="kk">Kazakh</option>
              <option value="km">Khmer</option>
              <option value="rw">Kinyarwanda</option>
              <option value="ko">Korean</option>
              <option value="ku">Kurdish</option>
              <option value="ky">Kyrgyz</option>
              <option value="lo">Lao</option>
              <option value="la">Latin</option>
              <option value="lv">Latvian</option>
              <option value="lt">Lithuanian</option>
              <option value="lb">Luxembourgish</option>
              <option value="mk">Macedonian</option>
              <option value="mg">Malagasy</option>
              <option value="ms">Malay</option>
              <option value="ml">Malayalam</option>
              <option value="mt">Maltese</option>
              <option value="mi">Maori</option>
              <option value="mr">Marathi</option>
              <option value="mn">Mongolian</option>
              <option value="my">Myanmar (Burmese)</option>
              <option value="ne">Nepali</option>
              <option value="no">Norwegian</option>
              <option value="ny">Nyanja (Chichewa)</option>
              <option value="or">Odisha (Oriya)</option>
              <option value="ps">Pashto</option>
              <option value="fa">Persian</option>
              <option value="pl">Polish</option>
              <option value="pt">Portuguese</option>
              <option value="pa">Punjabi</option>
              <option value="ro">Romanian</option>
              <option value="ru">Russian</option>
              <option value="sm">Samoan</option>
              <option value="gd">Scots Gaelic</option>
              <option value="sr">Serbian</option>
              <option value="st">Sesotho</option>
              <option value="sn">Shona</option>
              <option value="sd">Sindhi</option>
              <option value="si">Sinhala (Sinhalese)</option>
              <option value="sk">Slovak</option>
              <option value="sl">Slovenian</option>
              <option value="so">Somali</option>
              <option value="es">Spanish</option>
              <option value="su">Sundanese</option>
              <option value="sw">Swahili</option>
              <option value="sv">Swedish</option>
              <option value="tl">Tagalog (Filipino)</option>
              <option value="tg">Tajik</option>
              <option value="ta">Tamil</option>
              <option value="tt">Tatar</option>
              <option value="te">Telugu</option>
              <option value="th">Thai</option>
              <option value="tr">Turkish</option>
              <option value="tk">Turkmen</option>
              <option value="uk">Ukrainian</option>
              <option value="ur">Urdu</option>
              <option value="ug">Uyghur</option>
              <option value="uz">Uzbek</option>
              <option value="vi">Vietnamese</option>
              <option value="cy">Welsh</option>
              <option value="xh">Xhosa</option>
              <option value="yi">Yiddish</option>
              <option value="yo">Yoruba</option>
              <option value="zu">Zulu</option>
            </select>
          </div>
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-center shadow-2xl">
            <p className="text-lg font-medium text-white/90 leading-relaxed italic">
              {captions || "Listening..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
