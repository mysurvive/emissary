import { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client-esm/applications/_types.mts";
import { ReputationTracker } from "./module/menus/reputationTracker/reputationTracker.ts";
import { registerSettings } from "./scripts/registerSettings.ts";
import { registerTemplates } from "./scripts/registerTemplates.ts";
import ApplicationV2 from "node_modules/fvtt-types/src/foundry/client-esm/applications/api/application.mts";
import { registerHandlebarsHelpers } from "./scripts/registerHandlebarsHelpers.ts";

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

        Hooks.on("renderMenuChanges", async (x: ApplicationV2, options: ApplicationRenderOptions) => {
            const currentTab = x.element.querySelector(".tab.active");
            const tabId = currentTab?.id;
            const y = await x.render(options);
            const targetTab = y.element.querySelector(`#${tabId}`);
            targetTab?.classList.add("active");
        });

        Hooks.on("getSceneControlButtons", (controls: Record<string, SceneControls.Control>) => {
            controls.tokens.tools.reputation = {
                icon: "fa-solid fa-face-smile",
                name: "reputation",
                title: "Reputation Tracker",
                visible: true,
                button: true,
                onClick: () => {
                    new ReputationTracker().render(true);
                },
            };

            console.log("Emissary | Tools Registered");
        });

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
