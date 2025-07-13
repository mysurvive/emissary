import type {
    ApplicationTab,
    FormFooterButton,
} from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";

export type NavTabs = Record<string, ApplicationTab>;

export type FooterButtons = Record<string, FormFooterButton>;

export type SettingsMenuObject = Record<string, SettingCategory>;

type SettingCategory = SettingsMenuSettingData[];

interface SettingsMenuSettingData {
    settingName: string;
    hint: string;
    type: string;
    subtype?: string;
    id: string;
    settingValue: SettingValues;
}

type SettingValues = ReputationControls[] | ReputationRange | ReputationIncrement[] | undefined;

interface ReputationRange {
    minimum: number;
    maximum: number;
}

export class ReputationRangeSetting implements ReputationRange {
    minimum;
    maximum;
    constructor(args: ReputationRange) {
        this.minimum = args.minimum;
        this.maximum = args.maximum;
    }
}

export interface EmissarySettings {
    factionReputationControls: ReputationControls[];
    factionReputationIncrement: ReputationIncrement[];
    factionReputationRange: ReputationRange;
    interpersonalReputationControls: ReputationControls[];
    interpersonalReputationIncrement: ReputationIncrement[];
    interpersonalReputationRange: ReputationRange;
}

export interface ReputationControls {
    label: string;
    amount: number;
    icon: string;
}

export interface ReputationIncrement {
    label: string;
    minimum: number;
    maximum: number;
    color: string;
}
