import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, TrendingUp, Home, BarChart3, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamAnalytics } from "@/components/TeamAnalytics";

interface TeamResult {
  id: string;
  team_name: string;
  logo_url: string | null;
  purse_left: number;
  squad: any[];
  playing_xi: any[];
  impact_player: any | null;
  rating: any;
}

const Results = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [bestTeam, setBestTeam] = useState<TeamResult | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, [roomCode]);

  const fetchResults = async () => {
    try {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single();

      if (!room) return;

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, team_players(*, players(*))')
        .eq('room_id', room.id);

      if (teamsData) {
        // Call edge function to calculate best XI and ratings
        const results = await Promise.all(
          teamsData.map(async (team) => {
            const { data } = await supabase.functions.invoke('calculate-team-analysis', {
              body: { teamId: team.id }
            });

            return {
              id: team.id,
              team_name: team.team_name,
              logo_url: team.logo_url,
              purse_left: team.purse_left,
              squad: team.team_players || [],
              playing_xi: data?.playing_xi || [],
              impact_player: data?.impact_player || null,
              rating: data?.rating || null
            };
          })
        );

        setTeams(results);
        
        // Find best team
        const best = results.reduce((prev, current) => 
          (current.rating?.overall_rating || 0) > (prev.rating?.overall_rating || 0) ? current : prev
        );
        setBestTeam(best);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-secondary mx-auto animate-pulse" />
          <div className="text-xl">Calculating results...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Trophy className="w-20 h-20 text-secondary mx-auto" />
          <h1 className="text-5xl font-black text-glow">AUCTION COMPLETE!</h1>
          <p className="text-xl text-muted-foreground">
            Final Results • Room: {roomCode}
          </p>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-secondary hover:bg-secondary/10"
          >
            <Home className="w-4 h-4 mr-2" />
            New Auction
          </Button>
        </div>

        {/* Best Team Banner */}
        {bestTeam && (
          <Card className="p-8 bg-gradient-to-r from-secondary/20 to-accent/20 border-2 border-secondary">
            <div className="text-center space-y-4">
              <Award className="w-16 h-16 text-secondary mx-auto" />
              <div>
                <div className="text-sm text-muted-foreground mb-2">🏆 CHAMPION TEAM</div>
                <h2 className="text-4xl font-black">{bestTeam.team_name}</h2>
                {bestTeam.rating && (
                  <div className="text-3xl font-bold text-secondary mt-2">
                    Rating: {bestTeam.rating.overall_rating?.toFixed(1)}/100
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Analytics Tab */}
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="teams">
              <Users className="w-4 h-4 mr-2" />
              Teams Overview
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Team Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            {/* Teams Results */}
            {teams
              .sort((a, b) => (b.rating?.overall_rating || 0) - (a.rating?.overall_rating || 0))
              .map((team, index) => (
              <Card 
                key={team.id}
                className={`p-6 bg-card border-2 ${
                  team.id === bestTeam?.id 
                    ? 'border-secondary shadow-[0_0_30px_rgba(255,149,0,0.3)]' 
                    : 'border-border'
                }`}
              >
                <div className="space-y-6">
                  {/* Team Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-black text-muted-foreground">
                        #{index + 1}
                      </div>
                      {team.logo_url && (
                        <img
                          src={team.logo_url}
                          alt={team.team_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-secondary"
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-bold">{team.team_name}</h3>
                        <div className="text-sm text-muted-foreground">
                          Squad Size: {team.squad.length} • Purse Left: ₹{team.purse_left}Cr
                        </div>
                      </div>
                    </div>
                    {team.rating && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-secondary">
                          {team.rating.overall_rating?.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">Overall</div>
                      </div>
                    )}
                  </div>

                  {/* Ratings Breakdown */}
                  {team.rating && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold text-accent">
                          {team.rating.batting_rating?.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Batting</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold text-destructive">
                          {team.rating.bowling_rating?.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Bowling</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold text-secondary">
                          {team.rating.balance_score?.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">
                          {team.rating.bench_depth?.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Bench</div>
                      </div>
                    </div>
                  )}

                  {/* Playing XI */}
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-secondary" />
                      Playing XI
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {team.playing_xi.map((player: any) => (
                        <div
                          key={player.id}
                          className="p-3 bg-muted rounded-lg border border-secondary/50"
                        >
                          <div className="font-semibold text-sm">{player.players?.name}</div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {player.players?.role.replace('_', ' ')} • ₹{player.price}Cr
                          </div>
                          <div className="flex gap-1 text-xs">
                            <Badge variant="outline" className="text-xs">
                              Bat: {player.players?.batting_score}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Bowl: {player.players?.bowling_score}
                            </Badge>
                          </div>
                          <Badge className="text-xs mt-1 bg-secondary">
                            Overall: {player.players?.overall_score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full Squad */}
                  {team.squad.length > team.playing_xi.length && (
                    <div>
                      <h4 className="font-bold mb-3 text-muted-foreground">
                        Bench Players
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {team.squad
                          .filter((sp: any) => !team.playing_xi.find((xi: any) => xi.id === sp.id))
                          .map((player: any) => (
                            <div
                              key={player.id}
                              className="p-2 bg-muted/50 rounded border border-border text-xs"
                            >
                              <div className="font-semibold truncate">{player.players?.name}</div>
                              <div className="text-muted-foreground">
                                {player.players?.role.replace('_', ' ')}
                              </div>
                              <div className="text-muted-foreground">₹{player.price}Cr</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {player.players?.overall_score}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Impact Player */}
                  {team.impact_player && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-accent" />
                        Impact Player
                      </h4>
                      <div className="p-4 bg-accent/10 rounded-lg border border-accent inline-block">
                        <div className="font-bold">{team.impact_player.players?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.impact_player.players?.role.replace('_', ' ')} • 
                          Rating: {team.impact_player.players?.overall_score}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Team Selection */}
            <Card className="p-4 bg-card border-2 border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Select Team:</span>
                {teams.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeam?.id === team.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTeam(team)}
                    className={selectedTeam?.id === team.id ? "bg-secondary" : ""}
                  >
                    {team.team_name}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Team Analytics Display */}
            {selectedTeam ? (
              <TeamAnalytics
                teamName={selectedTeam.team_name}
                players={selectedTeam.squad}
                purseSpent={90 - selectedTeam.purse_left}
                totalPlayers={selectedTeam.squad.length}
              />
            ) : (
              <Card className="p-12 bg-card border-2 border-border text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a team to view analytics</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Results;