import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Player {
  id: string;
  players: {
    role: string;
    overall_score: number;
    batting_score: number;
    bowling_score: number;
    is_overseas: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get team squad
    const { data: squad, error } = await supabaseClient
      .from('team_players')
      .select('*, players(*)')
      .eq('team_id', teamId);

    if (error) throw error;

    if (!squad || squad.length === 0) {
      return new Response(
        JSON.stringify({ 
          playing_xi: [], 
          impact_player: null, 
          rating: { 
            overall_rating: 0, 
            batting_rating: 0, 
            bowling_rating: 0, 
            balance_score: 0, 
            bench_depth: 0 
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select Best Playing XI using rule-based algorithm
    const playingXI = selectBestPlayingXI(squad);
    
    // Select Impact Player (best player not in XI)
    const impactPlayer = selectImpactPlayer(squad, playingXI);
    
    // Calculate Team Ratings
    const rating = calculateTeamRating(squad, playingXI);

    // Update database with selections
    await supabaseClient
      .from('team_players')
      .update({ in_playing_xi: false, is_impact_player: false })
      .eq('team_id', teamId);

    if (playingXI.length > 0) {
      await supabaseClient
        .from('team_players')
        .update({ in_playing_xi: true })
        .in('id', playingXI.map(p => p.id));
    }

    if (impactPlayer) {
      await supabaseClient
        .from('team_players')
        .update({ is_impact_player: true })
        .eq('id', impactPlayer.id);
    }

    // Store ratings
    await supabaseClient
      .from('team_ratings')
      .upsert({
        team_id: teamId,
        overall_rating: rating.overall_rating,
        batting_rating: rating.batting_rating,
        bowling_rating: rating.bowling_rating,
        balance_score: rating.balance_score,
        bench_depth: rating.bench_depth
      });

    return new Response(
      JSON.stringify({ playing_xi: playingXI, impact_player: impactPlayer, rating }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function selectBestPlayingXI(squad: Player[]): Player[] {
  // Sort by overall score
  const sorted = [...squad].sort((a, b) => 
    b.players.overall_score - a.players.overall_score
  );

  const xi: Player[] = [];
  let wicketKeepers = 0;
  let batsmen = 0;
  let bowlers = 0;
  let allRounders = 0;
  let overseas = 0;

  for (const player of sorted) {
    if (xi.length >= 11) break;

    const role = player.players.role;
    const isOverseas = player.players.is_overseas;

    // Check overseas limit
    if (isOverseas && overseas >= 4) continue;

    // Check role constraints
    if (role === 'WICKET_KEEPER' && wicketKeepers >= 1) continue;
    if (role === 'BATSMAN' && batsmen >= 5) continue;
    if (role === 'BOWLER' && bowlers >= 5) continue;
    if (role === 'ALL_ROUNDER' && allRounders >= 3) continue;

    // Add to XI
    xi.push(player);
    
    if (role === 'WICKET_KEEPER') wicketKeepers++;
    else if (role === 'BATSMAN') batsmen++;
    else if (role === 'BOWLER') bowlers++;
    else if (role === 'ALL_ROUNDER') allRounders++;
    
    if (isOverseas) overseas++;
  }

  // Ensure minimum requirements
  const hasMinimumWK = wicketKeepers >= 1;
  const hasMinimumBowlers = bowlers >= 2;
  const hasMinimumBatsmen = batsmen >= 3;

  if (!hasMinimumWK || !hasMinimumBowlers || !hasMinimumBatsmen) {
    console.log('Could not satisfy minimum requirements');
  }

  return xi;
}

function selectImpactPlayer(squad: Player[], playingXI: Player[]): Player | null {
  const xiIds = new Set(playingXI.map(p => p.id));
  const bench = squad.filter(p => !xiIds.has(p.id));
  
  if (bench.length === 0) return null;

  // Return highest rated bench player
  return bench.sort((a, b) => 
    b.players.overall_score - a.players.overall_score
  )[0];
}

function calculateTeamRating(squad: Player[], playingXI: Player[]) {
  if (playingXI.length === 0) {
    return {
      overall_rating: 0,
      batting_rating: 0,
      bowling_rating: 0,
      balance_score: 0,
      bench_depth: 0
    };
  }

  // Batting strength (average of XI)
  const battingRating = playingXI.reduce((sum, p) => 
    sum + p.players.batting_score, 0
  ) / playingXI.length;

  // Bowling strength (average of XI)
  const bowlingRating = playingXI.reduce((sum, p) => 
    sum + p.players.bowling_score, 0
  ) / playingXI.length;

  // Balance score (how well balanced the XI is)
  const roleCount = {
    WICKET_KEEPER: 0,
    BATSMAN: 0,
    BOWLER: 0,
    ALL_ROUNDER: 0
  };

  playingXI.forEach(p => {
    roleCount[p.players.role as keyof typeof roleCount]++;
  });

  // Ideal: 1 WK, 3-4 BAT, 2-3 BOWL, 2-3 AR
  const balanceScore = (
    (roleCount.WICKET_KEEPER === 1 ? 25 : 0) +
    (roleCount.BATSMAN >= 3 && roleCount.BATSMAN <= 4 ? 25 : 10) +
    (roleCount.BOWLER >= 2 && roleCount.BOWLER <= 3 ? 25 : 10) +
    (roleCount.ALL_ROUNDER >= 1 && roleCount.ALL_ROUNDER <= 3 ? 25 : 10)
  );

  // Bench depth (average score of bench)
  const xiIds = new Set(playingXI.map(p => p.id));
  const bench = squad.filter(p => !xiIds.has(p.id));
  const benchDepth = bench.length > 0
    ? bench.reduce((sum, p) => sum + p.players.overall_score, 0) / bench.length
    : 0;

  // Overall rating formula
  const overallRating = (
    0.3 * battingRating +
    0.3 * bowlingRating +
    0.3 * balanceScore +
    0.1 * benchDepth
  );

  return {
    overall_rating: Math.round(overallRating * 10) / 10,
    batting_rating: Math.round(battingRating * 10) / 10,
    bowling_rating: Math.round(bowlingRating * 10) / 10,
    balance_score: Math.round(balanceScore * 10) / 10,
    bench_depth: Math.round(benchDepth * 10) / 10
  };
}