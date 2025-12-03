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
      className="bg-card/50 backdrop-blur border border-border rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{type} Runs</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {isUnlimited ? "Unlimited" : `${remaining} left today`}
        </span>
      </div>

      <Progress 
        value={percentage} 
        className="h-2 bg-muted"
      />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-muted-foreground">{xp.toLocaleString()} XP</span>
        </div>
        <span className="text-xs font-medium text-primary">{rank}</span>
      </div>
    </motion.div>
  );
};