export function registerTemplates(): void {
    const templatePaths = [
        /**
         * Menu Partials
         */
        "modules/emissary/templates/reputation-tracker/partials/faction-item.hbs",
    ];

    loadTemplates(templatePaths);
}
