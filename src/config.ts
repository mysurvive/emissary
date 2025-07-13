import { ReputationTracker } from "./module/menus/reputationTracker/reputationTracker.ts";
import { registerSettings } from "./scripts/registerSettings.ts";
import { registerTemplates } from "./scripts/registerTemplates.ts";
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

        Hooks.on("getSceneControlButtons", (controls: Record<string, SceneControls.Control>) => {
            controls.tokens.tools.reputation = {
                icon: "fa-solid fa-face-smile",
                name: "reputation",
                title: "Reputation Tracker",
                visible: true,
                button: true,
                order: Object.keys(controls.tokens.tools).length,
                onChange: () => {
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
