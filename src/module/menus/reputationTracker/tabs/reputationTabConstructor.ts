import { FactionReputation } from "./types.ts";

export class ReputationTabConstructor {
    reputation = {
        faction: game.settings.get("emissary", "factionReputation") as Array<FactionReputation>,
        individual: game.settings.get("emissary", "individualReputation") as Array<any>,
    };

    setFactionReputationLevels(): void {
        const i18nRepPrefix = "emissary.reputation.degrees.";
        for (const faction of this.reputation.faction) {
            if (faction.repNumber <= -30)
                faction.repLevel = { value: "Hunted", label: game.i18n.localize(i18nRepPrefix + "hunted") };
            else if (faction.repNumber <= -15)
                faction.repLevel = { value: "Hated", label: game.i18n.localize(i18nRepPrefix + "hated") };
            else if (faction.repNumber <= -5)
                faction.repLevel = { value: "Disliked", label: game.i18n.localize(i18nRepPrefix + "disliked") };
            else if (faction.repNumber <= 4)
                faction.repLevel = { value: "Ignored", label: game.i18n.localize(i18nRepPrefix + "ignored") };
            else if (faction.repNumber <= 14)
                faction.repLevel = { value: "Liked", label: game.i18n.localize(i18nRepPrefix + "liked") };
            else if (faction.repNumber <= 29)
                faction.repLevel = { value: "Admired", label: game.i18n.localize(i18nRepPrefix + "admired") };
            else faction.repLevel = { value: "Revered", label: game.i18n.localize(i18nRepPrefix + "revered") };
        }
    }
}
