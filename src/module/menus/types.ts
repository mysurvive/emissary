import type {
    ApplicationTab,
    FormFooterButton,
} from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";

type NavTabs = Record<string, ApplicationTab>;
type FooterButtons = Record<string, FormFooterButton>;

interface FactionReputationIncrement {
    label: string;
    minimum: number;
    maximum: number;
    color: string;
}

type SettingsMenuObject = Record<string, SettingCategory>;

type SettingCategory = SettingsMenuSettingData[];

interface SettingsMenuSettingData {
    settingName: string;
    hint: string;
    type: string;
    id: string;
    settingValue: SettingValues;
}

type SettingValues = FactionReputationRangeSetting | FactionReputationIncrement[] | undefined;

interface FactionReputationRangeSetting {
    minimum: number;
    maximum: number;
}

export { NavTabs, FooterButtons, FactionReputationIncrement, SettingsMenuObject };
