import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateRoomCode = () => {
    return 'IPL' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createParticipant = async (name: string) => {
    const { data, error } = await supabase
      .from('participants')
      .insert({ username: name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      toast({
        title: "Enter your name",
        description: "Please provide a username to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const participant = await createParticipant(username);
      const code = generateRoomCode();
      
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          room_code: code,
          host_id: participant.id,
          status: 'LOBBY'
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('participantId', participant.id);
      localStorage.setItem('username', username);
      
      navigate(`/lobby/${code}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      toast({
        title: "Enter your name",
        description: "Please provide a username to continue",
        variant: "destructive",
      });
      return;
    }

    if (!roomCode.trim()) {
      toast({
        title: "Enter room code",
        description: "Please provide a room code to join",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (roomError || !room) {
        throw new Error("Room not found");
      }

      const participant = await createParticipant(username);
      localStorage.setItem('participantId', participant.id);
      localStorage.setItem('username', username);
      
      navigate(`/lobby/${roomCode.toUpperCase()}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-16 h-16 text-secondary animate-pulse" />
            <h1 className="text-5xl md:text-7xl font-black text-foreground text-glow">
              IPL AUCTION
            </h1>
            <Trophy className="w-16 h-16 text-secondary animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground">
            Build Your Dream Cricket Team • Live Multiplayer Auction
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <Card className="p-8 space-y-6 bg-card border-2 border-border hover:border-secondary transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,149,0,0.3)]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-bold">Create Auction</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Host a new auction room and invite your friends
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-lg bg-input border-border focus:border-secondary transition-colors"
                disabled={loading}
              />
              <Button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full h-12 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                Create Room
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Host for 5-10 players</span>
            </div>
          </Card>

          {/* Join Room Card */}
          <Card className="p-8 space-y-6 bg-card border-2 border-border hover:border-accent transition-all duration-300 hover:shadow-[0_0_30px_rgba(30,64,175,0.3)]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-bold">Join Auction</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a room code to join an existing auction
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-lg bg-input border-border focus:border-accent transition-colors"
                disabled={loading}
              />
              <Input
                placeholder="Enter room code (e.g. IPL123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="h-12 text-lg bg-input border-border focus:border-accent transition-colors"
                disabled={loading}
              />
              <Button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Join Room
              </Button>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-secondary">Real-Time</div>
            <div className="text-sm text-muted-foreground">Live Bidding</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-secondary">40+</div>
            <div className="text-sm text-muted-foreground">Top Players</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-secondary">AI</div>
            <div className="text-sm text-muted-foreground">Team Analysis</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;