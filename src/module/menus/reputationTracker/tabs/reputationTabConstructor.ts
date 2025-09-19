import { MODNAME } from "src/constants.ts";

export class ReputationTabConstructor {
    reputation = {
        faction: {
            settings: game.settings.get(MODNAME, "factionReputation"),
            controls: game.settings.get(MODNAME, "factionReputationControls"),
        },
        interpersonal: {
            settings: game.settings.get(MODNAME, "interpersonalReputation"),
            controls: game.settings.get(MODNAME, "interpersonalReputationControls"),
        },
        notoriety: {
            settings: game.settings.get(MODNAME, "notorietyReputation"),
            controls: game.settings.get(MODNAME, "notorietyReputationControls"),
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

    async setNotorietyReputationLevels(): Promise<void> {
        if (!this.reputation.notoriety.settings || !Array.isArray(this.reputation.notoriety.settings)) throw "Error";
        for (const entity of Object.values(this.reputation.notoriety.settings)) {
            if (!entity || !entity.playerRep || !entity.increments || !Array.isArray(entity.increments)) continue;
            for (const character of Object.values(entity.playerRep)) {
                const repLevel = entity.increments.find((i) => {
                    if (
                        i &&
                        i.maximum &&
                        i.minimum &&
                        i.maximum >= character.repNumber &&
                        i.minimum <= character.repNumber
                    ) {
                        return i;
                    } else {
                        return undefined;
                    }
                });
                character.repLevel = { color: repLevel?.color, label: repLevel?.label };
            }
        }
    }
}
