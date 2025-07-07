import { UUID } from "crypto";

type FactionReputation = { name: string; id: UUID; repLevel: FactionReputationLabels; repNumber: number };
type FactionReputationLabels = { color: string; label: string };

export { FactionReputation };
