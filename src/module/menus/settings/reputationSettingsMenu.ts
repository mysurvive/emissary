import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import { SettingsMenuObject } from "../types.ts";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import type { ApplicationV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";

const { ApplicationV2: AppV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class ReputationSettingsMenu extends HandlebarsApplicationMixin(AppV2) {
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
        },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/menu/reputationSettingsMenu.hbs",
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

        const settings = ReputationSettingsMenu.getSettings();

        const mergedContext = foundry.utils.mergeObject(context, {
            settings: settings,
            buttons: [{ type: "submit", icon: "fa-solid fa-save", label: "Submit" }], // TODO: i18n
        });
        return mergedContext;
    }

    static async #onSubmit(_event, _form, formData): Promise<void> {
        const obj: any = {};
        obj.factionReputationIncrement = [];
        obj.factionReputationRange = {};
        const keys = Object.keys(formData.object);
        keys.forEach((k) => {
            const key = k.split("-");
            switch (key[0]) {
                case "factionReputationRange":
                    obj.factionReputationRange[key[1]] = formData.object[k];
                    break;
                case "factionReputationIncrement":
                    if (!obj.factionReputationIncrement[key[1]]) obj.factionReputationIncrement.push({});
                    obj.factionReputationIncrement[key[1]][key[2]] = formData.object[k];
            }
        });

        game.settings?.set(MODNAME, "factionReputationRange", obj.factionReputationRange);
        game.settings?.set(MODNAME, "factionReputationIncrement", obj.factionReputationIncrement);
    }

    static getSettings(): SettingsMenuObject {
        const factionReputationRange = game.settings?.get(MODNAME, "factionReputationRange");
        const factionReputationIncrement = game.settings?.get(MODNAME, "factionReputationIncrement");
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
                    type: "reputationIncrement",
                    id: "factionReputationIncrement",
                    settingValue: factionReputationIncrement,
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
            const targetElement = rerenderedApp.element.querySelector(`#${element.id}`);
            targetElement?.classList.add("active");
        }
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
        console.log(lastChild);
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
}

export { ReputationSettingsMenu };
