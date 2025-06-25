import { NavTabs } from "../types.ts";
import * as reputationTabs from "./tabs/index.ts";

export const ReputationTabs: NavTabs = {
    "individual-reputation": reputationTabs.IndividualReputationNav,
    "faction-reputation": reputationTabs.FactionReputationNav,
};
