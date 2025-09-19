import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";
import { AddEntityMenu } from "./addEntity.ts";

class AddPersonMenu extends AddEntityMenu {
    constructor(parent: ReputationTracker) {
        super(parent);
        this.defaultIcon = "icons/svg/mystery-man.svg";
        this.entityType = "People";
    }

    static override DEFAULT_OPTIONS = {
        id: "add-person-form",
        classes: ["emissary", "add-entity"],
        tag: "form",
        window: { title: "emissary.menu.addEntity.titles.person" },
        position: { width: 400 },
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.onSubmit },
        actions: { openPicker: this.openPicker },
    };

    static override PARTS = {
        form: {
            template: "modules/emissary/templates/reputation-tracker/add-person.hbs",
        },
        footer: {
            template: "modules/emissary/templates/menu/partials/form-footer.hbs",
        },
    };
}

export { AddPersonMenu };
