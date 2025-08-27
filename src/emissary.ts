import { EmissaryConfig } from "./config.ts";
import { FactionReputation, IndividualReputation } from "./module/menus/reputationTracker/tabs/types.ts";
import {
    factionHiddenElements,
    interpersonalHiddenElements,
    reputationControls,
    reputationIncrements,
    reputationRange,
    reputationSettingsTemplates,
} from "./module/menus/types.ts";
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
    interface SettingConfig {
        "emissary.factionReputation": typeof FactionReputation;
        "emissary.factionReputationRange": typeof reputationRange;
        "emissary.factionReputationIncrement": typeof reputationIncrements;
        "emissary.factionReputationControls": typeof reputationControls;
        "emissary.interpersonalReputation": typeof IndividualReputation;
        "emissary.interpersonalReputationRange": typeof reputationRange;
        "emissary.interpersonalReputationIncrement": typeof reputationIncrements;
        "emissary.interpersonalReputationControls": typeof reputationControls;
        "emissary.reputationSettingsTemplates": typeof reputationSettingsTemplates;
        "emissary.factionHiddenElements": typeof factionHiddenElements;
        "emissary.interpersonalHiddenElements": typeof interpersonalHiddenElements;
    }
}

declare global {
    interface AssumeHookRan {
        ready: true;
    }
}
