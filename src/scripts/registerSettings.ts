import { MODNAME } from "src/constants.ts";
import { FactionReputation } from "src/module/menus/reputationTracker/tabs/types.ts";
import { ReputationSettingsMenu } from "src/module/menus/settings/reputationSettingsMenu.ts";

export function registerSettings(): void {
    /**
     * GENERAL MODULE SETTINGS
     */
    game.settings.registerMenu(MODNAME, "reputationSettings", {
        name: "Reputation Settings",
        label: "Reputation Settings",
        hint: "Menu to change default reputation settings",
        type: ReputationSettingsMenu,
        icon: "",
        restricted: true,
    });

    /**
     * REPUTATION SETTINGS
     */
    game.settings.register(MODNAME, "factionReputation", {
        name: "Faction Reputations",
        scope: "world",
        config: false,
        type: Array<FactionReputation>,
        default: [],
    });

    game.settings.register(MODNAME, "individualReputation", {
        name: "Individual Reputations",
        scope: "world",
        config: false,
        type: Array,
        default: [],
    });

    game.settings.register(MODNAME, "factionReputationRange", {
        name: "Faction Reputation Range",
        hint: "Set the minimum and the maximum range for faction reputation.",
        scope: "world",
        config: false,
        type: Object,
        default: { minimum: -50, maximum: 50 },
    });

    game.settings.register(MODNAME, "factionReputationIncrement", {
        name: "Faction Reputation Increment",
        scope: "world",
        config: false,
        type: Array,
        default: [
            { label: "furious", minimum: -50, maximum: -30, color: "#FF0000" },
            { label: "angry", minimum: -29, maximum: -15, color: "#FF4500" },
            { label: "upset", minimum: -14, maximum: -5, color: "#FFA500" },
            { label: "neutral", minimum: -4, maximum: 4, color: "#FFFFFF" },
            { label: "pleased", minimum: 5, maximum: 14, color: "#FFFF00" },
            { label: "happy", minimum: 15, maximum: 29, color: "#9acd32" },
            { label: "revered", minimum: 30, maximum: 50, color: "#008000" },
        ],
    });
}
