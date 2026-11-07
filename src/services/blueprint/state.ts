export const BLUEPRINT_STATUSES = [
  "pending",
  "research_complete",
  "clarification_complete",
  "decisions_approved",
  "generating",
  "review_complete",
  "approved",
  "rejected",
] as const;

export type BlueprintStatus = (typeof BLUEPRINT_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<BlueprintStatus, BlueprintStatus[]> = {
  pending: ["research_complete", "rejected"],
  research_complete: ["clarification_complete", "rejected"],
  clarification_complete: ["decisions_approved", "rejected"],
  decisions_approved: ["generating", "rejected"],
  generating: ["review_complete", "rejected"],
  review_complete: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export function canTransition(from: BlueprintStatus, to: BlueprintStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionStatus(from: BlueprintStatus, to: BlueprintStatus): BlueprintStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}`);
  }
  return to;
}
