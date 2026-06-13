import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import { reputationSettingsTemplates, SettingsMenuObject } from "../types.ts";
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import HandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import { TemplateManagerMenu } from "../templateManager/templateManager.ts";

const { renderTemplate } = foundry.applications.handlebars;

class ReputationSettingsMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare template: any;
    declare previewSettings;

    constructor(template?: typeof reputationSettingsTemplates) {
        super();
        this.template = template;
        this.previewSettings = this.#initializePreviewSettings();
    }

    #initializePreviewSettings(): any {
        const initializedSettings = {
            changeSettings: {
                faction: {
                    factionReputationRange: game.settings.get(MODNAME, "factionReputationRange"),
                    hiddenElements: game.settings.get(MODNAME, "factionHiddenElements"),
                    factionReputationIncrement: game.settings.get(MODNAME, "factionReputationIncrement"),
                    factionReputationControls: game.settings.get(MODNAME, "factionReputationControls"),
                },
                interpersonal: {
                    interpersonalReputationRange: game.settings.get(MODNAME, "interpersonalReputationRange"),
                    hiddenElements: game.settings.get(MODNAME, "interpersonalHiddenElements"),
                    interpersonalReputationIncrement: game.settings.get(MODNAME, "interpersonalReputationIncrement"),
                    interpersonalReputationControls: game.settings.get(MODNAME, "interpersonalReputationControls"),
                },
            },
            data: { faction: [], interpersonal: [] },
        };
        return initializedSettings;
    }

    #resetSpecificPreview(category: string, setting: ClientSettings.KeyFor<"emissary">): void {
        this.previewSettings.changeSettings[category][setting] = game.settings.get(MODNAME, setting);
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
            nextPreview: this.#nextPreview,
            exportSettings: this.#exportSettings,
            openTemplateManager: this.#openTemplateManager,
        },
    };

    static override PARTS = {
        settingsTemplates: {
            template: "modules/emissary/templates/menu/partials/settings-templates.hbs",
            classes: ["emissary"],
        },
        form: {
            template: "modules/emissary/templates/menu/reputationSettingsMenu.hbs",
            classes: ["emissary", "reputation-settings"],
        },
        preview: {
            template: "modules/emissary/templates/menu/partials/settings-preview.hbs",
            classes: ["emissary", "reputation-tracker", "reputation-settings", "preview"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);
        this.previewSettings.data = { faction: [], interpersonal: [] };

        const factionIncrement = this.previewSettings.changeSettings.faction.factionReputationIncrement;
        const factionRange = this.previewSettings.changeSettings.faction.factionReputationRange;
        if (Array.isArray(factionIncrement))
            for (const increment of factionIncrement) {
                if (!increment) continue;
                const index = factionIncrement.indexOf(increment);
                this.previewSettings.data.faction.push({
                    color: increment.color,
                    label: increment.label,
                    index: index,
                    controls: this.previewSettings.changeSettings.faction.factionReputationControls,
                    name: `Test` + index,
                    repNumber: Math.floor(
                        Math.random() *
                            (Math.min(Number(factionRange.maximum), Number(increment.maximum)) -
                                Math.max(Number(factionRange.minimum), Number(increment.minimum))) +
                            Math.max(Number(increment.minimum), Number(factionRange.minimum)),
                    ),
                    hiddenPreview: "true",
                    imgsrc: "icons/svg/shield.svg",
                    hiddenElements: this.previewSettings.changeSettings.faction.hiddenElements,
                    enrichedUuid: await foundry.applications.ux.TextEditor.enrichHTML(`@UUID["placeholder"]`),
                });
            }
        const interpersonalIncrement =
            this.previewSettings.changeSettings.interpersonal.interpersonalReputationIncrement;
        const interpersonalRange = this.previewSettings.changeSettings.interpersonal.interpersonalReputationRange;
        if (Array.isArray(interpersonalIncrement))
            for (const increment of interpersonalIncrement) {
                if (!increment) continue;
                const index = interpersonalIncrement.indexOf(increment);
                this.previewSettings.data.interpersonal.push({
                    color: increment.color,
                    label: increment.label,
                    index: index,
                    controls: this.previewSettings.changeSettings.interpersonal.interpersonalReputationControls,
                    name: `Test` + index,
                    repNumber: Math.floor(
                        Math.random() *
                            (Math.min(Number(interpersonalRange.maximum), Number(increment.maximum)) -
                                Math.max(Number(interpersonalRange.minimum), Number(increment.minimum))) +
                            Math.max(Number(increment.minimum), Number(interpersonalRange.minimum)),
                    ),
                    hiddenPreview: "true",
                    imgsrc: "icons/svg/mystery-man.svg",
                    hiddenElements: this.previewSettings.changeSettings.interpersonal.hiddenElements,
                    enrichedUuid: await foundry.applications.ux.TextEditor.enrichHTML(`@UUID["placeholder"]`),
                });
            }

        this.previewSettings.data.faction[0].hiddenPreview = false;
        this.previewSettings.data.interpersonal[0].hiddenPreview = false;

        const mergedContext = foundry.utils.mergeObject(context, {
            settings: this.getSettings(),
            preview: this.previewSettings,
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
        const [settingName, index, subSetting] = target.name.split("-");

        function isArray(x: string) {
            return !isNaN(parseFloat(x));
        }

        const type = settingName.includes("faction") ? "faction" : "interpersonal";

        if (settingName.includes("Hidden")) {
            this.previewSettings.changeSettings[type].hiddenElements[index] = target.checked;
        } else if (isArray(index)) {
            this.previewSettings.changeSettings[type][settingName][Number(index)][subSetting] = target.value;
        } else {
            this.previewSettings.changeSettings[type][settingName][index] = target.value;
        }

        this.render({ parts: ["preview"] });
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
            Record<string, unknown> | unknown[] | boolean
        >;
        for (const key in expandedFormData) {
            const subKeys = Object.keys(expandedFormData[key]);
            if (!isNaN(parseFloat(subKeys[0]))) {
                expandedFormData[key] = Object.values(expandedFormData[key]);
            }
        }

        return expandedFormData;
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
                    settingValue:
                        this.template?.factionReputationRange ?? game.settings.get(MODNAME, "factionReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "factionReputationIncrement",
                    settingValue:
                        this.template?.factionReputationIncrement ??
                        game.settings.get(MODNAME, "factionReputationIncrement"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "factionReputationControls",
                    settingValue:
                        this.template?.factionReputationControls ??
                        game.settings.get(MODNAME, "factionReputationControls"),
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
                    settingValue:
                        this.template?.interpersonalReputationRange ??
                        game.settings.get(MODNAME, "interpersonalReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "interpersonalReputationIncrement",
                    settingValue:
                        this.template?.interpersonalReputationIncrement ??
                        game.settings.get(MODNAME, "interpersonalReputationIncrement"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "interpersonalReputationControls",
                    settingValue:
                        this.template?.interpersonalReputationControls ??
                        game.settings.get(MODNAME, "interpersonalReputationControls"),
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
                    settingValue:
                        this.template?.notorietyReputationRange ??
                        game.settings.get(MODNAME, "notorietyReputationRange"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationIncrement.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationIncrement.hint",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "notorietyReputationIncrement",
                    settingValue:
                        this.template?.notorietyReputationIncrement ??
                        game.settings.get(MODNAME, "notorietyReputationIncrement"),
                },
                {
                    settingName: "emissary.menu.reputationSettings.settings.reputationControls.name",
                    hint: "emissary.menu.reputationSettings.settings.reputationControls.hint",
                    type: "settingsArray",
                    subtype: "control",
                    id: "notorietyReputationControls",
                    settingValue:
                        this.template?.notorietyReputationControls ??
                        game.settings.get(MODNAME, "notorietyReputationControls"),
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

        const category = parentSetting.includes("faction") ? "faction" : "interpersonal";
        this.#resetSpecificPreview(category, parentSetting);

        await this.render({ parts: ["form"] });

        // The form isn't ready during _prepareContext, so the preview part has to be rendered after the form part is rendered
        await this.render({ parts: ["preview"] });
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
        const category = lastChild.id.includes("faction")
            ? "faction"
            : lastChild.id.includes("interpersonal")
              ? "interpersonal"
              : "notoriety";
        if (category !== "notoriety") this.previewSettings.changeSettings[category][lastChild.id].push({});
        this.render({ parts: ["preview"] });
    }

    static #removeRow(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): void {
        const element = target.closest(".array-setting");
        if (!element) throw "Error";
        const key = element.getAttribute("key");
        if (!key) throw "Error";
        const category = element.id.includes("faction")
            ? "faction"
            : element.id.includes("interpersonal")
              ? "interpersonal"
              : "notoriety";
        if (category !== "notoriety") this.previewSettings.changeSettings[category][element.id].splice([key], 1);
        const settingsArray = element.closest(".settings-array")?.children;
        if (settingsArray)
            for (const el of settingsArray) {
                const htmlIndex = el.getAttribute("key");
                if (htmlIndex && htmlIndex > key) {
                    el.setAttribute("key", String(Number(htmlIndex) - 1));
                }
            }
        element.remove();
        this.render({ parts: ["preview"] });
    }

    static #nextPreview(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): void {
        const currentIndex = Number(target?.getAttribute("index"));
        const divType = target?.getAttribute("preview-type");
        if (!divType) throw "Error";
        const nextIndex = currentIndex + 1 >= this.previewSettings.data[divType].length ? 0 : currentIndex + 1;
        const currentDiv = document.getElementById(`${divType}-item-${currentIndex}`);
        const nextDiv = document.getElementById(`${divType}-item-${nextIndex}`);
        if (!currentDiv || !nextDiv) return;
        currentDiv.classList.toggle("hidden");
        nextDiv.classList.toggle("hidden");
        this.previewSettings.data[divType][currentIndex].hiddenPreview = "true";
        this.previewSettings.data[divType][nextIndex].hiddenPreview = "false";
    }

    static #openTemplateManager(this: ReputationSettingsMenu): void {
        new TemplateManagerMenu(this).render(true);
    }

    static #exportSettings(this: ReputationSettingsMenu): void {
        if (!this.form) return;
        const settings = JSON.stringify(this.#formDataToSettings(Object.fromEntries(new FormData(this.form))));
        foundry.utils.saveDataToFile(settings, "application/json", "settings");
    }
}

export { ReputationSettingsMenu };
