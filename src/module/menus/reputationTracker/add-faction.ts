import { DeepPartial } from "fvtt-types/utils";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import { MODNAME } from "src/constants.ts";

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
        window: { title: "emissary.menu.addFaction.title" },
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.#onSubmit },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/reputation-tracker/add-faction.hbs",
            classes: ["emissary", "add-faction"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };

    static async #onSubmit(_event, _form, formData): Promise<void> {
        const factionReputations = game.settings.get(MODNAME, "factionReputation");
        const reputationIncrements = game.settings.get(MODNAME, "factionReputationIncrement");
        const factionInformation = formData.object;

        if (!reputationIncrements) return;
        if (!factionReputations) return;

        for (const repLevel of Object.values(reputationIncrements)) {
            if (factionInformation.repNumber <= repLevel.maximum && factionInformation.repNumber >= repLevel.minimum) {
                factionInformation.repLevel = repLevel.label;
            } else continue;
        }

        factionInformation.id = crypto.randomUUID();

        const factionReputationsArray = Object.values(factionReputations);
        factionReputationsArray.push(factionInformation);

        await game.settings.set("emissary", "factionReputation", factionReputationsArray);
    }

    protected override _onClose(options: ApplicationRenderOptions): void {
        this.parent.render({ force: true });
        super._onClose(options);
    }

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<AV2.RenderContext> {
        const context = await super._prepareContext(options);

        const mergedContext = foundry.utils.mergeObject(context, {
            footerButtons: [{ type: "submit", label: "emissary.menu.generic.buttons.submit" }],
        });

        return mergedContext;
    }
}

export { AddFactionMenu };
