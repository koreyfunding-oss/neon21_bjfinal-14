import { supabase } from "@/integrations/supabase/client";

export type SquarePlan = "weekly" | "monthly";

/**
 * Initiates Square checkout for the given plan by calling the
 * square-checkout edge function, which returns a hosted payment URL.
 */
export async function initiateSquareCheckout(plan: SquarePlan): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("You must be logged in to subscribe");
  }

  const { data, error } = await supabase.functions.invoke("square-checkout", {
    body: { plan },
  });

  if (error) {
    throw new Error(error.message ?? "Failed to create checkout session");
  }

  if (!data?.url) {
    throw new Error("No checkout URL returned");
  }

  return data.url as string;
}
