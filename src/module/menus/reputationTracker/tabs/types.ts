import fields = foundry.data.fields;

export const FactionReputation = new fields.ArrayField(
    new fields.SchemaField({
        name: new fields.StringField(),
        id: new fields.StringField(),
        repLevel: new fields.SchemaField({ color: new fields.StringField(), label: new fields.StringField() }),
        repNumber: new fields.NumberField(),
        journalUuid: new fields.DocumentUUIDField(),
        hidden: new fields.BooleanField({ initial: false }),
    }),
);

export const IndividualReputation = new fields.ArrayField(
    new fields.SchemaField({
        name: new fields.StringField(),
        id: new fields.StringField(),
        repLevel: new fields.SchemaField({ color: new fields.StringField(), label: new fields.StringField() }),
        repNumber: new fields.NumberField(),
        journalUuid: new fields.DocumentUUIDField(),
        hidden: new fields.BooleanField({ initial: false }),
    }),
);
