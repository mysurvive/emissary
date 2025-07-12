import { EmissaryConfig } from "./config.ts";
import { FactionReputation } from "./module/menus/reputationTracker/tabs/types.ts";
import { ReputationIncrementSetting, ReputationRangeSetting } from "./module/menus/types.ts";
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
        "emissary.factionReputationRange": typeof ReputationRangeSetting;
        "emissary.factionReputationIncrement": ReputationIncrementSetting[];
        "emissary.factionReputationControls": any[]; //TODO: Type
        "emissary.interpersonalReputation": any[]; // TODO: Type
        "emissary.interpersonalReputationRange": typeof ReputationRangeSetting;
        "emissary.interpersonalReputationIncrement": any[];
        "emissary.interpersonalReputationControls": any[];
    }

    interface SceneControls {
        "Control.tools": Record<string, SceneControls.Tool>;
    }
}
