import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import { SettingsMenuObject } from "../types.ts";
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import HandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import { isArray } from "remeda";

const { renderTemplate } = foundry.applications.handlebars;

class ReputationSettingsMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super();
    }

    static override DEFAULT_OPTIONS = {
        id: "reputation-settings-menu",
        tag: "form",
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: ReputationSettingsMenu.#onSubmit,
        },
        window: {
            title: "emissary.menu.reputationSettings.title",
        },
        position: {
            width: 650,
        },
        actions: {
            openRollout: this.#openRollout,
            resetSettings: this.#resetSettings,
            addRow: this.#addRow,
            removeRow: this.#removeRow,
            exportSettings: this.#exportSettings,
        },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/menu/reputationSettingsMenu.hbs",
            scrollable: [""],
            classes: ["emissary", "reputation-settings"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);

        const mergedContext = foundry.utils.mergeObject(context, {
            settings: this.getSettings(),
            footerButtons: [
                {
                    type: "button",
                    icon: "fa-solid fa-upload",
                    label: "emissary.menu.reputationSettings.buttons.export",
                    action: "exportSettings",
                },
                { type: "submit", icon: "fa-solid fa-save", label: "emissary.menu.generic.buttons.submit" },
            ],
        });

        return mergedContext;
    }

    protected override _onChangeForm(_formConfig: ApplicationV2.FormConfiguration, event: Event): void {
        const target = event.target as HTMLInputElement;

        // Sort the array if a change is made to the ReputationIncrement.minimum or ReputationControls.amount fields
        if (
            (target.name.includes("minimum") || target.name.includes("amount")) &&
            (target.name.includes("ReputationIncrement") || target.name.includes("ReputationControls"))
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

    protected override _preSyncPartState(
        partId: string,
        newElement: HTMLElement,
        priorElement: HTMLElement,
        state: HandlebarsApplicationMixin.PartState,
    ): void {
        const openRollouts = priorElement.querySelectorAll(".rollout.active");
        for (const openRollout of openRollouts) {
            newElement.querySelector(`#${openRollout.id}`)?.classList.add("active", "no-transition");
        }
        super._preSyncPartState(partId, newElement, priorElement, state);
    }

    #formDataToSettings(formData: Record<string, unknown>) {
        const expandedFormData = foundry.utils.expandObject(formData) as Record<
            string,
            Record<string, number>[] | boolean
        >;
        for (const key in expandedFormData) {
            const subKeys = Object.keys(expandedFormData[key]);
            if (!isNaN(parseFloat(subKeys[0]))) {
                expandedFormData[key] = Object.values(expandedFormData[key]);
                if (key.includes("ReputationIncrement") || key.includes("ReputationControls")) {
                    const sortedSetting = this.#sortSetting(expandedFormData[key] as Record<string, number>[]);
                    expandedFormData[key] = sortedSetting;
                }
            }
        }

        return expandedFormData;
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

    static async #onSubmit(
        this: ReputationSettingsMenu,
        _event: Event,
        _form: HTMLFormElement,
        formData: FormDataExtended,
    ): Promise<void> {
        const obj = this.#formDataToSettings(formData.object);

        for (const setting in obj) {
            const s = setting as ClientSettings.KeyFor<"emissary">;
            await game.settings.set(MODNAME, s, obj[s]);
        }
    }

    getSettings(): SettingsMenuObject {
        return {
            faction: [
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationRange.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationRange.hint",
                    type: "reputationRange",
                    id: "factionReputationRange",
                    settingValue: game.settings.get(MODNAME, "factionReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "factionReputationIncrement",
                    settingValue: this.#sortSetting(
                        game.settings.get(MODNAME, "factionReputationIncrement") as Record<string, number>[],
                    ),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "factionReputationControls",
                    settingValue: this.#sortSetting(
                        game.settings.get(MODNAME, "factionReputationControls") as Record<string, number>[],
                    ),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.hiddenElements.name",
                    hint: "emissary.menu.reputationSettings.settings.hiddenElements.hint",
                    type: "checkboxes",
                    id: "factionHiddenElements",
                    settingValue: game.settings.get(MODNAME, "factionHiddenElements"),
                },
            ],
            interpersonal: [
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationRange.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationRange.hint",
                    type: "reputationRange",
                    id: "interpersonalReputationRange",
                    settingValue: game.settings.get(MODNAME, "interpersonalReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "interpersonalReputationIncrement",
                    settingValue: this.#sortSetting(
                        game.settings.get(MODNAME, "interpersonalReputationIncrement") as Record<string, number>[],
                    ),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "interpersonalReputationControls",
                    settingValue: this.#sortSetting(
                        game.settings.get(MODNAME, "interpersonalReputationControls") as Record<string, number>[],
                    ),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.hiddenElements.name",
                    hint: "emissary.menu.reputationSettings.settings.hiddenElements.hint",
                    type: "checkboxes",
                    id: "interpersonalHiddenElements",
                    settingValue: game.settings.get(MODNAME, "interpersonalHiddenElements"),
                },
            ],
            notoriety: [
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationRange.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationRange.hint",
                    type: "reputationRange",
                    id: "notorietyReputationRange",
                    settingValue: game.settings.get(MODNAME, "notorietyReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "notorietyReputationIncrement",
                    settingValue: this.#sortSetting(
                        game.settings.get(MODNAME, "notorietyReputationIncrement") as Record<string, number>[],
                    ),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "notorietyReputationControls",
                    settingValue: this.#sortSetting(
                        game.settings.get(MODNAME, "notorietyReputationControls") as Record<string, number>[],
                    ),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.hiddenElements.name",
                    hint: "emissary.menu.reputationSettings.settings.hiddenElements.hint",
                    type: "checkboxes",
                    id: "notorietyHiddenElements",
                    settingValue: game.settings.get(MODNAME, "notorietyHiddenElements"),
                },
            ],
        };
    }

    static #openRollout(e: PointerEvent): void {
        const target = e.target as HTMLDivElement;
        const rollout = target.getElementsByClassName("rollout") as HTMLCollectionOf<HTMLDivElement>;
        for (const r of rollout) {
            if (r.classList.contains("no-transition")) r.classList.remove("no-transition");
            r.classList.toggle("active");
        }
    }

    static async #resetSettings(
        this: ReputationSettingsMenu,
        _event: PointerEvent,
        target: HTMLElement,
    ): Promise<void> {
        const parentSetting = target.getAttribute("parent-setting") as ClientSettings.KeyFor<"emissary">;
        if (!parentSetting) return;

        const defaultSetting = game.settings.get(MODNAME, parentSetting, { document: true });
        if (game.settings.storage.get("world")!.getSetting(`${MODNAME}.${parentSetting}`))
            await defaultSetting.delete();

        await this.render({ parts: ["form"] });
    }

    static async #addRow(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): Promise<void> {
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

    static #removeRow(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): void {
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

    static #exportSettings(this: ReputationSettingsMenu): void {
        if (!this.form) return;
        const settings = JSON.stringify(this.#formDataToSettings(Object.fromEntries(new FormData(this.form))));
        foundry.utils.saveDataToFile(settings, "application/json", "settings");
    }
}

export { ReputationSettingsMenu };
