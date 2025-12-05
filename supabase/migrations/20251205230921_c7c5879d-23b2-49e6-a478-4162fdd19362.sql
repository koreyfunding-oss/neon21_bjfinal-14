-- Add explicit DENY policies for cis_logs to prevent modification/deletion
-- Game history should be immutable

CREATE POLICY "Deny update on cis_logs"
ON public.cis_logs
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny delete on cis_logs"
ON public.cis_logs
FOR DELETE
USING (false);