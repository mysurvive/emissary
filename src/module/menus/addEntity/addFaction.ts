import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";
import { AddEntityMenu } from "./addEntity.ts";

class AddFactionMenu extends AddEntityMenu {
    constructor(parent: ReputationTracker) {
        super(parent);
        this.defaultIcon = "icons/svg/shield.svg";
        this.entityType = "Factions";
    }

    static override DEFAULT_OPTIONS = {
        id: "add-faction-form",
        classes: ["emissary", "add-entity"],
        tag: "form",
        window: { title: "emissary.menu.addFaction.title" },
        position: { width: 400 },
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.onSubmit },
        actions: { openPicker: AddEntityMenu.openPicker },
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
}

export { AddFactionMenu };
