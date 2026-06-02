import FormFooterButton = foundry.applications.types.FormFooterButton;
import defaultSettingsJSON from "static/settingPresets/default/defaultSettingsTemplate.json" with { type: "json" };
import pf2eSettingsJSON from "static/settingPresets/pf2e/pf2eSettingsTemplate.json" with { type: "json" };
import fields = foundry.data.fields;
import DataField = foundry.data.fields.DataField;

export type FooterButtons = Record<string, FormFooterButton>;

export type SettingsMenuObject = Record<string, SettingCategory>;

type SettingCategory = SettingsMenuSettingData[];

export interface SettingsMenuSettingData {
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
    factionHiddenElements: typeof hiddenElements;
    interpersonalReputationControls: typeof reputationControls;
    interpersonalReputationIncrement: typeof reputationIncrements;
    interpersonalReputationRange: typeof reputationRange;
    interpersonalHiddenElements: typeof hiddenElements;
}

export type EmissarySettingLabel = "reputationControls" | "reputationRange" | "reputationIncrements" | "hiddenElements";

export interface TypeReputationSetting {
    reputationControls: typeof reputationControls | undefined;
    reputationIncrements: typeof reputationIncrements | undefined;
    reputationRange: typeof reputationRange | undefined;
    hiddenElements: typeof hiddenElements | undefined;
}

/**
 * REPUTATION SETTINGS
 */

// Reputation Controls

export const defineReputationControlsSchema = (): Record<string, DataField<Record<string, boolean>>> => {
    return {
        label: new fields.StringField({ required: true }),
        amount: new fields.NumberField({ required: true }),
        icon: new fields.StringField({ required: true }),
    };
};

export const reputationControls = new fields.ArrayField(new fields.SchemaField(defineReputationControlsSchema()));

// Reputation Ranges

export const defineReputationRangeSchema = (): Record<string, DataField<Record<string, boolean>>> => {
    return {
        minimum: new fields.NumberField({ required: true }),
        maximum: new fields.NumberField({ required: true }),
    };
};

export const reputationRange = new fields.SchemaField(defineReputationRangeSchema());

// Reputation Increments

export const defineReputationIncrementsSchema = (): Record<string, DataField<Record<string, boolean>>> => {
    return {
        label: new fields.StringField({ required: true }),
        minimum: new fields.NumberField({ required: true, nullable: false }),
        maximum: new fields.NumberField({ required: true }),
        color: new fields.ColorField({ required: true }),
    };
};

export const reputationIncrements = new fields.ArrayField(
    new fields.SchemaField(defineReputationIncrementsSchema(), { required: true }),
    {
        required: true,
    },
);

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

export const hiddenElements = new fields.SchemaField({
    incrementColor: new fields.BooleanField({ initial: false }),
    incrementName: new fields.BooleanField({ initial: false }),
    image: new fields.BooleanField({ initial: false }),
    journal: new fields.BooleanField({ initial: false }),
    currentReputation: new fields.BooleanField({ initial: false }),
});
