import { DeepPartial } from "fvtt-types/utils";
import { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.mts";
import ApplicationV2 from "node_modules/fvtt-types/src/foundry/client/applications/api/application.mts";
import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";
import { AddEntityMenu } from "./addEntity.ts";
import { AlternateSettingsMenu } from "../alternateSettings/alternateSettings.ts";
import { MODNAME } from "src/constants.ts";

class AddNotorietyMenu extends AddEntityMenu {
    declare alternateSettings;
    constructor(parent: ReputationTracker) {
        super(parent);
        this.defaultIcon = "icons/svg/mystery-man.svg";
        this.entityType = "Notoriety";
    }

    static override DEFAULT_OPTIONS = {
        id: "add-entity-form",
        classes: ["emissary", "add-entity"],
        tag: "form",
        position: { width: 400 },
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.#onSubmit },
        window: {
            title: "emissary.menu.addEntity.titles.entity",
            controls: [
                {
                    icon: "fa-solid fa-pen-to-square",
                    label: "emissary.menu.addEntity.labels.editSettings",
                    action: "editSettings",
                },
            ],
        },
        actions: { editSettings: AddNotorietyMenu.editSettings, openPicker: this.openPicker },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/reputation-tracker/add-entity.hbs",
            classes: ["emissary", "add-notoriety"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);
        const playerCharacters = game.users
            .map((u) => {
                const character = u.character;
                if (character) return { characterName: character.name, characterUuid: character.uuid };
                else return undefined;
            })
            .filter((c) => c !== undefined);
        const mergedContext = foundry.utils.mergeObject(context, { inputData: { playerCharacters: playerCharacters } });
        return mergedContext;
    }

    static async editSettings(this: AddNotorietyMenu): Promise<void> {
        await new AlternateSettingsMenu(this).render({ force: true });
    }

    static async #onSubmit(this: AddNotorietyMenu, _event, _form, formData): Promise<void> {
        const entityInformation = formData.object;

        const characterOpts = Object.keys(entityInformation)
            .filter((e) => e.includes("character"))
            .reduce((acc, key) => {
                const [_a, subkey, uuid] = key.split("-");
                acc[uuid] = { ...acc[uuid], [subkey]: entityInformation[key] };
                delete entityInformation[key];
                return acc;
            }, {});

        for (const characterUuid in characterOpts) {
            const character = await fromUuid(characterUuid);
            if (character) {
                characterOpts[characterUuid].characterName = character.name;
                characterOpts[characterUuid].characterId = character.id;
            }
        }

        entityInformation.hiddenElements =
            this.alternateSettings?.notorietyHiddenElements ?? game.settings.get(MODNAME, "notorietyHiddenElements");
        entityInformation.increments =
            this.alternateSettings?.notorietyReputationIncrement ??
            game.settings.get(MODNAME, "notorietyReputationIncrement");
        entityInformation.controls =
            this.alternateSettings?.notorietyReputationControls ??
            game.settings.get(MODNAME, "notorietyReputationControls");
        entityInformation.range =
            this.alternateSettings?.notorietyReputationRange ?? game.settings.get(MODNAME, "notorietyReputationRange");

        entityInformation.playerRep = Object.keys(characterOpts)
            .map((key) => {
                if (characterOpts[key].select) {
                    return {
                        characterName: characterOpts[key].characterName,
                        characterUuid: key,
                        characterId: characterOpts[key].characterId,
                        repNumber: characterOpts[key].repNumber,
                    };
                } else return undefined;
            })
            .filter((i) => i !== undefined);

        if (entityInformation.journalUuid === "") {
            entityInformation.journalUuid = await this.createEntityJournal(entityInformation);
        }

        entityInformation.id = crypto.randomUUID();

        if (!this.entityReputations) throw "error";

        const entityReputationsArray = game.settings.get(MODNAME, "notorietyReputation");
        if (entityReputationsArray && Array.isArray(entityReputationsArray))
            entityReputationsArray.push(entityInformation);

        await game.settings.set(MODNAME, "notorietyReputation", entityReputationsArray);
    }
}

export { AddNotorietyMenu };
