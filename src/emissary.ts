import { EmissaryConfig } from "./config.ts";
import { FactionReputation } from "./module/menus/reputationTracker/tabs/types.ts";
import { FactionReputationRangeSetting } from "./settings.ts";
import "./styles/emissary.scss";

/**
 * Entrypoint for emissary
 */
(async () => {
    console.log("emissary | initializing");
    EmissaryConfig.initialize();
})();

declare global {
    interface LenientGlobalVariableTypes {
        game: never;
        canvas: never;
    }

    interface SettingConfig {
        "emissary.factionReputation": typeof Array<FactionReputation>;
        "emissary.factionReputationRange": typeof FactionReputationRangeSetting;
        "emissary.individualReputation": any[];
        "emissary.factionReputationIncrement": any[];
    }

    interface SceneControls {
        "Control.tools": Record<string, SceneControls.Tool>;
    }
}
