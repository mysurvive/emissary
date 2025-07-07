import {
    ApplicationTab,
    FormFooterButton,
} from "node_modules/fvtt-types/src/foundry/client-esm/applications/_types.mts";

type NavTabs = Record<string, ApplicationTab>;
type FooterButtons = Record<string, FormFooterButton>;

export { NavTabs, FooterButtons };
