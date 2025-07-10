import type { ApplicationTab } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";

export const IndividualReputationTabNav: ApplicationTab = {
    id: "individual-reputation",
    group: "primary",
    icon: "none",
    label: "Individual", // TODO: i18n
    active: true,
    cssClass: "active",
};
