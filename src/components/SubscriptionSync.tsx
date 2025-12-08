import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionSyncProps {
  onSyncComplete?: () => void;
}

export const SubscriptionSync = ({ onSyncComplete }: SubscriptionSyncProps) => {
  const [licenseKey, setLicenseKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSync = async () => {
    if (!licenseKey.trim()) {
      toast.error("Please enter your license key");
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in first");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("whop-validate", {
        body: { license_key: licenseKey.trim() },
      });

      if (error) {
        console.error("Sync error:", error);
        setStatus("error");
        toast.error("Failed to validate license key");
        return;
      }

      if (data?.success && data?.tier !== "free") {
        setStatus("success");
        toast.success(`Subscription synced! You are now ${data.tier.toUpperCase()}`);
        onSyncComplete?.();
      } else if (data?.tier === "free") {
        setStatus("error");
        toast.error("No active subscription found for this license key");
      } else {
        setStatus("error");
        toast.error(data?.error || "Invalid license key");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setStatus("error");
      toast.error("Failed to sync subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Link Your Subscription</span>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">
        Enter your Whop license key to activate your premium features
      </p>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter license key..."
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          className="flex-1 bg-background/50 border-border/50 text-sm"
          disabled={isLoading}
        />
        <Button
          onClick={handleSync}
          disabled={isLoading || !licenseKey.trim()}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : status === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            "Sync"
          )}
        </Button>
      </div>

      {status === "success" && (
        <p className="text-xs text-green-500 mt-2">Subscription activated successfully!</p>
      )}
    </motion.div>
  );
};
