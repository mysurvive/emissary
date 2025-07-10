import { EmissaryConfig } from "./config.ts";
import { FactionReputation } from "./module/menus/reputationTracker/tabs/types.ts";
import { FactionReputationIncrement } from "./module/menus/types.ts";
import "./styles/emissary.scss";

/**
 * Entrypoint for emissary
 */
(async () => {
    console.log("Emissary | initializing");
    EmissaryConfig.initialize();
})();

declare module "fvtt-types/configuration" {
    namespace Hooks {
        interface HookConfig {
            [k: string]: (...args: any[]) => any;
        }
    }
}

declare global {
    interface AssumeHookRan {
        ready: true;
    }

    interface SettingConfig {
        "emissary.factionReputation": typeof Array<FactionReputation>;
        "emissary.factionReputationRange": { minimum: number; maximum: number };
        "emissary.individualReputation": any[]; // TODO: Type
        "emissary.factionReputationIncrement": FactionReputationIncrement[];
    }

    interface SceneControls {
        "Control.tools": Record<string, SceneControls.Tool>;
    }
}
