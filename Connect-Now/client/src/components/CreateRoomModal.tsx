import { useState } from "react";
import { useCreateRoom } from "@/hooks/use-rooms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function CreateRoomModal() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const createRoom = useCreateRoom();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      try {
        // Validate locally first using schema
        api.rooms.create.input.parse({ name, password });
        
        createRoom.mutate({ name, password }, {
          onSuccess: (data) => {
            setOpen(false);
            setName("");
            setPassword("");
            window.location.href = `/room/${data.slug}`;
          },
          onError: (error) => {
            toast({
              title: "Creation Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        });
      } catch (err: any) {
        toast({
          title: "Check your input",
          description: err.message || "Please ensure the name is set and the password is at least 4 characters if provided.",
          variant: "destructive",
        });
      }
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 rounded-xl h-12 px-8">
          <Plus className="w-5 h-5" />
          New Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-card-foreground p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-white/5">
          <DialogTitle className="text-xl font-display font-bold">Create a Room</DialogTitle>
          <div id="dialog-description" className="sr-only">
            Fill out the form below to create a new video call room.
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} aria-describedby="dialog-description" className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="room-name" className="text-sm font-medium text-muted-foreground">
              Room Name
            </label>
            <Input
              id="room-name"
              placeholder="e.g. Daily Standup"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 h-11"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="room-password" className="text-sm font-medium text-muted-foreground">
              Password (Optional)
            </label>
            <Input
              id="room-password"
              type="password"
              placeholder="Secure your meeting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 h-11"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              className="hover:bg-white/5 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createRoom.isPending || !name.trim()}
              className="bg-primary hover:bg-primary/90 relative z-50"
            >
              {createRoom.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
