import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAdminAffiliates, type Affiliate, type AffiliatePayout } from "@/hooks/useAffiliate";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const kycBadge = (status: Affiliate["kyc_status"]) => {
  const map = {
    not_started: { label: "Not Started", variant: "secondary" as const },
    pending: { label: "Pending", variant: "default" as const },
    verified: { label: "Verified", variant: "default" as const },
    rejected: { label: "Rejected", variant: "destructive" as const },
  };
  return map[status] ?? map.not_started;
};

const affiliateStatusBadge = (status: Affiliate["status"]) => {
  const map = {
    pending: { label: "Pending", variant: "secondary" as const },
    approved: { label: "Approved", variant: "default" as const },
    rejected: { label: "Rejected", variant: "destructive" as const },
    inactive: { label: "Inactive", variant: "secondary" as const },
  };
  return map[status] ?? map.pending;
};

const payoutStatusBadge = (status: AffiliatePayout["status"]) => {
  const map = {
    pending: { label: "Pending", variant: "secondary" as const },
    approved: { label: "Approved", variant: "default" as const },
    processing: { label: "Processing", variant: "default" as const },
    completed: { label: "Completed", variant: "default" as const },
    failed: { label: "Failed", variant: "destructive" as const },
  };
  return map[status] ?? map.pending;
};

function AffiliatesTab() {
  const {
    affiliates,
    isLoading,
    approveAffiliate,
    rejectAffiliate,
    verifyKyc,
    rejectKyc,
  } = useAdminAffiliates();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = affiliates.filter(
    (a) =>
      a.referral_code.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading affiliates…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by ID or referral code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referral Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No affiliates found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => {
                const isExpanded = expanded === a.id;
                const statusB = affiliateStatusBadge(a.status);
                const kycB = kycBadge(a.kyc_status);

                return (
                  <>
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm font-semibold text-primary">
                        {a.referral_code}
                      </TableCell>
                      <TableCell className="capitalize">{a.affiliate_type}</TableCell>
                      <TableCell>
                        <Badge variant={statusB.variant}>{statusB.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={kycB.variant}>{kycB.label}</Badge>
                      </TableCell>
                      <TableCell>${a.available_balance.toFixed(2)}</TableCell>
                      <TableCell>${a.total_earnings.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {a.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 px-2 text-xs"
                                onClick={() => approveAffiliate.mutate(a.id)}
                                disabled={approveAffiliate.isPending}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 px-2 text-xs"
                                onClick={() => rejectAffiliate.mutate(a.id)}
                                disabled={rejectAffiliate.isPending}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {a.kyc_status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-green-500/40 text-green-400 hover:bg-green-500/10"
                                onClick={() => verifyKyc.mutate(a.id)}
                                disabled={verifyKyc.isPending}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Verify KYC
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => rejectKyc.mutate(a.id)}
                                disabled={rejectKyc.isPending}
                              >
                                Reject KYC
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => setExpanded(isExpanded ? null : a.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${a.id}-details`}>
                        <TableCell colSpan={8} className="bg-muted/20 text-xs text-muted-foreground px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <span className="font-semibold">ID:</span>{" "}
                              <span className="font-mono">{a.id}</span>
                            </div>
                            <div>
                              <span className="font-semibold">Commission:</span>{" "}
                              {a.commission_rate}%
                            </div>
                            <div>
                              <span className="font-semibold">Joined:</span>{" "}
                              {new Date(a.created_at).toLocaleDateString()}
                            </div>
                            {a.kyc_verified_at && (
                              <div>
                                <span className="font-semibold">KYC Verified:</span>{" "}
                                {new Date(a.kyc_verified_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PayoutsTab() {
  const { pendingPayouts, payoutsLoading, approvePayout } = useAdminAffiliates();

  if (payoutsLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading payouts…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingPayouts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No pending payout requests.
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayouts.map((p) => {
                const statusB = payoutStatusBadge(p.status);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.affiliate_id.slice(0, 8)}…</TableCell>
                    <TableCell className="font-bold text-primary">
                      ${p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {p.payment_method.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusB.variant}>{statusB.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(p.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {p.status === "pending" && (
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs"
                          onClick={() => approvePayout.mutate(p.id)}
                          disabled={approvePayout.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve & Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminAffiliates() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { affiliates, isLoading, pendingPayouts } = useAdminAffiliates();

  if (loading) {
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

  const totalEarnings = affiliates.reduce((s, a) => s + a.total_earnings, 0);
  const approvedCount = affiliates.filter((a) => a.status === "approved").length;
  const pendingKyc = affiliates.filter((a) => a.kyc_status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-black">
            Admin <span className="text-primary">Affiliates</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage affiliate accounts, KYC approvals and payout requests
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              icon: Users,
              label: "Total Affiliates",
              value: affiliates.length.toString(),
            },
            {
              icon: CheckCircle,
              label: "Approved",
              value: approvedCount.toString(),
            },
            {
              icon: Shield,
              label: "Pending KYC",
              value: pendingKyc.toString(),
            },
            {
              icon: DollarSign,
              label: "Total Earnings",
              value: `$${totalEarnings.toFixed(2)}`,
            },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="bg-background/60 border-primary/20">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold font-display">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending payout alert */}
        {pendingPayouts.length > 0 && (
          <Card className="mb-6 bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-4">
              <p className="text-sm text-yellow-300">
                ⚠️ {pendingPayouts.length} payout request
                {pendingPayouts.length !== 1 ? "s" : ""} pending approval.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="affiliates">
          <TabsList className="mb-6">
            <TabsTrigger value="affiliates">
              All Affiliates ({isLoading ? "…" : affiliates.length})
            </TabsTrigger>
            <TabsTrigger value="payouts">
              Pending Payouts ({pendingPayouts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="affiliates">
            <Card className="bg-background/60 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Affiliate Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AffiliatesTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card className="bg-background/60 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Pending Payout Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PayoutsTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
