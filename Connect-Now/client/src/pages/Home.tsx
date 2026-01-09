import { useState } from "react";
import { useLocation } from "wouter";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Keyboard, ArrowRight, Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [, setLocation] = useLocation();
  const [joinId, setJoinId] = useState("");
  const { theme, setTheme } = useTheme();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      setLocation(`/room/${joinId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold">StreamSync</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 font-bold tracking-wider">
            V2
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme("system")}
            className={cn("rounded-full h-8 w-8", theme === "system" && "bg-primary/10 text-primary")}
            title="System Theme"
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 relative z-10 py-12 lg:py-0">
        
        {/* Left Column: Hero Text & Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:w-1/2 max-w-2xl space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
              Video calls for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">everyone.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Connect with your team, friends, or family in seconds. Crystal clear audio, HD video, and ultra-low latency.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <CreateRoomModal />
            
            <form onSubmit={handleJoin} className="flex-1 w-full sm:w-auto relative group">
              <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Enter a code or link" 
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="pl-10 h-12 bg-secondary/50 border-transparent focus:bg-secondary focus:border-primary/30 rounded-xl transition-all"
              />
              {joinId.trim().length > 0 && (
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost"
                  className="absolute right-1 top-1 text-primary hover:text-primary hover:bg-primary/10 w-10 h-10 rounded-lg"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </form>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Trusted by developers worldwide</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Protect</a>
              <a href="#" className="hover:text-primary transition-colors">DMCA</a>
              <span>Copyright by <a href="https://thongphamit.site" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Hoang Thong Pham</a></span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:w-1/2 relative hidden md:block"
        >
          {/* Abstract Interface Representation */}
          <div className="relative aspect-square max-w-lg mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-indigo-500/20 rounded-3xl blur-3xl" />
            
            {/* Fake Video Grid */}
            <div className="relative h-full grid grid-cols-2 gap-4 p-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-60" />
                  <div className="absolute bottom-3 left-3 w-20 h-2 rounded-full bg-white/10" />
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  {/* Unsplash abstract tech images */}
                  {/* abstract digital communication network */}
                  <img 
                    src={`https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop&q=80&random=${i}`} 
                    alt="Participant" 
                    className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700" 
                  />
                </div>
              ))}
              
              {/* Floating Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 p-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="w-10 h-10 rounded-xl bg-red-500/80" />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
