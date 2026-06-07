import { registerSettings } from "./scripts/registerSettings.ts";
import { registerTemplates } from "./scripts/registerTemplates.ts";
import { registerHandlebarsHelpers } from "./scripts/registerHandlebarsHelpers.ts";
import { ReputationTrackerSidebar } from "./module/menus/reputationTracker/reputationTrackerSidebar.ts";

class EmissaryConfig {
    static initialize(): void {
        EmissaryConfig.registerHooks();
        EmissaryConfig.registerEmissaryHandlebarsHelpers();
    }

    static registerHooks(): void {
        Hooks.on("init", () => {
            EmissaryConfig.registerEmissarySettings();
            EmissaryConfig.registerEmissaryTemplates();
        });

        CONFIG.ui.sidebar.TABS.emissary = {
            documentName: "emissary",
            gmOnly: false,
            icon: "fa-solid fa-face-smile",
            tooltip: "Emissary",
        };

        CONFIG.ui.emissary = ReputationTrackerSidebar;

        console.log("Emissary | Sidebar Registered");

        console.log("Emissary | Hooks Registered");
    }

    static registerEmissarySettings(): void {
        registerSettings();

        console.log("Emissary | Settings Registered");
    }

    static registerEmissaryTemplates(): void {
        registerTemplates();

        console.log("Emissary | Templates Registered");
    }

    static registerEmissaryHandlebarsHelpers(): void {
        registerHandlebarsHelpers();

        console.log("Emissary | Handlebars Helpers Registered");
    }
}

export { EmissaryConfig };
