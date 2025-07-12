import { DeepPartial } from "fvtt-types/utils";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import { MODNAME } from "src/constants.ts";
import { ReputationIncrementSetting } from "../types.ts";
import { ReputationTracker } from "./reputationTracker.ts";
import type { ApplicationV2 as AV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AddFactionMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare parent;
    constructor(parent: typeof ReputationTracker) {
        super();
        this.parent = parent;
    }

    static override DEFAULT_OPTIONS = {
        id: "add-faction-form",
        classes: ["emissary", "add-faction"],
        tag: "form",
        position: { width: 400, height: 170 },
        window: { title: "Add Faction" },
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.#onSubmit },
    };

    static override PARTS = {
        form: {
            id: "add-faction-form",
            template: "modules/emissary/templates/reputation-tracker/add-faction.hbs",
        },
        footer: {
            template: "modules/emissary/templates/reputation-tracker/partials/footer.hbs",
        },
    };

    static async #onSubmit(_event, _form, formData): Promise<void> {
        if (!game.settings) return;
        const factionReputations = game.settings.get("emissary", "factionReputation") as Object[];
        const repSettings: ReputationIncrementSetting[] = game.settings.get(MODNAME, "factionReputationIncrement");

        const factionInformation = formData.object;

        for (const repLevel of repSettings) {
            if (factionInformation.repNumber <= repLevel.maximum && factionInformation.repNumber >= repLevel.minimum) {
                factionInformation.repLevel = repLevel.label;
            } else continue;
        }

        factionInformation.id = crypto.randomUUID();

        factionReputations.push(factionInformation);

        await game.settings.set("emissary", "factionReputation", factionReputations);
    }

    protected override _onClose(options: ApplicationRenderOptions): void {
        Hooks.call("renderMenuChanges", this.parent, { force: true, parts: ["faction-reputation"] });
        super._onClose(options);
    }

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<AV2.RenderContext> {
        const context = await super._prepareContext(options);

        const mergedContext = foundry.utils.mergeObject(context, {
            buttons: { submit: { type: "submit", label: "Submit" } }, // TODO: i18n
        });

        return mergedContext;
    }
}

export { AddFactionMenu };
