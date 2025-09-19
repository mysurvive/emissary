import type { ApplicationV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";
import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";

const { ApplicationV2: AppV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class AlternateSettingsMenu extends HandlebarsApplicationMixin(AppV2) {
    declare parent;
    declare alternateSettings;

    constructor(parent, alternateSettings?) {
        super();
        this.parent = parent;
        this.alternateSettings = alternateSettings;
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
                        this.alternateSettings?.notorietyReputationRange ??
                        game.settings.get(MODNAME, "notorietyReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "notorietyReputationIncrement",
                    settingValue:
                        this.alternateSettings?.notorietyReputationIncrement ??
                        game.settings.get(MODNAME, "notorietyReputationIncrement"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "notorietyReputationControls",
                    settingValue:
                        this.alternateSettings?.notorietyReputationControls ??
                        game.settings.get(MODNAME, "notorietyReputationControls"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.hiddenElements.name",
                    hint: "emissary.menu.reputationSettings.settings.hiddenElements.hint",
                    type: "checkboxes",
                    id: "notorietyHiddenElements",
                    settingValue:
                        this.alternateSettings?.notorietyHiddenElements ??
                        game.settings.get(MODNAME, "notorietyHiddenElements"),
                },
            ],
            footerButtons: [
                { type: "submit", icon: "fa-solid fa-save", label: "emissary.menu.generic.buttons.submit" },
            ],
        });
        return mergedContext;
    }

    static async #onSubmit(
        this: AlternateSettingsMenu,
        _event,
        _form,
        formData: foundry.applications.ux.FormDataExtended,
    ): Promise<any> {
        const settingKeys = Object.keys(formData.object as Record<string, unknown>);
        const normalizedSettings = settingKeys.reduce((acc, key) => {
            const [settingName, index, subsetting] = key.split("-");
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

        this.parent.alternateSettings = normalizedSettings;
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
