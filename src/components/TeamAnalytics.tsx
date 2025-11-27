import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, DollarSign, TrendingUp, Award } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface TeamAnalyticsProps {
  teamName: string;
  players: any[];
  purseSpent: number;
  totalPlayers: number;
}

export const TeamAnalytics = ({ teamName, players, purseSpent, totalPlayers }: TeamAnalyticsProps) => {
  // Calculate team composition
  const batsmen = players.filter(p => p.players.role === 'BATSMAN').length;
  const bowlers = players.filter(p => p.players.role === 'BOWLER').length;
  const allRounders = players.filter(p => p.players.role === 'ALL_ROUNDER').length;
  const wicketKeepers = players.filter(p => p.players.role === 'WICKET_KEEPER').length;
  const overseas = players.filter(p => p.players.is_overseas).length;

  // Calculate average stats
  const avgBatting = players.reduce((sum, p) => sum + (p.players.batting_score || 0), 0) / players.length;
  const avgBowling = players.reduce((sum, p) => sum + (p.players.bowling_score || 0), 0) / players.length;
  const avgOverall = players.reduce((sum, p) => sum + (p.players.overall_score || 0), 0) / players.length;

  // Prepare radar chart data
  const radarData = [
    { subject: 'Batting', value: avgBatting },
    { subject: 'Bowling', value: avgBowling },
    { subject: 'Overall', value: avgOverall },
    { subject: 'Squad Depth', value: (totalPlayers / 15) * 100 },
    { subject: 'Balance', value: ((batsmen + allRounders) * (bowlers + allRounders) / totalPlayers) * 10 }
  ];

  // Find most expensive player
  const mostExpensive = players.reduce((max, p) => 
    p.price > (max?.price || 0) ? p : max
  , players[0]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-br from-secondary/20 to-accent/20 border-2 border-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-secondary" />
            <div>
              <h2 className="text-2xl font-black">{teamName}</h2>
              <p className="text-sm text-muted-foreground">Team Analytics</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Overall Rating</div>
            <div className="text-3xl font-black text-secondary">{avgOverall.toFixed(1)}</div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-secondary" />
            <div className="text-sm text-muted-foreground">Players</div>
          </div>
          <div className="text-2xl font-bold">{totalPlayers}</div>
        </Card>

        <Card className="p-4 bg-card border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-secondary" />
            <div className="text-sm text-muted-foreground">Spent</div>
          </div>
          <div className="text-2xl font-bold">₹{purseSpent}Cr</div>
        </Card>

        <Card className="p-4 bg-card border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <div className="text-sm text-muted-foreground">Avg Price</div>
          </div>
          <div className="text-2xl font-bold">₹{(purseSpent / totalPlayers).toFixed(1)}Cr</div>
        </Card>

        <Card className="p-4 bg-card border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-secondary" />
            <div className="text-sm text-muted-foreground">Overseas</div>
          </div>
          <div className="text-2xl font-bold">{overseas}</div>
        </Card>
      </div>

      {/* Composition & Radar Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Team Composition */}
        <Card className="p-6 bg-card border-2 border-border">
          <h3 className="font-bold mb-4">Squad Composition</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">Batsmen</span>
              <Badge variant="secondary">{batsmen}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">Bowlers</span>
              <Badge variant="secondary">{bowlers}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">All-Rounders</span>
              <Badge variant="secondary">{allRounders}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">Wicket Keepers</span>
              <Badge variant="secondary">{wicketKeepers}</Badge>
            </div>
          </div>
        </Card>

        {/* Radar Chart */}
        <Card className="p-6 bg-card border-2 border-border">
          <h3 className="font-bold mb-4">Team Strength Profile</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name={teamName} 
                dataKey="value" 
                stroke="hsl(var(--secondary))" 
                fill="hsl(var(--secondary))" 
                fillOpacity={0.5} 
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Most Expensive Player */}
      {mostExpensive && (
        <Card className="p-6 bg-accent/10 border-2 border-accent">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Most Expensive Signing
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">{mostExpensive.players.name}</div>
              <Badge variant="outline" className="mt-1">
                {mostExpensive.players.role.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-accent">₹{mostExpensive.price}Cr</div>
              <div className="text-sm text-muted-foreground">Overall: {mostExpensive.players.overall_score}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
