import FormFooterButton = foundry.applications.types.FormFooterButton;
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
    reputationControls?: typeof reputationControls;
    reputationIncrements?: typeof reputationIncrements;
    reputationRange?: typeof reputationRange;
    hiddenElements?: typeof hiddenElements;
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

// Hidden element settings

export const hiddenElements = new fields.SchemaField({
    incrementColor: new fields.BooleanField({ initial: false }),
    incrementName: new fields.BooleanField({ initial: false }),
    image: new fields.BooleanField({ initial: false }),
    journal: new fields.BooleanField({ initial: false }),
    currentReputation: new fields.BooleanField({ initial: false }),
});
