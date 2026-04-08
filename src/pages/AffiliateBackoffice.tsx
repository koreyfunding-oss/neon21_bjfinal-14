import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Link2,
  TrendingUp,
  Users,
  Copy,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAffiliate } from "@/hooks/useAffiliate";
import AffiliateKYC from "@/components/AffiliateKYC";
import PayoutRequest from "@/components/PayoutRequest";
import PayoutHistory from "@/components/PayoutHistory";
import { useNavigate } from "react-router-dom";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="bg-background/60 border-primary/20">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-xl font-bold font-display">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AffiliateBackoffice() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    affiliate,
    affiliateLoading,
    earnings,
    earningsLoading,
    registerAffiliate,
    canRequestPayout,
  } = useAffiliate();

  const [copied, setCopied] = useState(false);

  const referralUrl = affiliate
    ? `${window.location.origin}/signup?ref=${affiliate.referral_code}`
    : "";

  const copyReferralLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (affiliateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // No affiliate record yet
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full space-y-6 text-center"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-black">
              Join the{" "}
              <span className="text-primary">Affiliate Program</span>
            </h1>
            <p className="text-muted-foreground">
              Earn commissions by referring players to Neon21.
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="bg-background/60 border-primary/20 text-left">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-primary/10 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Standard Affiliate</p>
                    <p className="text-xs text-muted-foreground">
                      20% commission · Instant approval · Great for creators &amp; players
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => registerAffiliate.mutate("standard")}
                  disabled={registerAffiliate.isPending}
                >
                  {registerAffiliate.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                  ) : (
                    <>Join as Standard <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-background/60 border-purple-500/30 text-left">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-purple-500/10 mt-0.5">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Influencer Affiliate</p>
                    <p className="text-xs text-muted-foreground">
                      40% commission · Pending admin approval · For large audiences
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-purple-500/40 hover:bg-purple-500/10"
                  onClick={() => registerAffiliate.mutate("influencer")}
                  disabled={registerAffiliate.isPending}
                >
                  Apply as Influencer
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  const pendingEarnings = earnings
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-display font-black">
                Affiliate{" "}
                <span className="text-primary">Backoffice</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your referrals, earnings and payouts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  affiliate.status === "approved"
                    ? "default"
                    : affiliate.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {affiliate.affiliate_type === "influencer" ? "Influencer" : "Standard"} ·{" "}
                {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
              </Badge>
              <Badge variant="outline">
                {affiliate.commission_rate}% commission
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Earnings"
            value={`$${affiliate.total_earnings.toFixed(2)}`}
            sub="All time"
          />
          <StatCard
            icon={TrendingUp}
            label="Available Balance"
            value={`$${affiliate.available_balance.toFixed(2)}`}
            sub={
              canRequestPayout
                ? "Payout available"
                : `Need $${Math.max(0, 10 - affiliate.available_balance).toFixed(2)} more`
            }
          />
          <StatCard
            icon={Users}
            label="Referral Earnings"
            value={`$${pendingEarnings.toFixed(2)}`}
            sub={`${earnings.length} transaction${earnings.length !== 1 ? "s" : ""}`}
          />
        </div>

        {/* Referral link */}
        {affiliate.status === "approved" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-background/60 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="w-4 h-4 text-primary" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/40 rounded-md px-3 py-2 text-sm font-mono truncate text-muted-foreground">
                    {referralUrl}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyReferralLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Code: <span className="font-mono font-semibold text-primary">{affiliate.referral_code}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pending approval notice */}
        {affiliate.status === "pending" && (
          <Card className="mb-6 bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-4">
              <p className="text-sm text-yellow-300">
                Your influencer application is pending admin approval. You'll
                receive your referral link once approved.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main tabs */}
        <Tabs defaultValue="kyc">
          <TabsList className="mb-6">
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
            <TabsTrigger value="payout">Request Payout</TabsTrigger>
            <TabsTrigger value="history">Payout History</TabsTrigger>
            <TabsTrigger value="earnings">Earnings Ledger</TabsTrigger>
          </TabsList>

          <TabsContent value="kyc">
            <AffiliateKYC affiliate={affiliate} />
          </TabsContent>

          <TabsContent value="payout">
            <PayoutRequest affiliate={affiliate} />
          </TabsContent>

          <TabsContent value="history">
            <PayoutHistory />
          </TabsContent>

          <TabsContent value="earnings">
            <Card className="bg-background/60 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Earnings Ledger
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading…
                  </div>
                ) : earnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No earnings yet. Share your referral link to start earning!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {earnings.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {e.type} commission
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(e.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          +${e.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
