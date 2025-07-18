import { MODNAME } from "src/constants.ts";
import { FactionReputation } from "src/module/menus/reputationTracker/tabs/types.ts";
import { ReputationSettingsMenu } from "src/module/menus/settings/reputationSettingsMenu.ts";
import { ReputationRangeSetting } from "src/module/menus/types.ts";

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

    // Faction Settings
    game.settings.register(MODNAME, "factionReputation", {
        name: "Faction Reputations",
        scope: "world",
        config: false,
        type: Array<FactionReputation>,
        default: [],
    });

    game.settings.register(MODNAME, "factionReputationRange", {
        name: "Faction Reputation Range",
        hint: "Set the minimum and the maximum range for faction reputation.",
        scope: "world",
        config: false,
        type: ReputationRangeSetting,
        default: { minimum: -50, maximum: 50 },
    });

    game.settings.register(MODNAME, "factionReputationIncrement", {
        name: "Faction Reputation Increment",
        scope: "world",
        config: false,
        type: Array,
        default: [
            { label: "Furious", minimum: -50, maximum: -30, color: "#FF0000" },
            { label: "Angry", minimum: -29, maximum: -15, color: "#FF4500" },
            { label: "Upset", minimum: -14, maximum: -5, color: "#FFA500" },
            { label: "Neutral", minimum: -4, maximum: 4, color: "#FFFFFF" },
            { label: "Pleased", minimum: 5, maximum: 14, color: "#FFFF00" },
            { label: "Happy", minimum: 15, maximum: 29, color: "#9acd32" },
            { label: "Revered", minimum: 30, maximum: 50, color: "#008000" },
        ],
    });

    game.settings.register(MODNAME, "factionReputationControls", {
        name: "Faction Reputation Controls",
        scope: "world",
        config: false,
        type: Array,
        default: [
            { label: "Terrible Impression", amount: -5, icon: "fa-regular fa-face-nose-steam" },
            { label: "Poor Impression", amount: -2, icon: "fa-regular fa-face-angry" },
            { label: "Good Impression", amount: 2, icon: "fa-regular fa-face-smile" },
            { label: "Great Impression", amount: 5, icon: "fa-regular fa-face-smile-hearts" },
        ],
    });

    // Interpersonal Settings
    game.settings.register(MODNAME, "interpersonalReputation", {
        name: "Interpersonal Reputations",
        scope: "world",
        config: false,
        type: Array,
        default: [],
    });

    game.settings.register(MODNAME, "interpersonalReputationRange", {
        name: "Interpersonal Reputation Range",
        hint: "Set the minimum and the maximum range for interpersonal reputation.",
        scope: "world",
        config: false,
        type: ReputationRangeSetting,
        default: { minimum: -10, maximum: 10 },
    });

    game.settings.register(MODNAME, "interpersonalReputationIncrement", {
        name: "Interpersonal Reputation Increment",
        scope: "world",
        config: false,
        type: Array,
        default: [
            { label: "Hated", minimum: -10, maximum: -5, color: "#FF0000" },
            { label: "Unhappy", minimum: -4, maximum: -2, color: "#FFA500" },
            { label: "Neutral", minimum: -1, maximum: 1, color: "#FFFFFF" },
            { label: "Happy", minimum: 2, maximum: 4, color: "#9acd32" },
            { label: "Honored", minimum: 5, maximum: 10, color: "#008000" },
        ],
    });

    game.settings.register(MODNAME, "interpersonalReputationControls", {
        name: "Interpersonal Reputation Controls",
        scope: "world",
        config: false,
        type: Array,
        default: [
            { label: "Terrible Impression", amount: -5, icon: "fa-regular fa-face-nose-steam" },
            { label: "Poor Impression", amount: -2, icon: "fa-regular fa-face-angry" },
            { label: "Good Impression", amount: 2, icon: "fa-regular fa-face-smile" },
            { label: "Great Impression", amount: 5, icon: "fa-regular fa-face-smile-hearts" },
        ],
    });
}
