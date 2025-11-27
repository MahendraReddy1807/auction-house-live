import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, Hammer, TrendingUp, Award, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
  base_price: number;
  batting_score: number;
  bowling_score: number;
  overall_score: number;
  is_overseas: boolean;
}

interface AuctionPlayer {
  id: string;
  player_id: string;
  status: string;
  current_bid: number | null;
  current_bidder_team_id: string | null;
  players: Player;
  teams?: {
    team_name: string;
  };
}

interface Team {
  id: string;
  team_name: string;
  purse_left: number;
  participant_id: string;
}

const AuctionRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<AuctionPlayer | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [showSoldAnimation, setShowSoldAnimation] = useState(false);
  const [soldInfo, setSoldInfo] = useState<{ price: number; teamName: string } | null>(null);
  const [soldPlayers, setSoldPlayers] = useState<any[]>([]);

  const participantId = localStorage.getItem('participantId');

  useEffect(() => {
    if (!participantId || !roomCode) {
      navigate('/');
      return;
    }

    fetchAuctionData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`auction-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_players'
        },
        () => {
          fetchAuctionData();
          fetchSoldPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams'
        },
        () => {
          fetchTeamsData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids'
        },
        () => {
          fetchBidHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  useEffect(() => {
    if (currentPlayer?.status === 'ACTIVE' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentPlayer?.status === 'ACTIVE') {
      handlePlayerSold();
    }
  }, [timeLeft, currentPlayer]);

  const fetchSoldPlayers = async () => {
    if (!room) return;

    const { data } = await supabase
      .from('auction_players')
      .select('*, players(*), teams!sold_to_team_id(team_name)')
      .eq('room_id', room.id)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false });

    setSoldPlayers(data || []);
  };

  const fetchAuctionData = async () => {
    try {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (roomData) {
        setRoom(roomData);

        // Get current/next player
        const { data: playerData } = await supabase
          .from('auction_players')
          .select('*, players(*), teams!current_bidder_team_id(team_name)')
          .eq('room_id', roomData.id)
          .in('status', ['ACTIVE', 'WAITING'])
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (playerData) {
          if (playerData.status === 'WAITING') {
            // Start auction for this player
            await supabase
              .from('auction_players')
              .update({ 
                status: 'ACTIVE' as const,
                current_bid: playerData.players.base_price 
              })
              .eq('id', playerData.id);
            
            setTimeLeft(roomData.timer_duration || 30);
            // Update local state with ACTIVE status
            playerData.status = 'ACTIVE';
            playerData.current_bid = playerData.players.base_price;
          }
          setCurrentPlayer(playerData);
        } else {
          // All players done, go to results
          navigate(`/results/${roomCode}`);
        }

        await fetchTeamsData();
        await fetchBidHistory();
        await fetchSoldPlayers();
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchTeamsData = async () => {
    if (!room) return;

    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .eq('room_id', room.id);

    if (teamsData) {
      setTeams(teamsData);
      const myTeamData = teamsData.find(t => t.participant_id === participantId);
      setMyTeam(myTeamData || null);
    }
  };

  const fetchBidHistory = async () => {
    if (!currentPlayer) return;

    const { data } = await supabase
      .from('bids')
      .select('*, teams(team_name)')
      .eq('auction_player_id', currentPlayer.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setBidHistory(data || []);
  };

  const handleBid = async (increment: number) => {
    if (!currentPlayer || !myTeam) return;

    const newBid = (currentPlayer.current_bid || currentPlayer.players.base_price) + increment;

    if (newBid > myTeam.purse_left) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough purse left",
        variant: "destructive",
      });
      return;
    }

    try {
      // Record bid
      await supabase
        .from('bids')
        .insert({
          auction_player_id: currentPlayer.id,
          team_id: myTeam.id,
          bid_amount: newBid
        });

      // Update auction player
      await supabase
        .from('auction_players')
        .update({
          current_bid: newBid,
          current_bidder_team_id: myTeam.id,
          bid_count: (currentPlayer as any).bid_count + 1
        })
        .eq('id', currentPlayer.id);

      setTimeLeft(room.timer_duration || 30); // Reset timer
      
      toast({
        title: "Bid Placed!",
        description: `₹${newBid}Cr bid placed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePlayerSold = async () => {
    if (!currentPlayer) return;

    try {
      const soldPrice = currentPlayer.current_bid || currentPlayer.players.base_price;
      const soldToTeam = currentPlayer.current_bidder_team_id;
      const soldTeamName = currentPlayer.teams?.team_name || 'No bids';

      // Show sold animation
      setSoldInfo({ price: soldPrice, teamName: soldTeamName });
      setShowSoldAnimation(true);

      // Mark player as sold
      await supabase
        .from('auction_players')
        .update({
          status: 'COMPLETED' as const,
          sold_price: soldPrice,
          sold_to_team_id: soldToTeam
        })
        .eq('id', currentPlayer.id);

      if (soldToTeam) {
        // Add to team
        await supabase
          .from('team_players')
          .insert({
            team_id: soldToTeam,
            player_id: currentPlayer.player_id,
            price: soldPrice
          });

        // Update team purse
        const team = teams.find(t => t.id === soldToTeam);
        if (team) {
          await supabase
            .from('teams')
            .update({
              purse_left: team.purse_left - soldPrice
            })
            .eq('id', soldToTeam);
        }
      }

      // Fetch next player after animation
      setTimeout(() => {
        setShowSoldAnimation(false);
        setSoldInfo(null);
        fetchAuctionData();
      }, 3000);
    } catch (error: any) {
      console.error(error);
    }
  };

  if (!currentPlayer || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-secondary mx-auto animate-pulse" />
          <div className="text-xl">Loading auction...</div>
        </div>
      </div>
    );
  }

  const player = currentPlayer.players;
  const progressPercent = (timeLeft / (room.timer_duration || 30)) * 100;

  // Prepare chart data
  const chartData = soldPlayers.slice(0, 10).reverse().map(sp => ({
    name: sp.players.name.split(' ').slice(-1)[0],
    price: Number(sp.sold_price),
    team: sp.teams?.team_name || 'Unsold'
  }));

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Sold Animation Overlay */}
      {showSoldAnimation && soldInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
          <div className="text-center space-y-6 animate-scale-in">
            <div className="relative">
              <div className="text-8xl font-black text-secondary animate-pulse">
                SOLD!
              </div>
              <div className="absolute inset-0 text-8xl font-black text-secondary/20 blur-xl animate-pulse">
                SOLD!
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-foreground">
                ₹{soldInfo.price}Cr
              </div>
              <div className="text-2xl text-muted-foreground">
                to {soldInfo.teamName}
              </div>
            </div>
            <Award className="w-24 h-24 text-secondary mx-auto animate-bounce" />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-4 bg-card border-2 border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-secondary" />
              <div>
                <h1 className="text-2xl font-black">IPL AUCTION</h1>
                <p className="text-sm text-muted-foreground">Room: {roomCode}</p>
              </div>
            </div>
            {myTeam && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{myTeam.team_name}</div>
                <div className="text-2xl font-bold text-secondary">₹{myTeam.purse_left}Cr</div>
              </div>
            )}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Player Card */}
          <Card className="md:col-span-2 p-8 bg-gradient-to-br from-card to-muted border-2 border-border relative overflow-hidden">
            {currentPlayer.status === 'ACTIVE' && (
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent animate-pulse" />
            )}
            
            <div className="relative space-y-6">
              {/* Timer */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-6 h-6 text-secondary" />
                  <div className="text-5xl font-black text-secondary">{timeLeft}s</div>
                </div>
                <Progress 
                  value={progressPercent} 
                  className="h-2"
                />
              </div>

              {/* Player Details */}
              <div className="text-center space-y-4">
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {player.role.replace('_', ' ')}
                </Badge>
                <h2 className="text-4xl font-black">{player.name}</h2>
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <span>🏏 {player.country}</span>
                  {player.is_overseas && <Badge variant="secondary">Overseas</Badge>}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{player.overall_score}</div>
                  <div className="text-sm text-muted-foreground">Overall</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{player.batting_score}</div>
                  <div className="text-sm text-muted-foreground">Batting</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-destructive">{player.bowling_score}</div>
                  <div className="text-sm text-muted-foreground">Bowling</div>
                </div>
              </div>

              {/* Current Bid */}
              <div className="text-center p-6 bg-secondary/10 rounded-lg border-2 border-secondary">
                <div className="text-sm text-muted-foreground mb-1">Current Bid</div>
                <div className="text-4xl font-black text-secondary">
                  ₹{currentPlayer.current_bid || player.base_price}Cr
                </div>
                {currentPlayer.teams && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Leading: {currentPlayer.teams.team_name}
                  </div>
                )}
              </div>

              {/* Bid Buttons */}
              {myTeam && currentPlayer.status === 'ACTIVE' && (
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleBid(room.bid_increment_small || 0.5)}
                    className="h-14 text-lg font-bold bg-secondary hover:bg-secondary/90"
                  >
                    <Hammer className="w-5 h-5 mr-2" />
                    +{room.bid_increment_small || 0.5}Cr
                  </Button>
                  <Button
                    onClick={() => handleBid(room.bid_increment_medium || 1)}
                    className="h-14 text-lg font-bold bg-secondary hover:bg-secondary/90"
                  >
                    <Hammer className="w-5 h-5 mr-2" />
                    +{room.bid_increment_medium || 1}Cr
                  </Button>
                  <Button
                    onClick={() => handleBid(room.bid_increment_large || 2)}
                    className="h-14 text-lg font-bold bg-secondary hover:bg-secondary/90"
                  >
                    <Hammer className="w-5 h-5 mr-2" />
                    +{room.bid_increment_large || 2}Cr
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Teams */}
            <Card className="p-4 bg-card border-2 border-border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" />
                Teams
              </h3>
              <div className="space-y-2">
                {teams
                  .sort((a, b) => b.purse_left - a.purse_left)
                  .map((team) => (
                    <div
                      key={team.id}
                      className={`p-3 rounded-lg border transition-all ${
                        team.id === myTeam?.id
                          ? 'bg-secondary/20 border-secondary'
                          : 'bg-muted border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm truncate">
                          {team.team_name}
                        </div>
                        <div className="text-secondary font-bold">
                          ₹{team.purse_left}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Bid History */}
            <Card className="p-4 bg-card border-2 border-border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Recent Bids
              </h3>
              <div className="space-y-2">
                {bidHistory.length > 0 ? (
                  bidHistory.map((bid) => (
                    <div
                      key={bid.id}
                      className="p-2 bg-muted rounded text-sm"
                    >
                      <div className="font-semibold">{bid.teams?.team_name}</div>
                      <div className="text-secondary">₹{bid.bid_amount}Cr</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm p-4">
                    No bids yet
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Purchase History Chart */}
        {soldPlayers.length > 0 && (
          <Card className="p-6 bg-card border-2 border-border">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-secondary" />
              Recent Purchases
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₹${value}Cr`, 'Price']}
                  labelFormatter={(label) => `Player: ${label}`}
                />
                <Legend />
                <Bar dataKey="price" fill="hsl(var(--secondary))" name="Price (Cr)" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold text-secondary">{soldPlayers.length}</div>
                <div className="text-xs text-muted-foreground">Players Sold</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold text-secondary">
                  ₹{soldPlayers.reduce((sum, p) => sum + Number(p.sold_price || 0), 0).toFixed(1)}Cr
                </div>
                <div className="text-xs text-muted-foreground">Total Spent</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold text-secondary">
                  ₹{soldPlayers.length > 0 ? (soldPlayers.reduce((sum, p) => sum + Number(p.sold_price || 0), 0) / soldPlayers.length).toFixed(1) : 0}Cr
                </div>
                <div className="text-xs text-muted-foreground">Avg Price</div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-2xl font-bold text-secondary">
                  ₹{soldPlayers.length > 0 ? Math.max(...soldPlayers.map(p => Number(p.sold_price || 0))).toFixed(1) : 0}Cr
                </div>
                <div className="text-xs text-muted-foreground">Highest Bid</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AuctionRoom;