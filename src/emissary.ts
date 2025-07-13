import { EmissaryConfig } from "./config.ts";
import { FactionReputation, IndividualReputation } from "./module/menus/reputationTracker/tabs/types.ts";
import { ReputationControls, ReputationIncrement, ReputationRangeSetting } from "./module/menus/types.ts";
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
            getSceneControlButtons: (controls: Record<string, SceneControls.Control>) => void;
        }
    }
}

declare global {
    interface AssumeHookRan {
        ready: true;
    }

    interface SettingConfig {
        "emissary.factionReputation": FactionReputation[];
        "emissary.factionReputationRange": typeof ReputationRangeSetting;
        "emissary.factionReputationIncrement": ReputationIncrement[];
        "emissary.factionReputationControls": ReputationControls[];
        "emissary.interpersonalReputation": IndividualReputation[]; // TODO: Type
        "emissary.interpersonalReputationRange": typeof ReputationRangeSetting;
        "emissary.interpersonalReputationIncrement": ReputationIncrement[];
        "emissary.interpersonalReputationControls": ReputationControls[];
    }

    interface SceneControls {
        "Control.tools": Record<string, SceneControls.Tool>;
    }
}
