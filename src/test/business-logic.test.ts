import { describe, it, expect } from "vitest";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Replicated from Clients.tsx - pure function
const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "Fecha no disponible";
  const date = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
  return isValid(date) ? format(date, formatStr, { locale: es }) : "Fecha invalida";
};

// Replicated from Inventory.tsx
const isLowStock = (stockLevel: number) => stockLevel < 5;

// Replicated from useTenant.tsx - subscription status logic
type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

function computeSubscriptionStatus(
  status: SubscriptionStatus,
  trialEndsAt: string
): { computedStatus: SubscriptionStatus; daysLeftInTrial: number | null } {
  if (status === "active") {
    return { computedStatus: "active", daysLeftInTrial: null };
  }
  if (status === "trial") {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > new Date()) {
      const daysLeft = Math.ceil(
        (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return { computedStatus: "trial", daysLeftInTrial: daysLeft };
    }
    return { computedStatus: "expired", daysLeftInTrial: null };
  }
  return { computedStatus: status, daysLeftInTrial: null };
}

describe("formatDate", () => {
  it("returns 'Fecha no disponible' for null", () => {
    expect(formatDate(null, "d MMM yyyy")).toBe("Fecha no disponible");
  });

  it("returns 'Fecha no disponible' for undefined", () => {
    expect(formatDate(undefined, "d MMM yyyy")).toBe("Fecha no disponible");
  });

  it("formats a valid ISO date correctly", () => {
    const result = formatDate("2024-06-15T10:00:00Z", "d MMM yyyy");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("returns 'Fecha invalida' for garbage string", () => {
    expect(formatDate("not-a-date", "d MMM yyyy")).toBe("Fecha invalida");
  });
});

describe("isLowStock", () => {
  it("returns true for stock below 5", () => {
    expect(isLowStock(0)).toBe(true);
    expect(isLowStock(4)).toBe(true);
  });

  it("returns false for stock at or above 5", () => {
    expect(isLowStock(5)).toBe(false);
    expect(isLowStock(100)).toBe(false);
  });
});

describe("computeSubscriptionStatus", () => {
  it("returns active for active subscriptions", () => {
    const result = computeSubscriptionStatus("active", "2024-01-01T00:00:00Z");
    expect(result.computedStatus).toBe("active");
    expect(result.daysLeftInTrial).toBeNull();
  });

  it("returns trial with days left for valid trial", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const result = computeSubscriptionStatus("trial", futureDate.toISOString());
    expect(result.computedStatus).toBe("trial");
    expect(result.daysLeftInTrial).toBeGreaterThanOrEqual(9);
    expect(result.daysLeftInTrial).toBeLessThanOrEqual(11);
  });

  it("returns expired for past trial", () => {
    const result = computeSubscriptionStatus("trial", "2020-01-01T00:00:00Z");
    expect(result.computedStatus).toBe("expired");
    expect(result.daysLeftInTrial).toBeNull();
  });

  it("passes through cancelled status", () => {
    const result = computeSubscriptionStatus("cancelled", "2024-01-01T00:00:00Z");
    expect(result.computedStatus).toBe("cancelled");
  });

  it("passes through past_due status", () => {
    const result = computeSubscriptionStatus("past_due", "2024-01-01T00:00:00Z");
    expect(result.computedStatus).toBe("past_due");
  });
});
