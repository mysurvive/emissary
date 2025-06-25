export function registerSettings(MODNAME: string) {
    game.settings.register(MODNAME, "factionReputation", {
        name: "Faction Reputations",
        scope: "world",
        config: false,
        type: Array,
        default: [],
    });

    game.settings.register(MODNAME, "individualReputation", {
        name: "Individual Reputations",
        scope: "world",
        config: false,
        type: Array,
        default: [],
    });

    game.settings.register(MODNAME, "reputation-factionRange", {
        name: "Faction Reputation Range",
        hint: "Set the minimum and the maximum range for faction reputation.",
        scope: "world",
        config: false,
        type: Object,
        default: { minimum: -50, maximum: 50 },
    });
}
