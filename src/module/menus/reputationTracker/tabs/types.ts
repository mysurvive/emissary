import {
    defineReputationControlsSchema,
    defineReputationIncrementsSchema,
    defineReputationRangeSchema,
} from "../../types.ts";
import fields = foundry.data.fields;

export type EntityReputation = typeof FactionReputation | typeof IndividualReputation | typeof NotorietyReputation;

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

export const NotorietyReputation = new fields.ArrayField(
    new fields.SchemaField(
        {
            name: new fields.StringField(),
            type: new fields.StringField(),
            id: new fields.StringField({ required: true }),
            controls: new fields.ArrayField(new fields.SchemaField(defineReputationControlsSchema())),
            increments: new fields.ArrayField(
                new fields.SchemaField(defineReputationIncrementsSchema(), {
                    required: true,
                    nullable: false,
                    undefined: false,
                }),
                {
                    required: true,
                    nullable: false,
                },
            ),
            range: new fields.SchemaField(defineReputationRangeSchema()),
            playerRep: new fields.ArrayField(
                new fields.SchemaField(
                    {
                        characterName: new fields.StringField({ required: true }),
                        characterUuid: new fields.DocumentUUIDField({ required: true }),
                        characterId: new fields.StringField({ required: true }),
                        repNumber: new fields.NumberField({ required: true, nullable: false, undefined: false }),
                        repLevel: new fields.SchemaField(
                            {
                                label: new fields.StringField({ required: false }),
                                color: new fields.ColorField({ required: false }),
                            },
                            { required: false },
                        ),
                    },
                    { required: true },
                ),
                { required: true },
            ),
            journalUuid: new fields.DocumentUUIDField(),
            hidden: new fields.BooleanField({ initial: false }),
        },
        { required: true },
    ),
    { required: true },
);
