import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { z } from "zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import neon21Logo from "@/assets/neon21-logo.png";

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    // Listen for auth state changes FIRST (recovery link will trigger this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      if (!isMounted) return;
      
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      } else if (event === 'SIGNED_IN' && session) {
        // Also allow if user is signed in (recovery creates a session)
        setValidSession(true);
      }
    });

    // Then check for existing session or URL tokens
    const checkSession = async () => {
      // Check URL hash for recovery token (older Supabase flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      // Check URL query params (newer PKCE flow)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');
      
      // If there's an error in the URL, show invalid state
      if (errorParam) {
        if (isMounted) setValidSession(false);
        return;
      }
      
      // If there's a code param, Supabase needs to exchange it
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            if (isMounted) setValidSession(false);
          }
          // Auth state listener will handle setting validSession on success
        } catch (err) {
          console.error('Code exchange exception:', err);
          if (isMounted) setValidSession(false);
        }
        return;
      }
      
      // Check hash params (older flow)
      if (type === 'recovery' && accessToken) {
        if (isMounted) setValidSession(true);
        return;
      }
      
      // Check if there's already a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (isMounted) setValidSession(true);
      } else {
        // Give a short delay to allow auth events to fire, then mark as invalid
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setValidSession((current) => current === null ? false : current);
          }
        }, 2000);
      }
    };
    
    checkSession();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const validateInputs = () => {
    try {
      passwordSchema.parse({ password, confirmPassword });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { password?: string; confirmPassword?: string } = {};
        err.errors.forEach((e) => {
          if (e.path[0] === "password") fieldErrors.password = e.message;
          if (e.path[0] === "confirmPassword") fieldErrors.confirmPassword = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      setSuccess(true);
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      
      // Sign out to clear the recovery session
      await supabase.auth.signOut();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-primary animate-pulse">Verifying reset link...</div>
      </div>
    );
  }

  // Invalid/expired link
  if (validSession === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-primary/20 text-center">
            <AlertCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3"
            >
              REQUEST NEW LINK
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-primary/20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-6"
            >
              <CheckCircle2 className="w-20 h-20 text-primary mx-auto drop-shadow-[0_0_20px_hsl(var(--primary)/0.8)]" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. You can now sign in with your new credentials.
            </p>
            
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3"
            >
              GO TO LOGIN
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl shadow-primary/20">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/60 blur-3xl rounded-full scale-[2] animate-pulse" />
              <img src={neon21Logo} alt="Neon21" className="relative h-20 mb-4 drop-shadow-[0_0_40px_hsl(var(--primary)/0.8)]" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Set New Password</h1>
            <p className="text-muted-foreground text-sm text-center">Enter your new password below</p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className={`bg-background/50 border-border focus:border-primary ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                placeholder="Re-enter your password"
                required
                className={`bg-background/50 border-border focus:border-primary ${errors.confirmPassword ? 'border-destructive' : ''}`}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3"
            >
              {loading ? (
                <span className="animate-pulse">Updating...</span>
              ) : (
                "UPDATE PASSWORD"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;