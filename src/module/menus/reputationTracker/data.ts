import { NavTabs } from "../types.ts";
import * as reputationTabs from "./tabs/index.ts";

export const ReputationTabs: NavTabs = {
    "interpersonal-reputation": reputationTabs.InterpersonalReputationNav,
    "faction-reputation": reputationTabs.FactionReputationNav,
};
