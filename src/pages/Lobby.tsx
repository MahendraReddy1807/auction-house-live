import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Trophy, Upload, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Team {
  id: string;
  team_name: string;
  logo_url: string | null;
  purse_left: number;
  participant_id: string;
  is_ready: boolean;
  participants?: {
    username: string;
  };
}

const Lobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [timerDuration, setTimerDuration] = useState(30);
  const [bidIncrements, setBidIncrements] = useState({ small: 0.5, medium: 1, large: 2 });

  const participantId = localStorage.getItem('participantId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!participantId || !roomCode) {
      navigate('/');
      return;
    }

    fetchRoomData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `room_id=eq.${room?.id}`
        },
        () => {
          fetchRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, participantId]);

  const fetchRoomData = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);
      setTimerDuration(roomData.timer_duration || 30);
      setBidIncrements({
        small: roomData.bid_increment_small || 0.5,
        medium: roomData.bid_increment_medium || 1,
        large: roomData.bid_increment_large || 2
      });

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*, participants(username)')
        .eq('room_id', roomData.id);

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Check if current user has joined
      const userTeam = teamsData?.find(t => t.participant_id === participantId);
      setHasJoined(!!userTeam);
      setMyTeam(userTeam || null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode!);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
  };

  const handleJoinAuction = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Enter team name",
        description: "Please provide a team name",
        variant: "destructive",
      });
      return;
    }

    if (teams.length >= room.max_users) {
      toast({
        title: "Room Full",
        description: "This auction room is full",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let logoUrl = null;
      if (teamLogo) {
        const fileName = `${participantId}-${Date.now()}.${teamLogo.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('team-logos')
          .upload(fileName, teamLogo);

        if (!uploadError) {
          const { data } = supabase.storage.from('team-logos').getPublicUrl(fileName);
          logoUrl = data.publicUrl;
        }
      }

      const { error } = await supabase
        .from('teams')
        .insert({
          room_id: room.id,
          participant_id: participantId,
          team_name: teamName,
          logo_url: logoUrl,
          initial_purse: 90,
          purse_left: 90,
          is_ready: false
        });

      if (error) throw error;

      toast({
        title: "Joined!",
        description: "You've joined the auction",
      });

      setHasJoined(true);
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

  const toggleReady = async () => {
    if (!myTeam) return;
    
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_ready: !myTeam.is_ready })
        .eq('id', myTeam.id);

      if (error) throw error;

      toast({
        title: myTeam.is_ready ? "Not Ready" : "Ready!",
        description: myTeam.is_ready ? "You're not ready" : "You're ready to start",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateAuctionSettings = async () => {
    if (room.host_id !== participantId) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          timer_duration: timerDuration,
          bid_increment_small: bidIncrements.small,
          bid_increment_medium: bidIncrements.medium,
          bid_increment_large: bidIncrements.large
        })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Auction settings have been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStartAuction = async () => {
    if (teams.length < room.min_users) {
      toast({
        title: "Not enough teams",
        description: `Need at least ${room.min_users} teams to start`,
        variant: "destructive",
      });
      return;
    }

    const notReadyTeams = teams.filter(t => !t.is_ready);
    if (notReadyTeams.length > 0) {
      toast({
        title: "Teams not ready",
        description: `${notReadyTeams.length} team(s) are not ready yet`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Update room status
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', room.id);

      if (roomError) throw roomError;

      // Initialize auction players
      const { data: players } = await supabase
        .from('players')
        .select('id');

      const auctionPlayers = players?.map(p => ({
        room_id: room.id,
        player_id: p.id,
        status: 'WAITING' as const
      }));

      const { error: playersError } = await supabase
        .from('auction_players')
        .insert(auctionPlayers);

      if (playersError) throw playersError;

      navigate(`/auction/${roomCode}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!room) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-card border-2 border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="w-10 h-10 text-secondary" />
              <div>
                <h1 className="text-3xl font-black">Auction Lobby</h1>
                <p className="text-muted-foreground">Waiting for teams to join...</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Room Code</div>
                <div className="text-2xl font-bold text-secondary">{roomCode}</div>
              </div>
              <Button
                onClick={copyRoomCode}
                variant="outline"
                size="icon"
                className="border-secondary hover:bg-secondary/10"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Join/Ready Panel */}
          <div className="space-y-6">
            <Card className="p-6 bg-card border-2 border-border">
            {!hasJoined ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Join as Team</h2>
                <Input
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-input"
                  disabled={loading}
                />
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Team Logo (Optional)
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTeamLogo(e.target.files?.[0] || null)}
                    className="bg-input"
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleJoinAuction}
                  disabled={loading}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold"
                >
                  Join Auction
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Your Team</h2>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="font-bold mb-1">{myTeam?.team_name}</div>
                  <div className="text-sm text-muted-foreground">{username}</div>
                </div>
                <Button
                  onClick={toggleReady}
                  className={`w-full font-bold ${
                    myTeam?.is_ready 
                      ? 'bg-secondary hover:bg-secondary/90' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {myTeam?.is_ready ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Ready
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5 mr-2" />
                      Not Ready
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  All teams must be ready before starting
                </p>
              </div>
            )}
            </Card>

            {/* Host Settings */}
            {room.host_id === participantId && (
              <Card className="p-6 bg-card border-2 border-border">
                <h2 className="text-xl font-bold mb-4">Auction Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Timer Duration (seconds)</label>
                    <Input
                      type="number"
                      min="10"
                      max="120"
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(Number(e.target.value))}
                      className="bg-input mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Bid Increments (Cr)</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={bidIncrements.small}
                        onChange={(e) => setBidIncrements({...bidIncrements, small: Number(e.target.value)})}
                        className="bg-input"
                        placeholder="Small"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={bidIncrements.medium}
                        onChange={(e) => setBidIncrements({...bidIncrements, medium: Number(e.target.value)})}
                        className="bg-input"
                        placeholder="Medium"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={bidIncrements.large}
                        onChange={(e) => setBidIncrements({...bidIncrements, large: Number(e.target.value)})}
                        className="bg-input"
                        placeholder="Large"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={updateAuctionSettings}
                    className="w-full bg-secondary hover:bg-secondary/90"
                  >
                    Save Settings
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Teams List */}
          <Card className="p-6 bg-card border-2 border-border md:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Teams ({teams.length}/{room.max_users})
                </h2>
                {room.host_id === participantId && teams.length >= room.min_users && teams.every(t => t.is_ready) && (
                  <Button
                    onClick={handleStartAuction}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold"
                  >
                    Start Auction
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border"
                  >
                    {team.logo_url ? (
                      <img
                        src={team.logo_url}
                        alt={team.team_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-secondary"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border-2 border-secondary">
                        <Trophy className="w-6 h-6 text-secondary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold">{team.team_name}</div>
                        {team.is_ready ? (
                          <Badge className="bg-secondary text-secondary-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Circle className="w-3 h-3 mr-1" />
                            Not Ready
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {team.participants?.username}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Purse</div>
                      <div className="font-bold text-secondary">₹{team.purse_left}Cr</div>
                    </div>
                  </div>
                ))}

                {teams.length < room.min_users && (
                  <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    Waiting for {room.min_users - teams.length} more team(s) to start...
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Lobby;