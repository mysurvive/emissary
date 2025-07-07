import { MODNAME } from "src/constants.ts";
import { FactionReputation } from "./types.ts";

export class ReputationTabConstructor {
    reputation = {
        faction: game.settings
            ? (game.settings.get(MODNAME, "factionReputation") as FactionReputation[])
            : ([] as FactionReputation[]),
        individual: game.settings ? (game.settings.get("emissary", "individualReputation") as any[]) : [],
    };

    setFactionReputationLevels(): void {
        if (!game.settings) return;
        const repSettings = game.settings.get(MODNAME, "factionReputationIncrement");
        for (const faction of this.reputation.faction) {
            for (const repLevel of repSettings) {
                if (faction.repNumber <= repLevel.maximum && faction.repNumber >= repLevel.minimum) {
                    faction.repLevel = { label: repLevel.label, color: repLevel.color };
                } else continue;
            }
        }
    }
}
