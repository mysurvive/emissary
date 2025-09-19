import { MODNAME } from "src/constants.ts";
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
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.#onSubmit },
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

    static async #onSubmit(this: AddEntityMenu, _event, _form, formData): Promise<void> {
        const entityReputations = this.entityReputations;
        const entityIncrements = this.reputationIncrements;
        const entityInformation = formData.object;

        if (!entityIncrements) return;
        if (!entityReputations) return;

        // TODO: make more efficient
        for (const repLevel of Object.values(entityIncrements)) {
            if (entityInformation.repNumber <= repLevel.maximum && entityInformation.repNumber >= repLevel.minimum) {
                entityInformation.repLevel = repLevel.label;
            } else continue;
        }

        if (entityInformation.journalUuid === "") {
            try {
                entityInformation.journalUuid = await this.createEntityJournal(entityInformation);
                entityInformation.id = crypto.randomUUID();

                const entityReputationsArray = Object.values(entityReputations);
                entityReputationsArray.push(entityInformation);

                switch (this.entityType) {
                    case "Factions":
                        await game.settings.set(MODNAME, "factionReputation", entityReputationsArray);
                        break;
                    case "People":
                        await game.settings.set(MODNAME, "interpersonalReputation", entityReputationsArray);
                        break;
                    case "Notoriety":
                        await game.settings.set(MODNAME, "notorietyReputation", entityReputationsArray);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                ui.notifications.error(error);
            }
        }
    }
}

export { AddPersonMenu };
