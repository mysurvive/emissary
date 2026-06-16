import ApplicationV2 = foundry.applications.api.ApplicationV2;
import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import { AddNotorietyMenu } from "../addEntity/addNotoriety.ts";
import { EntityReputation } from "../reputationTracker/tabs/types.ts";

const { ApplicationV2: AppV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class AlternateSettingsMenu extends HandlebarsApplicationMixin(AppV2) {
    declare parentApp;
    declare alternateSettings: EntityReputation & {
        reputationRange: Record<string, number>;
        reputationIncrements: Record<string, string | number | Color>;
        reputationControls: Record<string, number | string>;
        hiddenElements: Record<
            string,
            ClientSettings.SettingInitializedType<
                "emissary",
                "factionHiddenElements" | "interpersonalHiddenElements" | "notorietyHiddenElements"
            >
        >;
    };

    constructor(parentApp: AddNotorietyMenu) {
        super();
        this.parentApp = parentApp;
    }

    static override DEFAULT_OPTIONS = {
        id: "alternate-settings-menu",
        tag: "form",
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: AlternateSettingsMenu.#onSubmit,
        },
        window: {
            title: "emissary.menu.alternateSettings.title",
        },
        position: {
            width: 650,
        },
        actions: { addRow: this.#addRow, removeRow: this.#removeRow },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/menu/partials/alternateSettings.hbs",
            templates: ["modules/emissary/templates/menu/partials/setting.hbs"],
            classes: ["emissary", "reputation-settings"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationV2.RenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);

        const mergedContext = foundry.utils.mergeObject(context, {
            settings: [
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationRange.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationRange.hint",
                    type: "reputationRange",
                    id: "notorietyReputationRange",
                    settingValue:
                        this.alternateSettings?.reputationRange ??
                        game.settings.get(MODNAME, "notorietyReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "notorietyReputationIncrement",
                    settingValue:
                        this.alternateSettings?.reputationIncrements ??
                        game.settings.get(MODNAME, "notorietyReputationIncrement"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "notorietyReputationControls",
                    settingValue:
                        this.alternateSettings?.reputationControls ??
                        game.settings.get(MODNAME, "notorietyReputationControls"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.hiddenElements.name",
                    hint: "emissary.menu.reputationSettings.settings.hiddenElements.hint",
                    type: "checkboxes",
                    id: "notorietyHiddenElements",
                    settingValue:
                        this.alternateSettings?.hiddenElements ?? game.settings.get(MODNAME, "notorietyHiddenElements"),
                },
            ],
            footerButtons: [
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

    static async #onSubmit(
        this: AlternateSettingsMenu,
        _event: Event,
        _form: HTMLFormElement,
        formData: FormDataExtended,
    ): Promise<void> {
        const expandedFormData = foundry.utils.expandObject(formData.object) as Record<
            string,
            Record<string, unknown> | unknown[] | boolean
        >;
        for (const key in expandedFormData) {
            const subKeys = Object.keys(expandedFormData[key]);
            if (!isNaN(parseFloat(subKeys[0]))) {
                expandedFormData[key] = Object.values(expandedFormData[key]);
            }
        }

        this.parentApp.alternateSettings = expandedFormData;
    }

    static async #addRow(this: AlternateSettingsMenu, _event: PointerEvent, target: HTMLElement): Promise<void> {
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

    static #removeRow(this: AlternateSettingsMenu, _event: PointerEvent, target: HTMLElement): void {
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

export { AlternateSettingsMenu };
