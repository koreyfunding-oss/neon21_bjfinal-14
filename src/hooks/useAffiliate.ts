import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Affiliate = {
  id: string;
  user_id: string;
  affiliate_type: "standard" | "influencer";
  status: "pending" | "approved" | "rejected" | "inactive";
  commission_rate: number;
  total_earnings: number;
  available_balance: number;
  kyc_status: "not_started" | "pending" | "verified" | "rejected";
  kyc_verified_at: string | null;
  referral_code: string;
  marketing_links_json: unknown;
  created_at: string;
  updated_at: string;
};

export type AffiliatePayout = {
  id: string;
  affiliate_id: string;
  amount: number;
  status: "pending" | "approved" | "processing" | "completed" | "failed";
  payment_method: "paypal" | "apple_pay" | "bank_transfer" | "other";
  square_transfer_id: string | null;
  destination_details: unknown;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  notes: string | null;
};

export type AffiliateEarning = {
  id: string;
  affiliate_id: string;
  referral_id: string | null;
  amount: number;
  type: "signup" | "conversion" | "subscription";
  created_at: string;
};

export function useAffiliate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's affiliate record
  const {
    data: affiliate,
    isLoading: affiliateLoading,
    error: affiliateError,
  } = useQuery({
    queryKey: ["affiliate", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as Affiliate | null;
    },
  });

  // Fetch earnings history
  const { data: earnings = [], isLoading: earningsLoading } = useQuery({
    queryKey: ["affiliate_earnings", affiliate?.id],
    enabled: !!affiliate?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_earnings")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AffiliateEarning[];
    },
  });

  // Fetch payout history
  const { data: payouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ["affiliate_payouts", affiliate?.id],
    enabled: !!affiliate?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data as AffiliatePayout[];
    },
  });

  // Register as affiliate
  const registerAffiliate = useMutation({
    mutationFn: async (type: "standard" | "influencer") => {
      const { data, error } = await supabase.rpc("create_affiliate", {
        p_affiliate_type: type,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", user?.id] });
      toast.success("Affiliate account created!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register as affiliate");
    },
  });

  // Submit KYC
  const submitKyc = useMutation({
    mutationFn: async (kycData: {
      full_name: string;
      email: string;
      address: string;
      id_document_url?: string;
    }) => {
      const res = await supabase.functions.invoke("kyc-verify", {
        body: { affiliate_id: affiliate?.id, ...kycData },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate", user?.id] });
      toast.success("KYC submitted – under review.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "KYC submission failed");
    },
  });

  // Request payout
  const requestPayout = useMutation({
    mutationFn: async (payoutData: {
      amount: number;
      payment_method: "paypal" | "apple_pay" | "bank_transfer" | "other";
      destination_details: Record<string, string>;
    }) => {
      const res = await supabase.functions.invoke("request-payout", {
        body: { affiliate_id: affiliate?.id, ...payoutData },
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate_payouts", affiliate?.id] });
      queryClient.invalidateQueries({ queryKey: ["affiliate", user?.id] });
      toast.success("Payout request submitted!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Payout request failed");
    },
  });

  const canRequestPayout =
    affiliate?.kyc_status === "verified" &&
    affiliate?.status === "approved" &&
    (affiliate?.available_balance ?? 0) >= 10;

  return {
    affiliate,
    affiliateLoading,
    affiliateError,
    earnings,
    earningsLoading,
    payouts,
    payoutsLoading,
    registerAffiliate,
    submitKyc,
    requestPayout,
    canRequestPayout,
  };
}

// Admin: fetch all affiliates
export function useAdminAffiliates() {
  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["admin_affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Affiliate[];
    },
  });

  const { data: pendingPayouts = [], isLoading: payoutsLoading } = useQuery({
    queryKey: ["admin_pending_payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("status", "pending")
        .order("requested_at", { ascending: true });
      if (error) throw error;
      return data as AffiliatePayout[];
    },
  });

  const queryClient = useQueryClient();

  const approveAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      const res = await supabase.functions.invoke("approve-payout", {
        body: { action: "approve_affiliate", affiliate_id: affiliateId },
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliates"] });
      toast.success("Affiliate approved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectAffiliate = useMutation({
    mutationFn: async (affiliateId: string) => {
      const res = await supabase.functions.invoke("approve-payout", {
        body: { action: "reject_affiliate", affiliate_id: affiliateId },
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliates"] });
      toast.success("Affiliate rejected");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const approvePayout = useMutation({
    mutationFn: async (payoutId: string) => {
      const res = await supabase.functions.invoke("approve-payout", {
        body: { action: "approve_payout", payout_id: payoutId },
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pending_payouts"] });
      toast.success("Payout approved – processing");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const verifyKyc = useMutation({
    mutationFn: async (affiliateId: string) => {
      const res = await supabase.functions.invoke("kyc-verify", {
        body: { action: "admin_verify", affiliate_id: affiliateId },
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliates"] });
      toast.success("KYC verified");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectKyc = useMutation({
    mutationFn: async (affiliateId: string) => {
      const res = await supabase.functions.invoke("kyc-verify", {
        body: { action: "admin_reject", affiliate_id: affiliateId },
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_affiliates"] });
      toast.success("KYC rejected");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    affiliates,
    isLoading,
    pendingPayouts,
    payoutsLoading,
    approveAffiliate,
    rejectAffiliate,
    approvePayout,
    verifyKyc,
    rejectKyc,
  };
}
