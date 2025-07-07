import fields = foundry.data.fields;

interface FactionReputationRangeSchema extends fields.DataSchema {
    minimum: fields.NumberField<{ required: true; initial: -50 }>;
    maximum: fields.NumberField<{ required: true; initial: 50 }>;
}

export class FactionReputationRangeSetting extends foundry.abstract.DataModel<FactionReputationRangeSchema> {
    static override defineSchema(): fields.DataSchema {
        return {
            minimum: new fields.NumberField({
                required: true,
                initial: -50,
            }),
            maximum: new fields.NumberField({
                required: true,
                initial: 50,
            }),
        };
    }
}
