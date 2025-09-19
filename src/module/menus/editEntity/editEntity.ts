import { MODNAME } from "src/constants.ts";
import { DeepPartial } from "fvtt-types/utils";
import type { ApplicationV2 as AV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import { UUID } from "crypto";
import { clamp } from "../helpers.ts";
import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";

const { ApplicationV2: AppV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class EditEntityMenu extends HandlebarsApplicationMixin(AppV2) {
    declare entityToEdit;
    declare parent;

    constructor(parent: ReputationTracker, entityId: string) {
        super();

        this.parent = parent;

        const reputations = game.settings.get(MODNAME, "notorietyReputation");
        if (!reputations || !Array.isArray(reputations)) throw "Error finding Notoriety reputations";
        this.entityToEdit = reputations.find((r) => r!.id === entityId);
        if (!this.entityToEdit) throw "Unable to find selected entity in Notoriety reputations";
    }

    static override DEFAULT_OPTIONS = {
        id: "edit-entity-menu",
        tag: "form",
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: EditEntityMenu.#onSubmit,
        },
        window: {
            title: "emissary.menu.editEntity.title",
        },
        position: {
            width: 650,
        },
        actions: {
            resetSettings: this.#resetSettings,
            addRow: this.#addRow,
            removeRow: this.#removeRow,
        },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary//templates/menu/edit-entity.hbs",
            templates: [
                "modules/emissary/templates/menu/partials/setting.hbs",
                "modules/emissary/templates/reputation-tracker/add-entity.hbs",
            ],
            classes: ["emissary", "add-entity", "reputation-settings", "edit-entity"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<AV2.RenderContext> {
        const context = await super._prepareContext(options);
        const playerCharacters = game.users
            .map((u) => {
                const character = u.character;
                console.log(character);
                if (character) {
                    const charData = {
                        characterName: character.name,
                        characterUuid: character.uuid,
                        existing: this.entityToEdit.playerRep.some((c) => c.characterUuid === character.uuid),
                        repNumber:
                            this.entityToEdit.playerRep.find((c) => c.characterUuid === character.uuid)?.repNumber ?? 0,
                    };
                    return charData;
                } else return undefined;
            })
            .filter((c) => c !== undefined);

        const mergedContext = foundry.utils.mergeObject(context, {
            settings: [
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationRange.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationRange.hint",
                    type: "reputationRange",
                    id: "range",
                    settingValue: this.entityToEdit.range,
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "increments",
                    settingValue: this.entityToEdit.increments,
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "controls",
                    settingValue: this.entityToEdit.controls,
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.hiddenElements.name",
                    hint: "emissary.menu.reputationSettings.settings.hiddenElements.hint",
                    type: "checkboxes",
                    id: "hiddenElements",
                    settingValue: this.entityToEdit.hiddenElements,
                },
            ],
            inputData: {
                name: this.entityToEdit.name,
                type: this.entityToEdit.type,
                imgsrc: this.entityToEdit.imgsrc,
                enrichedUuid: this.entityToEdit.enrichedUuid ?? undefined,
                uuid: this.entityToEdit.journalUuid ?? undefined,
                playerCharacters: playerCharacters,
            },
            footerButtons: [{ type: "submit", label: "emissary.menu.generic.buttons.submit" }],
            edit: true,
        });

        return mergedContext;
    }

    static async #onSubmit(this: EditEntityMenu, _event, _form, formData): Promise<void> {
        const entityInformation = formData.object;

        // Normalize the settings
        const settingKeys = Object.keys(formData.object as Record<string, unknown>);
        const normalizedSettings: Record<string, unknown> = settingKeys.reduce((acc, key) => {
            const [settingName, index, subsetting] = key.split("-");
            if (settingName === "character") return acc;
            if (!isNaN(parseFloat(index))) {
                if (!acc[settingName]) acc[settingName] = [];
                acc[settingName][index] = { ...acc[settingName][index], [subsetting]: formData.object[key] };
            } else if (index) {
                acc[settingName] = { ...acc[settingName], [index]: formData.object[key] };
            } else {
                acc[settingName] = formData.object[key];
            }
            return acc;
        }, {});

        // Information about the characters added to the reputation entity
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

        const { minimum, maximum } = normalizedSettings.range as Record<string, number>;

        normalizedSettings.playerRep = Object.keys(characterOpts)
            .map((key) => {
                if (characterOpts[key].select) {
                    return {
                        characterName: characterOpts[key].characterName,
                        characterUuid: key,
                        characterId: characterOpts[key].characterId,
                        repNumber: clamp(characterOpts[key].repNumber, minimum, maximum),
                    };
                } else return undefined;
            })
            .filter((i) => i !== undefined);

        normalizedSettings.id = this.entityToEdit.id as UUID;
        normalizedSettings.hidden = this.entityToEdit.hidden;

        const entityReputationsArray = game.settings.get(MODNAME, "notorietyReputation");
        if (entityReputationsArray && Array.isArray(entityReputationsArray)) {
            const index = entityReputationsArray.indexOf(
                entityReputationsArray.find((r) => r!.id === this.entityToEdit.id),
            );
            if (index === -1) throw "Error finding entity to edit.";
            entityReputationsArray[index] = normalizedSettings;
        }

        await game.settings.set(MODNAME, "notorietyReputation", entityReputationsArray);

        this.parent.render();
    }

    static async #resetSettings(this: EditEntityMenu, _event: PointerEvent, target: HTMLElement): Promise<void> {
        const parentSetting = target.getAttribute("parent-setting") as ClientSettings.KeyFor<"emissary">;
        if (!parentSetting) return;

        const defaultSetting = game.settings.get(MODNAME, parentSetting, { document: true });
        if (game.settings.storage.get("world")!.getSetting(`${MODNAME}.${parentSetting}`))
            await defaultSetting.delete();

        await this.render({ parts: ["form"] });
    }

    static async #addRow(this: EditEntityMenu, _event: PointerEvent, target: HTMLElement): Promise<void> {
        const subsettingTarget = target.closest(".sub-settings");
        if (!subsettingTarget) return;
        const settingsArray = subsettingTarget?.querySelector(".settings-array");
        const lastChild = settingsArray?.lastElementChild;
        if (!lastChild) return;
        const template = lastChild.id.includes("ReputationIncrement")
            ? await renderTemplate("modules/emissary/templates/menu/partials/reputationIncrement.hbs", {
                  key: Number(lastChild.getAttribute("key")) + 1,
                  id: lastChild.id,
                  color: "#000000",
              })
            : await renderTemplate("modules/emissary/templates/menu/partials/reputationControls.hbs", {
                  key: Number(lastChild.getAttribute("key")) + 1,
                  id: lastChild.id,
              });
        settingsArray?.insertAdjacentHTML("beforeend", template);
    }

    static #removeRow(this: EditEntityMenu, _event: PointerEvent, target: HTMLElement): void {
        const element = target.closest(".array-setting");
        if (!element) throw "Error";
        const key = element.getAttribute("key");
        if (!key) throw "Error";
        const settingsArray = element.closest(".settings-array")?.children;
        if (settingsArray)
            for (const el of settingsArray) {
                const htmlIndex = el.getAttribute("key");
                if (htmlIndex && htmlIndex > key) {
                    el.setAttribute("key", String(Number(htmlIndex) - 1));
                }
            }
        element.remove();
    }
}

export { EditEntityMenu };
