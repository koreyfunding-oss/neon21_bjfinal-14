import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, Loader2, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAffiliate, type AffiliatePayout } from "@/hooks/useAffiliate";

const statusConfig: Record<
  AffiliatePayout["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-yellow-400",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "text-blue-400",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "text-cyan-400 animate-spin",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "text-green-400",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "text-destructive",
  },
};

const methodLabels: Record<AffiliatePayout["payment_method"], string> = {
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

function PayoutRow({ payout }: { payout: AffiliatePayout }) {
  const cfg = statusConfig[payout.status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.className}`} />
        <div>
          <p className="text-sm font-medium">
            ${payout.amount.toFixed(2)} via {methodLabels[payout.payment_method]}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(payout.requested_at).toLocaleDateString()}
            {payout.completed_at && (
              <> · Completed {new Date(payout.completed_at).toLocaleDateString()}</>
            )}
          </p>
          {payout.notes && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{payout.notes}</p>
          )}
        </div>
      </div>
      <Badge
        variant={
          payout.status === "completed"
            ? "default"
            : payout.status === "failed"
            ? "destructive"
            : "secondary"
        }
        className="text-xs"
      >
        {cfg.label}
      </Badge>
    </motion.div>
  );
}

export default function PayoutHistory() {
  const { payouts, payoutsLoading } = useAffiliate();

  return (
    <Card className="bg-background/60 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-primary" />
          Payout History
        </CardTitle>
      </CardHeader>

      <CardContent>
        {payoutsLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No payout requests yet.
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
