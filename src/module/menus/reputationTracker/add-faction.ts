import { ApplicationRenderOptions } from "types/types/foundry/client-esm/applications/_types.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AddFactionMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare parent;
    constructor(parent) {
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
        const factionReputations = game.settings.get("emissary", "factionReputation") as Array<Object>;

        const factionInformation = formData.object;

        //TODO: fix
        if (formData.object.repNumber <= -30) factionInformation.repLevel = "Hunted";
        else if (formData.object.repNumber <= -15) factionInformation.repLevel = "Hated";
        else if (formData.object.repNumber <= -5) factionInformation.repLevel = "Disliked";
        else if (formData.object.repNumber <= 4) factionInformation.repLevel = "Ignored";
        else if (formData.object.repNumber <= 14) factionInformation.repLevel = "Liked";
        else if (formData.object.repNumber <= 29) factionInformation.repLevel = "Admired";
        else factionInformation.repLevel = "Revered";

        factionInformation.id = crypto.randomUUID();

        factionReputations.push(factionInformation);

        await game.settings.set("emissary", "factionReputation", factionReputations);
    }

    protected override _onClose(options: ApplicationRenderOptions): void {
        Hooks.call("renderMenuChanges", this.parent, { force: true, parts: ["faction-reputation"] });
        super._onClose(options);
    }

    protected override async _prepareContext(options: ApplicationRenderOptions): Promise<object> {
        const context = await super._prepareContext(options);

        const mergedContext = foundry.utils.mergeObject(context, {
            buttons: { submit: { type: "submit", label: "Submit" } }, //TODO: i18n
        });

        return mergedContext;
    }
}

export { AddFactionMenu };
