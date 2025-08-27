import type { FormFooterButton } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import defaultSettingsJSON from "static/settingPresets/default/defaultSettingsTemplate.json" with { type: "json" };
import pf2eSettingsJSON from "static/settingPresets/pf2e/pf2eSettingsTemplate.json" with { type: "json" };

import fields = foundry.data.fields;

export type FooterButtons = Record<string, FormFooterButton>;

export type SettingsMenuObject = Record<string, SettingCategory>;

type SettingCategory = SettingsMenuSettingData[];

interface SettingsMenuSettingData {
    settingName: string;
    hint: string;
    type: string;
    subtype?: string;
    id: ClientSettings.KeyFor<"emissary">;
    settingValue: ClientSettings.SettingInitializedType<"emissary", ClientSettings.KeyFor<"emissary">>;
    hidden?: boolean;
}

export interface EmissarySettings {
    factionReputationControls: typeof reputationControls;
    factionReputationIncrement: typeof reputationIncrements;
    factionReputationRange: typeof reputationRange;
    interpersonalReputationControls: typeof reputationControls;
    interpersonalReputationIncrement: typeof reputationIncrements;
    interpersonalReputationRange: typeof reputationRange;
    hiddenElements: typeof factionHiddenElements;
}

/**
 * REPUTATION SETTINGS
 */

// Reputation Controls

const defineReputationControlsSchema = () => {
    return {
        label: new fields.StringField({ required: true }),
        amount: new fields.NumberField({ required: true }),
        icon: new fields.StringField({ required: true }),
    };
};

export const reputationControls = new fields.ArrayField(new fields.SchemaField(defineReputationControlsSchema()));

// Reputation Ranges

const defineReputationRangeSchema = () => {
    return {
        minimum: new fields.NumberField(),
        maximum: new fields.NumberField(),
    };
};

export const reputationRange = new fields.SchemaField(defineReputationRangeSchema());

// Reputation Increments

const defineReputationIncrementsSchema = () => {
    return {
        label: new fields.StringField({ required: true }),
        minimum: new fields.NumberField({ required: true }),
        maximum: new fields.NumberField({ required: true }),
        color: new fields.ColorField({ required: true }),
    };
};

export const reputationIncrements = new fields.ArrayField(new fields.SchemaField(defineReputationIncrementsSchema()));

// Settings DataModel

const defineSettingsSchema = () => {
    return {
        factionReputationRange: new fields.SchemaField(defineReputationRangeSchema()),
        factionReputationIncrements: new fields.ArrayField(new fields.SchemaField(defineReputationIncrementsSchema())),
        factionReputationControls: new fields.ArrayField(new fields.SchemaField(defineReputationControlsSchema())),
        interpersonalReputationRange: new fields.SchemaField(defineReputationRangeSchema()),
        interpersonalReputationIncrements: new fields.ArrayField(
            new fields.SchemaField(defineReputationIncrementsSchema()),
        ),
        interpersonalReputationControls: new fields.ArrayField(
            new fields.SchemaField(defineReputationControlsSchema()),
        ),
    };
};

// List of settings templates

export const reputationSettingsTemplates = new fields.ArrayField(
    new fields.SchemaField({
        name: new fields.StringField({ required: true }),
        id: new fields.StringField({ required: true }),
        description: new fields.StringField({ required: false }),
        settings: new fields.SchemaField(defineSettingsSchema()),
    }),
    { initial: [JSON.parse(JSON.stringify(defaultSettingsJSON)), JSON.parse(JSON.stringify(pf2eSettingsJSON))] },
);

// Hidden element settings

export const factionHiddenElements = new fields.ArrayField(
    new fields.SchemaField({
        settingName: new fields.StringField({ required: true }),
        hidden: new fields.BooleanField({ initial: false }),
    }),
    {
        initial: [
            { settingName: "incrementColor" },
            { settingName: "incrementName" },
            { settingName: "image" },
            { settingName: "journal" },
            { settingName: "currentReputation" },
        ],
    },
);

export const interpersonalHiddenElements = new fields.ArrayField(
    new fields.SchemaField({
        settingName: new fields.StringField({ required: true }),
        hidden: new fields.BooleanField({ initial: false }),
    }),
    {
        initial: [
            { settingName: "incrementColor" },
            { settingName: "incrementName" },
            { settingName: "image" },
            { settingName: "journal" },
            { settingName: "currentReputation" },
        ],
    },
);
