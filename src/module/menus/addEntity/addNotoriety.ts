import { DeepPartial } from "fvtt-types/utils";
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";
import { AddEntityMenu } from "./addEntity.ts";
import { AlternateSettingsMenu } from "../alternateSettings/alternateSettings.ts";
import { MODNAME } from "src/constants.ts";
import { TypeReputationSetting } from "../types.ts";
import { NotorietyReputation } from "../reputationTracker/tabs/types.ts";

class AddNotorietyMenu extends AddEntityMenu {
    declare alternateSettings: TypeReputationSetting;
    constructor(parentApp: ReputationTracker) {
        super(parentApp);
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

    static async #onSubmit(
        this: AddNotorietyMenu,
        _event: Event,
        _form: HTMLFormElement,
        formData: FormDataExtended,
    ): Promise<void> {
        const entityInformation = formData.object;

        const characterOpts = Object.keys(entityInformation)
            .filter((e) => e.includes("character"))
            .reduce(
                (
                    acc: Record<
                        string,
                        Partial<
                            typeof NotorietyReputation & {
                                characterName: string | undefined | null;
                                characterId: string | undefined | null;
                                select: boolean;
                                repNumber: number;
                            }
                        >
                    >,
                    key,
                ) => {
                    const [_a, subkey, uuid] = key.split("-");
                    acc[uuid] = { ...acc[uuid], [subkey]: entityInformation[key] };
                    delete entityInformation[key];
                    return acc;
                },
                {},
            );

        for (const characterUuid in characterOpts) {
            const character = await fromUuid(characterUuid);
            if (character) {
                characterOpts[characterUuid].characterName = character.name;
                characterOpts[characterUuid].characterId = character.id;
            }
        }

        entityInformation.hiddenElements =
            this.alternateSettings?.hiddenElements ?? game.settings.get(MODNAME, "notorietyHiddenElements");
        entityInformation.increments =
            this.alternateSettings?.reputationIncrements ?? game.settings.get(MODNAME, "notorietyReputationIncrement");
        entityInformation.controls =
            this.alternateSettings?.reputationControls ?? game.settings.get(MODNAME, "notorietyReputationControls");
        entityInformation.range =
            this.alternateSettings?.reputationRange ?? game.settings.get(MODNAME, "notorietyReputationRange");

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
