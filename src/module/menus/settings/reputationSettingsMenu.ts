import { DeepPartial, EmptyObject } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class ReputationSettingsMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    static override DEFAULT_OPTIONS = {
        id: "reputation-settings-menu",
        title: "Emissary Reputation Settings",
        tag: "form",
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: ReputationSettingsMenu.#onSubmit,
        },
        position: {
            width: 650,
        },
        actions: {
            openRollout: ReputationSettingsMenu.openRollout,
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
        options: DeepPartial<Application.RenderOptions> & { isFirstRender: boolean },
    ): Promise<EmptyObject> {
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

    static getSettings() {
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

    static openRollout(e) {
        const target = e.target as HTMLDivElement;
        const rollout = target.getElementsByClassName("rollout") as HTMLCollectionOf<HTMLDivElement>;
        for (const r of rollout) {
            r.classList.toggle("active");
        }
    }
}

export { ReputationSettingsMenu };
