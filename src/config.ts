import { ApplicationRenderOptions } from "types/types/foundry/client-esm/applications/_types.js";
import ApplicationV2 from "types/types/foundry/client-esm/applications/api/application.js";
import { ReputationTracker } from "./module/menus/reputationTracker/reputationTracker.ts";
import { registerSettings } from "./scripts/registerSettings.ts";
import { registerTemplates } from "./scripts/registerTemplates.ts";

class EmissaryConfig {
    static MODNAME = "emissary";

    static initialize(): void {
        EmissaryConfig.registerHooks();
    }

    static registerHooks(): void {
        Hooks.on("init", () => {
            EmissaryConfig.registerEmissarySettings(EmissaryConfig.MODNAME);
            EmissaryConfig.registerEmissaryTemplates();
        });

        Hooks.on("renderMenuChanges", async (x: ApplicationV2, options: ApplicationRenderOptions) => {
            const currentTab = x.element.querySelector(".tab.active");
            const tabId = currentTab?.id;
            const y = await x.render(options);
            const targetTab = y.element.querySelector(`#${tabId}`);
            targetTab?.classList.add("active");
        });

        Hooks.on("getSceneControlButtons", (controls: Record<string, SceneControl>) =>
            EmissaryConfig.setControlTools(controls),
        );

        console.log("Emissary | Hooks Registered");
    }

    static registerEmissarySettings(MODNAME: string): void {
        registerSettings(MODNAME);

        console.log("Emissary | Settings Registered");
    }

    static registerEmissaryTemplates(): void {
        registerTemplates();

        console.log("Emissary | Templates Registered");
    }

    static setControlTools(controls: Record<string, SceneControl>): void {
        const tokenTools = controls.tokens?.tools;
        tokenTools.reputation = {
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
    }
}

export { EmissaryConfig };
