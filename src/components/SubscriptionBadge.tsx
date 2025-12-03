import { motion } from "framer-motion";
import { Crown, Zap, Shield, Star, User } from "lucide-react";

interface SubscriptionBadgeProps {
  tier: "free" | "basic" | "elite" | "blackout" | "lifetime";
  className?: string;
}

const tierConfig = {
  free: {
    label: "FREE",
    icon: User,
    gradient: "from-muted to-muted-foreground",
    glow: "shadow-none",
  },
  basic: {
    label: "BASIC",
    icon: Shield,
    gradient: "from-blue-500 to-blue-600",
    glow: "shadow-blue-500/50",
  },
  elite: {
    label: "ELITE",
    icon: Zap,
    gradient: "from-primary to-accent",
    glow: "shadow-primary/50",
  },
  blackout: {
    label: "BLACKOUT",
    icon: Star,
    gradient: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/50",
  },
  lifetime: {
    label: "LIFETIME",
    icon: Crown,
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-500/50",
  },
};

export const SubscriptionBadge = ({ tier, className = "" }: SubscriptionBadgeProps) => {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} shadow-lg ${config.glow} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-white" />
      <span className="text-xs font-bold text-white tracking-wider">{config.label}</span>
    </motion.div>
  );
};