import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";
import { AddEntityMenu } from "./addEntity.ts";

class AddFactionMenu extends AddEntityMenu {
    constructor(parent: typeof ReputationTracker) {
        super(parent);
        this.defaultIcon = "icons/svg/shield.svg";
        this.entityType = "Factions";
    }

    static override DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
        id: "add-faction-form",
        classes: ["emissary", "add-faction"],
        tag: "form",
        window: { title: "emissary.menu.addFaction.title" },
    });

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/reputation-tracker/add-faction.hbs",
            classes: ["emissary", "add-faction"],
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };
}

export { AddFactionMenu };
