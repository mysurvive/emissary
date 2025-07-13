import { UUID } from "crypto";

export type FactionReputation = { name: string; id: UUID; repLevel: ReputationLevels; repNumber: number };
export type IndividualReputation = { name: string; id: UUID; repLevel: ReputationLevels; repNumber: number };
type ReputationLevels = { color: string; label: string };
