import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Clock, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAffiliate, type Affiliate } from "@/hooks/useAffiliate";

type KycFormValues = {
  full_name: string;
  email: string;
  address: string;
  id_notes: string;
};

const statusConfig = {
  not_started: {
    label: "Not Started",
    color: "secondary" as const,
    icon: Shield,
    description: "Complete KYC verification to unlock payouts.",
  },
  pending: {
    label: "Under Review",
    color: "default" as const,
    icon: Clock,
    description: "Your KYC submission is being reviewed by our team.",
  },
  verified: {
    label: "Verified",
    color: "default" as const,
    icon: CheckCircle,
    description: "Identity verified. You can now request payouts.",
  },
  rejected: {
    label: "Rejected",
    color: "destructive" as const,
    icon: XCircle,
    description: "Your KYC was rejected. Please resubmit with valid information.",
  },
};

type Props = {
  affiliate: Affiliate;
};

export default function AffiliateKYC({ affiliate }: Props) {
  const { submitKyc } = useAffiliate();
  const [submitting, setSubmitting] = useState(false);

  const config = statusConfig[affiliate.kyc_status] ?? statusConfig.not_started;
  const StatusIcon = config.icon;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KycFormValues>();

  const onSubmit = async (values: KycFormValues) => {
    setSubmitting(true);
    try {
      await submitKyc.mutateAsync({
        full_name: values.full_name,
        email: values.email,
        address: values.address,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    affiliate.kyc_status === "not_started" ||
    affiliate.kyc_status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-background/60 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            KYC Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status banner */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
            <StatusIcon
              className={`w-5 h-5 ${
                affiliate.kyc_status === "verified"
                  ? "text-green-400"
                  : affiliate.kyc_status === "rejected"
                  ? "text-destructive"
                  : affiliate.kyc_status === "pending"
                  ? "text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Status:</span>
                <Badge variant={config.color}>{config.label}</Badge>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {config.description}
              </p>
            </div>
          </div>

          {affiliate.kyc_status === "verified" && affiliate.kyc_verified_at && (
            <p className="text-xs text-muted-foreground">
              Verified on{" "}
              {new Date(affiliate.kyc_verified_at).toLocaleDateString()}
            </p>
          )}

          {/* KYC form */}
          {canSubmit && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="kyc-name">Full Legal Name</Label>
                  <Input
                    id="kyc-name"
                    placeholder="Jane Doe"
                    {...register("full_name", {
                      required: "Full name is required",
                    })}
                  />
                  {errors.full_name && (
                    <p className="text-destructive text-xs">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kyc-email">Email Address</Label>
                  <Input
                    id="kyc-email"
                    type="email"
                    placeholder="jane@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kyc-address">Full Address</Label>
                <Textarea
                  id="kyc-address"
                  placeholder="123 Main St, City, State, ZIP, Country"
                  rows={2}
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && (
                  <p className="text-destructive text-xs">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kyc-id">Government ID Notes</Label>
                <div className="flex items-center gap-2 p-3 border border-dashed border-primary/30 rounded-lg text-muted-foreground text-sm">
                  <Upload className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Describe your government-issued ID (Passport, Driver's
                    License, National ID). Our team will contact you securely
                    for document upload.
                  </span>
                </div>
                <Input
                  id="kyc-id"
                  placeholder="e.g. US Passport #123456789"
                  {...register("id_notes")}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || submitKyc.isPending}
              >
                {submitting || submitKyc.isPending
                  ? "Submitting…"
                  : affiliate.kyc_status === "rejected"
                  ? "Resubmit KYC"
                  : "Submit KYC Verification"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
