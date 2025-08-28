import { MODNAME } from "src/constants.ts";

export class ReputationTabConstructor {
    reputation = {
        faction: {
            settings: game.settings.get(MODNAME, "factionReputation"),
            controls: game.settings.get(MODNAME, "factionReputationControls"),
        },
        interpersonal: {
            settings: game.settings.get("emissary", "interpersonalReputation"),
            controls: game.settings.get(MODNAME, "interpersonalReputationControls"),
        },
    };

    setFactionReputationLevels(): void {
        const repSettings = game.settings.get(MODNAME, "factionReputationIncrement");
        if (!repSettings) return;
        if (!this.reputation.faction.settings) return;
        for (const faction of Object.values(this.reputation.faction.settings)) {
            for (const repLevel of Object.values(repSettings)) {
                if (faction.repNumber <= repLevel.maximum && faction.repNumber >= repLevel.minimum) {
                    faction.repLevel = { label: repLevel.label, color: repLevel.color };
                } else continue;
            }
        }
    }

    setInterpersonalReputationLevels(): void {
        const repSettings = game.settings.get(MODNAME, "interpersonalReputationIncrement");
        if (!repSettings) return;
        if (!this.reputation.interpersonal.settings) return;
        for (const entity of Object.values(this.reputation.interpersonal.settings)) {
            for (const repLevel of Object.values(repSettings)) {
                if (entity.repNumber <= repLevel.maximum && entity.repNumber >= repLevel.minimum) {
                    entity.repLevel = { label: repLevel.label, color: repLevel.color };
                } else continue;
            }
        }
    }
}
