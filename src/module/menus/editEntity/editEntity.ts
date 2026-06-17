import { MODNAME } from "src/constants.ts";
import { DeepPartial } from "fvtt-types/utils";
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import { UUID } from "crypto";
import { clamp } from "../helpers.ts";
import { FactionReputation, IndividualReputation, NotorietyReputation } from "../reputationTracker/tabs/types.ts";
import { ReputationTrackerSidebar } from "../reputationTracker/reputationTrackerSidebar.ts";
import { isArray } from "remeda";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class EditEntityMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare entityToEdit: SingleNotorietyReputation;
    declare parentApp;

    constructor(parentApp: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>, entityId: string) {
        super();

        this.parentApp = parentApp;

        const reputations = game.settings.get(MODNAME, "notorietyReputation");
        if (!reputations || !Array.isArray(reputations))
            throw game.i18n.localize("emissary.menu.editEntity.errors.reputationArray");

        const entity = reputations.find((r) => {
            if (r && r.id === entityId) {
                return r;
            } else {
                return undefined;
            }
        });
        if (entity) this.entityToEdit = entity as SingleNotorietyReputation;
        if (!this.entityToEdit) throw game.i18n.localize("emissary.menu.editEntity.errors.entity");
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
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);
        const playerCharacters = game.users
            .map((u) => {
                const character = u.character;
                if (character && this.entityToEdit) {
                    const charData = {
                        characterName: character.name,
                        characterUuid: character.uuid,
                        existing: this.entityToEdit.playerRep
                            ? this.entityToEdit.playerRep.some(
                                  (c: PlayerReputation) => c.characterUuid === character.uuid,
                              )
                            : undefined,
                        repNumber:
                            this.entityToEdit.playerRep.find(
                                (c: PlayerReputation) => c.characterUuid === character.uuid,
                            )?.repNumber ?? 0,
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

    protected override _onChangeForm(_formConfig: ApplicationV2.FormConfiguration, event: Event): void {
        const target = event.target as HTMLInputElement;

        // Sort the array if a change is made to the increments.minimum or controls.amount fields
        if (
            (target.name.includes("minimum") || target.name.includes("amount")) &&
            (target.name.includes("increments") || target.name.includes("controls"))
        ) {
            const settingArray = target.closest(".settings-array");
            const settingLabel = target.name.split(".").at(-1);
            if (settingArray) {
                const sortedArray = Array.from(settingArray.children).sort((a: Element, b: Element): number => {
                    const elA = a.querySelector(`input[name$=${settingLabel}]`) as HTMLInputElement;
                    const elB = b.querySelector(`input[name$=${settingLabel}]`) as HTMLInputElement;
                    if (elA && elB) {
                        return parseFloat(elA.value) - parseFloat(elB.value);
                    } else {
                        return 0;
                    }
                });
                settingArray.replaceChildren();
                sortedArray.forEach((e) => {
                    settingArray.appendChild(e.cloneNode(true));
                });
            }
        }
    }

    static async #onSubmit(
        this: EditEntityMenu,
        _event: Event,
        _form: HTMLFormElement,
        formData: FormDataExtended,
    ): Promise<void> {
        const entityInformation = formData.object;

        // Normalize the settings
        const normalizedSettings = foundry.utils.expandObject(entityInformation) as NormalizedSettings;
        if (!isArray(normalizedSettings["increments"]))
            normalizedSettings["increments"] = Object.keys(normalizedSettings["increments"])
                .map((key) => {
                    if (!isArray(normalizedSettings["increments"])) {
                        return normalizedSettings["increments"][key];
                    } else return;
                })
                .filter((s) => s !== undefined)
                .sort((a, b) => {
                    return a.minimum - b.minimum;
                });
        normalizedSettings["controls"] = Object.keys(normalizedSettings["controls"])
            .map((key) => {
                if (!isArray(normalizedSettings["controls"])) {
                    return normalizedSettings["controls"][key];
                } else return;
            })
            .filter((s) => s !== undefined)
            .sort((a, b) => {
                return a.amount - b.amount;
            });

        // Information about the characters added to the reputation entity
        const characterOpts = Object.keys(normalizedSettings.character.Actor).reduce(
            (
                acc: Record<
                    string,
                    Partial<
                        (typeof IndividualReputation | typeof NotorietyReputation | typeof FactionReputation) & {
                            characterName: string | undefined | null;
                            characterId: string | undefined | null;
                            select: boolean;
                            repNumber: number;
                        }
                    >
                >,
                settingKey,
            ) => {
                const key = settingKey as string;
                const setting = normalizedSettings.character.Actor[key];
                acc[`Actor.${key}`] = setting;
                delete normalizedSettings.character.Actor[key];
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

        const { minimum, maximum } = normalizedSettings.range as Record<string, number>;

        normalizedSettings.playerRep = Object.keys(characterOpts)
            .map((key) => {
                if (characterOpts[key].select && characterOpts[key].repNumber !== undefined) {
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

        const entityReputationsArray = game.settings.get(MODNAME, "notorietyReputation") as SingleNotorietyReputation[];
        if (entityReputationsArray && Array.isArray(entityReputationsArray)) {
            const entityId = entityReputationsArray.find((r) => r.id === this.entityToEdit.id);
            if (entityId) {
                const index = entityReputationsArray.indexOf(entityId);
                if (index === -1) throw "Error finding entity to edit.";
                entityReputationsArray[index] = normalizedSettings as SingleNotorietyReputation;
            }
        }

        await game.settings.set(
            MODNAME,
            "notorietyReputation",
            entityReputationsArray as ClientSettings.SettingInitializedType<"emissary", "notorietyReputation">,
        );

        this.parentApp.render();
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
        const template = lastChild.id.includes("increment")
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

interface PlayerReputation {
    characterName: string | null | undefined;
    characterUuid: string;
    characterId?: string | null | undefined;
    repNumber: number;
    repLevel?: { label: string; color: Color };
}

type NormalizedSettings = {
    controls:
        | Record<string, { amount: number; icon: string; label: string }>
        | { amount: number; icon: string; label: string }[];
    hidden: boolean;
    id: string;
    increments:
        | Record<string, { color: Color; label: string; minimum: number; maximum: number }>
        | { color: Color; label: string; minimum: number; maximum: number }[];
    journalUuid: string;
    name: string;
    playerRep: PlayerReputation[];
    range: { minimum: number; maximum: number };
    type: string;
    character: {
        Actor: Record<string, { characterId: string; characterName: string; repNumber: number; select: boolean }>;
    };
};

interface SingleNotorietyReputation {
    name: string;
    type: string;
    id: string;
    controls: { label: string; amount: number; icon: string }[];
    increments: { label: string; minimum: number; maximum: number; color: Color }[];
    range: { minimum: number; maximum: number };
    playerRep: PlayerReputation[];
    journalUuid: string;
    hiddenElements?: { hint: string; id: string; settingName: string; settingValue: Record<string, boolean> };
    imgsrc?: string;
    enrichedUuid?: string;
    hidden: boolean;
}

export { EditEntityMenu };
