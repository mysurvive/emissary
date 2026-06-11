export function registerTemplates(): void {
    const templatePaths = [
        /**
         * Menu Templates
         */
        "modules/emissary/templates/menu/reputationSettingsMenu.hbs",

        /**
         * Menu Partials
         */
        "modules/emissary/templates/menu/partials/settingsCategory.hbs",
        "modules/emissary/templates/menu/partials/setting.hbs",
        "modules/emissary/templates/menu/partials/reputationRange.hbs",
        "modules/emissary/templates/menu/partials/reputationIncrement.hbs",
        "modules/emissary/templates/menu/partials/reputationControls.hbs",

        /**
         * Entity Log
         */
        "modules/emissary/templates/entity-logs/log-wrapper.hbs",
        "modules/emissary/templates/entity-logs/log-item.hbs",
    ];

    loadTemplates(templatePaths);
}
