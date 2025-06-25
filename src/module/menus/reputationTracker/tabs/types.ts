import { UUID } from "crypto";

type FactionReputation = { name: string; id: UUID; repLevel: FactionReputationLabels; repNumber: number };
type FactionReputationLabels = { value: FactionReputationLevels; label: string };
type FactionReputationLevels = "Hunted" | "Hated" | "Disliked" | "Ignored" | "Liked" | "Admired" | "Revered";

export { FactionReputation };
