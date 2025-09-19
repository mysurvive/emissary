import { EmissaryConfig } from "./config.ts";
import {
    FactionReputation,
    IndividualReputation,
    NotorietyReputation,
} from "./module/menus/reputationTracker/tabs/types.ts";
import {
    hiddenElements,
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
        "emissary.factionHiddenElements": typeof hiddenElements;
        "emissary.interpersonalReputation": typeof IndividualReputation;
        "emissary.interpersonalReputationRange": typeof reputationRange;
        "emissary.interpersonalReputationIncrement": typeof reputationIncrements;
        "emissary.interpersonalReputationControls": typeof reputationControls;
        "emissary.interpersonalHiddenElements": typeof hiddenElements;
        "emissary.notorietyReputation": typeof NotorietyReputation;
        "emissary.notorietyReputationRange": typeof reputationRange;
        "emissary.notorietyReputationIncrement": typeof reputationIncrements;
        "emissary.notorietyReputationControls": typeof reputationControls;
        "emissary.notorietyHiddenElements": typeof hiddenElements;
        "emissary.reputationSettingsTemplates": typeof reputationSettingsTemplates;
    }
}

declare global {
    interface AssumeHookRan {
        ready: true;
    }
}
