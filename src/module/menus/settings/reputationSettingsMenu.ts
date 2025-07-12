import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import { SettingsMenuObject } from "../types.ts";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import type { ApplicationV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";
import { ReputationTabConstructor } from "../reputationTracker/tabs/reputationTabConstructor.ts";

const { ApplicationV2: AppV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class ReputationSettingsMenu extends HandlebarsApplicationMixin(AppV2) {
    previewSettings: any = { settings: { faction: {} }, data: { faction: [] } };
    static override DEFAULT_OPTIONS = {
        id: "reputation-settings-menu",
        tag: "form",
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: ReputationSettingsMenu.#onSubmit,
        },
        window: {
            title: "Emissary Reputation Settings",
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
        },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/menu/reputationSettingsMenu.hbs",
            classes: ["emissary", "reputation-settings"],
        },
        preview: {
            template: "modules/emissary/templates/menu/partials/settings-preview.hbs",
            classes: ["reputation-tracker"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);

        if (options.isFirstRender) {
            const constructor = new ReputationTabConstructor();
            constructor.setFactionReputationLevels();
            this.previewSettings.settings.faction.controls = game.settings.get(MODNAME, "factionReputationControls");
            this.previewSettings.settings.faction.increments = game.settings.get(MODNAME, "factionReputationIncrement");
        } else if (this.form) {
            this.previewSettings.data.faction = [];
            const formData = Object.fromEntries(new FormData(this.form));
            const obj: any = this.#formDataToSettings(formData);
            this.previewSettings.settings.faction.controls = obj.factionReputationControls;
            this.previewSettings.settings.faction.increments = obj.factionReputationIncrement;
        }

        for (const increment of this.previewSettings.settings.faction.increments) {
            const index = this.previewSettings.settings.faction.increments.indexOf(increment);
            this.previewSettings.data.faction.push({
                color: increment.color,
                label: increment.label,
                index: index,
                controls: this.previewSettings.settings.faction.controls,
                name: `Test` + index,
                repNumber: Math.floor(
                    Math.random() * (Number(increment.maximum) - Number(increment.minimum)) + Number(increment.minimum),
                ),
                hidden: "true",
            });
        }

        this.previewSettings.data.faction[0].hidden = false;

        const settings = ReputationSettingsMenu.getSettings();

        const mergedContext = foundry.utils.mergeObject(context, {
            settings: settings,
            preview: this.previewSettings,
            buttons: [{ type: "submit", icon: "fa-solid fa-save", label: "Submit" }], // TODO: i18n
        });

        return mergedContext;
    }

    #formDataToSettings(formData): Object {
        const obj: any = {};
        obj.factionReputationIncrement = [];
        obj.factionReputationControls = [];
        obj.factionReputationRange = {};
        const keys = Object.keys(formData);

        keys.forEach((k) => {
            const key = k.split("-");
            switch (key[0]) {
                case "factionReputationRange":
                    obj.factionReputationRange[key[1]] = formData[k];
                    break;
                case "factionReputationIncrement":
                    if (!obj.factionReputationIncrement[key[1]]) obj.factionReputationIncrement.push({});
                    obj.factionReputationIncrement[key[1]][key[2]] = formData[k];
                    break;
                case "factionReputationControls":
                    if (!obj.factionReputationControls[key[1]]) obj.factionReputationControls.push({});
                    obj.factionReputationControls[key[1]][key[2]] = formData[k];
                    break;
            }
        });
        return obj;
    }

    static async #onSubmit(this: ReputationSettingsMenu, _event, _form, formData): Promise<void> {
        const obj: any = this.#formDataToSettings(formData.object);

        game.settings.set(MODNAME, "factionReputationRange", obj.factionReputationRange);
        game.settings.set(MODNAME, "factionReputationIncrement", obj.factionReputationIncrement);
        game.settings.set(MODNAME, "factionReputationControls", obj.factionReputationControls);
    }

    static getSettings(): SettingsMenuObject {
        const factionReputationRange = game.settings.get(MODNAME, "factionReputationRange");
        const factionReputationIncrement = game.settings.get(MODNAME, "factionReputationIncrement");
        const factionReputationControls = game.settings.get(MODNAME, "factionReputationControls");
        return {
            notoriety: [],
            individual: [],
            faction: [
                {
                    settingName: "Reputation Range",
                    hint: "Sets the maximum and minimum allowed reputation for factions.",
                    type: "reputationRange",
                    id: "factionReputationRange",
                    settingValue: factionReputationRange,
                },
                {
                    settingName: "Reputation Increment",
                    hint: "Sets the increment for each reputation level.",
                    type: "settingsArray",
                    subtype: "increment",
                    id: "factionReputationIncrement",
                    settingValue: factionReputationIncrement,
                },
                {
                    settingName: "Reputation Controls",
                    hint: "Sets the configuration for the reputation gain and loss buttons. Label represents the tooltip for the button. Icons can be found at https://fontawesome.com/. Only enter the classes without the <i> tags.",
                    type: "settingsArray",
                    subtype: "control",
                    id: "factionReputationControls",
                    settingValue: factionReputationControls,
                },
            ],
        };
    }

    static #openRollout(e: PointerEvent): void {
        const target = e.target as HTMLDivElement;
        const rollout = target.getElementsByClassName("rollout") as HTMLCollectionOf<HTMLDivElement>;
        for (const r of rollout) {
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

        const openRollouts = this.element.querySelectorAll(".rollout.active");

        const rerenderedApp = await this.render({ parts: ["form"] });
        for (const element of openRollouts) {
            if (element.id) {
                const targetElement = rerenderedApp.element.querySelector(`#${element.id}`);
                targetElement?.classList.add("active");
            }
        }

        // The form isn't ready during _prepareContext, so the preview part has to be rendered after the form part is rendered
        await this.render({ parts: ["preview"] });
    }

    protected override _onChangeForm(formConfig: ApplicationV2.FormConfiguration, event: Event): void {
        this.render({ parts: ["preview"] });
        super._onChangeForm(formConfig, event);
    }
    /* protected override _preSyncPartState(
        partId: string,
        newElement: HTMLElement,
        priorElement: HTMLElement,
        state: HandlebarsApplicationMixin.PartState,
    ): void {
        super._preSyncPartState(partId, newElement, priorElement, state);
    }*/

    static async #addRow(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): Promise<void> {
        const subsettingTarget = target.closest(".sub-settings");
        if (!subsettingTarget) return;
        const settingsArray = subsettingTarget?.querySelector(".settings-array");
        const lastChild = settingsArray?.lastElementChild;
        if (!lastChild) return;
        settingsArray?.insertAdjacentHTML(
            "beforeend",
            await renderTemplate("modules/emissary/templates/menu/partials/reputationIncrement.hbs", {
                id: subsettingTarget.getAttribute("id"),
                key: Number(lastChild.getAttribute("key")) + 1,
                color: "#FFFFFF",
            }),
        );
    }

    static #removeRow(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): void {
        target.closest(".array-setting")?.remove();
    }

    static #nextPreview(this: ReputationSettingsMenu, _event: PointerEvent, target: HTMLElement): void {
        const currentIndex = Number(target?.getAttribute("index"));
        const nextIndex = currentIndex + 1 >= this.previewSettings.data.faction.length ? 0 : currentIndex + 1;
        const divType = target?.getAttribute("preview-type");
        const currentDiv = document.getElementById(`${divType}-${currentIndex}`);
        const nextDiv = document.getElementById(`${divType}-${nextIndex}`);
        if (!currentDiv || !nextDiv) return;
        currentDiv.classList.toggle("hidden");
        nextDiv.classList.toggle("hidden");
        this.previewSettings.data.faction[currentIndex].hidden = "true";
        this.previewSettings.data.faction[nextIndex].hidden = "false";
    }
}

export { ReputationSettingsMenu };
