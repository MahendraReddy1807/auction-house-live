import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

interface PlayerComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player1: Player | null;
  player2: Player | null;
}

export const PlayerComparison = ({ open, onOpenChange, player1, player2 }: PlayerComparisonProps) => {
  if (!player1 || !player2) return null;

  const getComparison = (val1: number, val2: number) => {
    if (val1 > val2) return <TrendingUp className="w-4 h-4 text-secondary" />;
    if (val1 < val2) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const StatRow = ({ label, val1, val2 }: { label: string; val1: number; val2: number }) => (
    <div className="grid grid-cols-3 gap-4 items-center p-3 bg-muted/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-secondary">{val1}</div>
        {getComparison(val1, val2)}
      </div>
      <div className="text-center font-semibold text-sm">{label}</div>
      <div className="text-center">
        <div className="text-2xl font-bold text-accent">{val2}</div>
        {getComparison(val2, val1)}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Player Comparison</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Headers */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-secondary/10 border-secondary">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{player1.name}</h3>
                <Badge variant="outline">{player1.role.replace('_', ' ')}</Badge>
                <div className="text-sm text-muted-foreground">
                  🏏 {player1.country}
                  {player1.is_overseas && <Badge className="ml-2" variant="secondary">Overseas</Badge>}
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-accent/10 border-accent">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{player2.name}</h3>
                <Badge variant="outline">{player2.role.replace('_', ' ')}</Badge>
                <div className="text-sm text-muted-foreground">
                  🏏 {player2.country}
                  {player2.is_overseas && <Badge className="ml-2" variant="secondary">Overseas</Badge>}
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Comparison */}
          <div className="space-y-3">
            <StatRow label="Overall Score" val1={player1.overall_score} val2={player2.overall_score} />
            <StatRow label="Batting Score" val1={player1.batting_score} val2={player2.batting_score} />
            <StatRow label="Bowling Score" val1={player1.bowling_score} val2={player2.bowling_score} />
            <StatRow label="Base Price (Cr)" val1={player1.base_price} val2={player2.base_price} />
          </div>

          {/* Winner */}
          <Card className="p-4 bg-secondary/10 border-2 border-secondary">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Better Overall Value</div>
              <div className="text-2xl font-black text-secondary">
                {player1.overall_score > player2.overall_score ? player1.name : 
                 player2.overall_score > player1.overall_score ? player2.name : 
                 'Equal'}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
