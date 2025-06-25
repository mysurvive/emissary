import { EmissaryConfig } from "./config.ts";
import "./styles/emissary.scss";

/**
 * Entrypoint for emissary
 */
(async () => {
    console.log("emissary | initializing");
    EmissaryConfig.initialize();
})();
