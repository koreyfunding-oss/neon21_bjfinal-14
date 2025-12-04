import { motion } from "framer-motion";
import { Zap, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UsageIndicatorProps {
  used: number;
  limit: number;
  type: "CIS" | "Side Bet";
  xp?: number;
  rank?: string;
}

export const UsageIndicator = ({ used, limit, type, xp = 0, rank = "Rookie" }: UsageIndicatorProps) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 100 : Math.min((used / limit) * 100, 100);
  const remaining = isUnlimited ? "∞" : Math.max(limit - used, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur border border-border rounded-lg p-3"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{type} Runs</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {isUnlimited ? "Unlimited" : `${remaining} left`}
        </span>
      </div>

      <Progress 
        value={percentage} 
        className="h-1.5 bg-muted"
      />

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-accent" />
          <span className="text-[10px] text-muted-foreground">{xp.toLocaleString()} XP</span>
        </div>
        <span className="text-[10px] font-medium text-primary">{rank}</span>
      </div>
    </motion.div>
  );
};