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

        /**
         * @remarks CONFIG.ui.sidebar.TABS gets incorrectly typed as a Record<string, TabsConfiguration> in fvtt-types instead of
         * Record<string, TabsDescriptor>, so this is my shitty workaround. This is NOT actually a TabsConfiguration,
         * it is a proper {@link fvtt-types/configuration#Sidebar.TabsDescriptor}.
         */
        CONFIG.ui.sidebar.TABS.emissary = {
            documentName: "emissary",
            gmOnly: false,
            icon: "fa-solid fa-face-smile",
            tooltip: "Emissary",
        } as unknown as foundry.applications.api.ApplicationV2.TabsConfiguration;

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
