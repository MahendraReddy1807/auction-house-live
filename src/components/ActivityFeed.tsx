import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Trophy, Hammer, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

interface ActivityFeedProps {
  roomId: string;
}

export const ActivityFeed = ({ roomId }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel(`activity-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_activity',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityItem, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('auction_activity')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setActivities(data);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BID':
        return <Hammer className="w-4 h-4 text-secondary" />;
      case 'SOLD':
        return <Trophy className="w-4 h-4 text-secondary" />;
      case 'ACTIVITY':
        return <Activity className="w-4 h-4 text-accent" />;
      default:
        return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-4 bg-card border-2 border-border">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Activity className="w-5 h-5 text-accent" />
        Live Activity
      </h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="p-2 bg-muted rounded-lg flex items-start gap-2 text-sm animate-fade-in"
              >
                <div className="mt-0.5">{getIcon(activity.activity_type)}</div>
                <div className="flex-1">
                  <div className="text-foreground">{activity.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No activity yet
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
