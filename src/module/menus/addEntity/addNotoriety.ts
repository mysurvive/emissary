import { AnyMutableObject, DeepPartial } from "fvtt-types/utils";
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import { AddEntityMenu } from "./addEntity.ts";
import { AlternateSettingsMenu } from "../alternateSettings/alternateSettings.ts";
import { MODNAME } from "src/constants.ts";
import {
    hiddenElements,
    reputationControls,
    reputationIncrements,
    reputationRange,
    TypeReputationSetting,
} from "../types.ts";
import { NotorietyPlayerReputation, NotorietyReputationElement } from "../reputationTracker/tabs/types.ts";
import { ReputationTrackerSidebar } from "../reputationTracker/reputationTrackerSidebar.ts";
import { isArray } from "remeda";

class AddNotorietyMenu extends AddEntityMenu {
    declare alternateSettings: TypeReputationSetting;
    constructor(parentApp: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>) {
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
        const entityInformation = foundry.utils.expandObject(formData.object) as EntityInformation & {
            character: { Actor: CharacterOptions };
        };

        const characterOpts = (
            await Promise.all(
                Object.keys(entityInformation.character.Actor).map(async (c) => {
                    const character = await fromUuid(`Actor.${c}`);
                    if (entityInformation.character.Actor[c].select && character) {
                        return {
                            characterName: character.name,
                            characterId: character.id,
                            characterUuid: `Actor.${c}`,
                            repNumber: entityInformation.character.Actor[c].repNumber,
                            repLevel: undefined,
                        };
                    } else {
                        return undefined;
                    }
                }),
            )
        ).filter((c) => c !== undefined) as unknown as typeof NotorietyPlayerReputation;

        let increments: typeof reputationIncrements;
        if (this.alternateSettings && isArray(this.alternateSettings.notorietyReputationIncrement)) {
            increments = this.#sortSetting(
                this.alternateSettings?.notorietyReputationIncrement as unknown as Record<string, number>[],
            ) as unknown as typeof reputationIncrements;
        } else {
            increments = this.#sortSetting(
                game.settings.get(MODNAME, "notorietyReputationIncrement") as Record<string, number>[],
            ) as unknown as typeof reputationIncrements;
        }

        let controls: typeof reputationControls;
        if (this.alternateSettings && isArray(this.alternateSettings.notorietyReputationControls)) {
            controls = this.#sortSetting(
                this.alternateSettings?.notorietyReputationControls as unknown as Record<string, number>[],
            ) as unknown as typeof reputationControls;
        } else {
            controls = this.#sortSetting(
                game.settings.get(MODNAME, "notorietyReputationControls") as Record<string, number>[],
            ) as unknown as typeof reputationControls;
        }

        let entityHiddenElements:
            | typeof hiddenElements
            | ClientSettings.SettingInitializedType<"emissary", "notorietyHiddenElements">
            | undefined;
        if (this.alternateSettings?.notorietyHiddenElements) {
            entityHiddenElements = this.alternateSettings.notorietyHiddenElements;
        } else {
            entityHiddenElements = game.settings.get(MODNAME, "notorietyHiddenElements");
        }

        entityInformation.hiddenElements = (entityHiddenElements as typeof hiddenElements) ?? {
            incrementColor: false,
            incrementName: false,
            image: false,
            journal: false,
            currentReputation: false,
        };
        entityInformation.increments = increments;
        entityInformation.controls = controls;
        entityInformation.range =
            (this.alternateSettings?.notorietyReputationRange as typeof reputationRange) ??
            game.settings.get(MODNAME, "notorietyReputationRange");

        entityInformation.playerRep = characterOpts;

        if (entityInformation.journalUuid === "") {
            entityInformation.journalUuid = await this.createEntityJournal(
                entityInformation as unknown as AnyMutableObject,
            );
        }

        entityInformation.id = foundry.utils.randomID();

        if (!this.entityReputations) throw "error";

        const entityReputationsArray = game.settings.get(MODNAME, "notorietyReputation");
        if (entityReputationsArray && Array.isArray(entityReputationsArray)) {
            entityReputationsArray.push(entityInformation as unknown as typeof NotorietyReputationElement);
        }

        game.settings.get(MODNAME, "notorietyReputation");
        await game.settings.set(MODNAME, "notorietyReputation", entityReputationsArray);
    }

    #sortSetting(setting: Record<string, number>[]) {
        if (setting && isArray(setting))
            setting.sort((a, b) => {
                if (a && !isNaN(a.minimum)) {
                    return a.minimum - b.minimum;
                } else {
                    return a.amount - b.amount;
                }
            });
        return setting;
    }
}

interface EntityInformation {
    hiddenElements?: typeof hiddenElements;
    increments: typeof reputationIncrements;
    controls: typeof reputationControls;
    range: typeof reputationRange;
    playerRep: typeof NotorietyPlayerReputation;
    journalUuid: string;
    id: string;
}

type CharacterOptions = Record<
    string,
    {
        characterName?: string;
        characterUuid?: string;
        characterId?: string;
        repNumber: number;
        select: boolean;
    }
>;

export { AddNotorietyMenu };
