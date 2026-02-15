import { supabase } from "@/integrations/supabase/client";

type AuditAction = "create" | "update" | "delete" | "activate" | "suspend" | "extend_trial" | "impersonate" | "edit";
type EntityType = "client" | "appointment" | "inventory" | "sale" | "expense" | "team_member" | "service" | "cabin" | "tenant";

interface AuditEntry {
  tenantId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit({ tenantId, action, entityType, entityId, details }: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ?? {},
    } as Record<string, unknown>);
  } catch {
    // Audit log should never break the app - silently fail
    console.warn("Failed to write audit log");
  }
}
