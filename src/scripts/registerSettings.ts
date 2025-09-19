import { MODNAME } from "src/constants.ts";
import {
    FactionReputation,
    IndividualReputation,
    NotorietyReputation,
} from "src/module/menus/reputationTracker/tabs/types.ts";
import { ReputationSettingsMenu } from "src/module/menus/settings/reputationSettingsMenu.ts";
import {
    hiddenElements,
    reputationControls,
    reputationIncrements,
    reputationRange,
    reputationSettingsTemplates,
} from "src/module/menus/types.ts";

export function registerSettings(): void {
    /**
     * GENERAL MODULE SETTINGS
     */
    game.settings.registerMenu(MODNAME, "reputationSettings", {
        name: "emissary.menu.reputationSettings.title",
        label: "emissary.menu.reputationSettings.title",
        hint: "emissary.menu.reputationSettings.hint",
        type: ReputationSettingsMenu,
        icon: "fa-solid fa-face-smile",
        restricted: true,
    });

    /**
     * REPUTATION SETTINGS
     */

    // Faction Settings

    game.settings.register(MODNAME, "factionReputation", {
        scope: "world",
        config: false,
        type: FactionReputation,
        default: [],
    });

    game.settings.register(MODNAME, "factionReputationRange", {
        scope: "world",
        config: false,
        type: reputationRange,
        default: { minimum: -100, maximum: 100 },
    });

    game.settings.register(MODNAME, "factionReputationIncrement", {
        scope: "world",
        config: false,
        type: reputationIncrements,
        default: [
            { label: "Furious", minimum: -100, maximum: -50, color: "#FF0000" },
            { label: "Angry", minimum: -49, maximum: -25, color: "#FF4500" },
            { label: "Upset", minimum: -24, maximum: -15, color: "#FFA500" },
            { label: "Neutral", minimum: -14, maximum: 14, color: "#FFFFFF" },
            { label: "Pleased", minimum: 15, maximum: 24, color: "#FFFF00" },
            { label: "Happy", minimum: 25, maximum: 49, color: "#9acd32" },
            { label: "Revered", minimum: 50, maximum: 100, color: "#008000" },
        ],
    });

    game.settings.register(MODNAME, "factionReputationControls", {
        scope: "world",
        config: false,
        type: reputationControls,
        default: [
            { label: "Terrible Impression", amount: -5, icon: "fa-regular fa-face-nose-steam" },
            { label: "Poor Impression", amount: -2, icon: "fa-regular fa-face-angry" },
            { label: "Good Impression", amount: 2, icon: "fa-regular fa-face-smile" },
            { label: "Great Impression", amount: 5, icon: "fa-regular fa-face-smile-hearts" },
        ],
    });

    game.settings.register(MODNAME, "factionHiddenElements", {
        scope: "world",
        config: false,
        type: hiddenElements,
    });

    // Interpersonal Settings

    game.settings.register(MODNAME, "interpersonalReputation", {
        scope: "world",
        config: false,
        type: IndividualReputation,
        default: [],
    });

    game.settings.register(MODNAME, "interpersonalReputationRange", {
        scope: "world",
        config: false,
        type: reputationRange,
        default: { minimum: -10, maximum: 10 },
    });

    game.settings.register(MODNAME, "interpersonalReputationIncrement", {
        scope: "world",
        config: false,
        type: reputationIncrements,
        default: [
            { label: "Hated", minimum: -10, maximum: -5, color: "#FF0000" },
            { label: "Unhappy", minimum: -4, maximum: -2, color: "#FFA500" },
            { label: "Neutral", minimum: -1, maximum: 1, color: "#FFFFFF" },
            { label: "Happy", minimum: 2, maximum: 4, color: "#9acd32" },
            { label: "Honored", minimum: 5, maximum: 10, color: "#008000" },
        ],
    });

    game.settings.register(MODNAME, "interpersonalReputationControls", {
        scope: "world",
        config: false,
        type: reputationControls,
        default: [
            { label: "Terrible Impression", amount: -5, icon: "fa-regular fa-face-nose-steam" },
            { label: "Poor Impression", amount: -2, icon: "fa-regular fa-face-angry" },
            { label: "Good Impression", amount: 2, icon: "fa-regular fa-face-smile" },
            { label: "Great Impression", amount: 5, icon: "fa-regular fa-face-smile-hearts" },
        ],
    });

    game.settings.register(MODNAME, "interpersonalHiddenElements", {
        scope: "world",
        config: false,
        type: hiddenElements,
    });

    // Notoriety Settings

    game.settings.register(MODNAME, "notorietyReputation", {
        scope: "world",
        config: false,
        type: NotorietyReputation,
        default: [],
    });

    game.settings.register(MODNAME, "notorietyReputationRange", {
        scope: "world",
        config: false,
        type: reputationRange,
        default: { minimum: -10, maximum: 10 },
    });

    game.settings.register(MODNAME, "notorietyReputationIncrement", {
        scope: "world",
        config: false,
        type: reputationIncrements,
        default: [
            { label: "Hated", minimum: -10, maximum: -5, color: "#FF0000" },
            { label: "Unhappy", minimum: -4, maximum: -2, color: "#FFA500" },
            { label: "Neutral", minimum: -1, maximum: 1, color: "#FFFFFF" },
            { label: "Happy", minimum: 2, maximum: 4, color: "#9acd32" },
            { label: "Honored", minimum: 5, maximum: 10, color: "#008000" },
        ],
    });

    game.settings.register(MODNAME, "notorietyReputationControls", {
        scope: "world",
        config: false,
        type: reputationControls,
        default: [
            { label: "Terrible Impression", amount: -5, icon: "fa-regular fa-face-nose-steam" },
            { label: "Poor Impression", amount: -2, icon: "fa-regular fa-face-angry" },
            { label: "Good Impression", amount: 2, icon: "fa-regular fa-face-smile" },
            { label: "Great Impression", amount: 5, icon: "fa-regular fa-face-smile-hearts" },
        ],
    });

    game.settings.register(MODNAME, "notorietyHiddenElements", {
        scope: "world",
        config: false,
        type: hiddenElements,
    });

    // Data Settings

    game.settings.register(MODNAME, "reputationSettingsTemplates", {
        scope: "world",
        config: false,
        type: reputationSettingsTemplates,
    });
}
