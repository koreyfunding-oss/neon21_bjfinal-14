import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { DollarSign, CreditCard, Landmark, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAffiliate, type Affiliate } from "@/hooks/useAffiliate";

type PaymentMethod = "paypal" | "apple_pay" | "bank_transfer" | "other";

type PayoutFormValues = {
  amount: number;
  payment_method: PaymentMethod;
  destination: string;
};

const methodIcons: Record<PaymentMethod, React.ReactNode> = {
  paypal: <CreditCard className="w-4 h-4" />,
  apple_pay: <Smartphone className="w-4 h-4" />,
  bank_transfer: <Landmark className="w-4 h-4" />,
  other: <DollarSign className="w-4 h-4" />,
};

const methodLabels: Record<PaymentMethod, string> = {
  paypal: "PayPal",
  apple_pay: "Apple Pay",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

const destinationLabels: Record<PaymentMethod, string> = {
  paypal: "PayPal Email",
  apple_pay: "Apple Pay Phone / Email",
  bank_transfer: "Bank Account Details",
  other: "Destination Details",
};

type Props = {
  affiliate: Affiliate;
  onSuccess?: () => void;
};

export default function PayoutRequest({ affiliate, onSuccess }: Props) {
  const { requestPayout, canRequestPayout } = useAffiliate();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("paypal");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayoutFormValues>();

  const onSubmit = async (values: PayoutFormValues) => {
    if (!canRequestPayout) return;
    setSubmitting(true);
    try {
      await requestPayout.mutateAsync({
        amount: Number(values.amount),
        payment_method: selectedMethod,
        destination_details: { destination: values.destination },
      });
      reset();
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!canRequestPayout) {
    const reasons: string[] = [];
    if (affiliate.kyc_status !== "verified")
      reasons.push("KYC verification required");
    if (affiliate.status !== "approved")
      reasons.push("Affiliate account not yet approved");
    if ((affiliate.available_balance ?? 0) < 10)
      reasons.push("Minimum $10 balance required");

    return (
      <Card className="bg-background/60 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-primary" />
            Request Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/40 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Payout requests are locked:
            </p>
            <ul className="space-y-1">
              {reasons.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-destructive/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-background/60 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-primary" />
            Request Payout
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Available balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm text-muted-foreground">
                Available Balance
              </span>
              <span className="text-lg font-bold text-primary">
                ${affiliate.available_balance.toFixed(2)}
              </span>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="payout-amount">Amount ($)</Label>
              <Input
                id="payout-amount"
                type="number"
                step="0.01"
                min={10}
                max={affiliate.available_balance}
                placeholder="10.00"
                {...register("amount", {
                  required: "Amount is required",
                  min: { value: 10, message: "Minimum payout is $10" },
                  max: {
                    value: affiliate.available_balance,
                    message: `Cannot exceed available balance ($${affiliate.available_balance.toFixed(2)})`,
                  },
                })}
              />
              {errors.amount && (
                <p className="text-destructive text-xs">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select
                value={selectedMethod}
                onValueChange={(v) => setSelectedMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(methodLabels) as PaymentMethod[]
                  ).map((m) => (
                    <SelectItem key={m} value={m}>
                      <span className="flex items-center gap-2">
                        {methodIcons[m]}
                        {methodLabels[m]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <Label htmlFor="payout-dest">
                {destinationLabels[selectedMethod]}
              </Label>
              <Input
                id="payout-dest"
                placeholder={
                  selectedMethod === "paypal"
                    ? "your@paypal.com"
                    : selectedMethod === "bank_transfer"
                    ? "Routing #, Account #"
                    : "your@apple.com or +1 (555) 000-0000"
                }
                {...register("destination", {
                  required: "Destination is required",
                })}
              />
              {errors.destination && (
                <p className="text-destructive text-xs">
                  {errors.destination.message}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Payout requests are reviewed by our team before processing.
              Funds are sent via Square Payouts.
            </p>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || requestPayout.isPending}
            >
              {submitting || requestPayout.isPending
                ? "Submitting…"
                : "Submit Payout Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
