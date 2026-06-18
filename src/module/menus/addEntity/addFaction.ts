import { MODNAME } from "src/constants.ts";
import { AddEntityMenu } from "./addEntity.ts";
import { ReputationTrackerSidebar } from "../reputationTracker/reputationTrackerSidebar.ts";

class AddFactionMenu extends AddEntityMenu {
    constructor(parentApp: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>) {
        super(parentApp);
        this.defaultIcon = "icons/svg/shield.svg";
        this.entityType = "Factions";
    }

    static override DEFAULT_OPTIONS = {
        id: "add-faction-form",
        classes: ["emissary", "add-entity"],
        tag: "form",
        window: { title: "emissary.menu.addFaction.title" },
        position: { width: 400 },
        form: { submitOnChange: false, closeOnSubmit: true, handler: this.#onSubmit },
        actions: { openPicker: AddEntityMenu.openPicker },
    };

    static async #onSubmit(
        this: AddEntityMenu,
        _event: Event,
        _form: HTMLFormElement,
        formData: FormDataExtended,
    ): Promise<void> {
        const entityReputations = this.entityReputations;
        const entityIncrements = this.reputationIncrements;
        const entityInformation = formData.object;

        if (!entityIncrements) return;
        if (!entityReputations) return;

        // TODO: make more efficient
        for (const repLevel of Object.values(entityIncrements)) {
            if (
                entityInformation.repNumber &&
                repLevel &&
                entityInformation.repNumber <= repLevel.maximum &&
                entityInformation.repNumber >= repLevel.minimum
            ) {
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
                    default:
                        break;
                }
            } catch (error) {
                if (error instanceof Error) {
                    ui.notifications.error(error.message);
                } else {
                    ui.notifications.error(String(error));
                }
            }
        }
    }

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
