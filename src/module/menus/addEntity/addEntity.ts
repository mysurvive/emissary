import { AnyMutableObject, DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import { EntityReputation } from "../reputationTracker/tabs/types.ts";

import ApplicationV2 = foundry.applications.api.ApplicationV2;
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import { ReputationTrackerSidebar } from "../reputationTracker/reputationTrackerSidebar.ts";
const { HandlebarsApplicationMixin } = foundry.applications.api;

class AddEntityMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare parentApp: ReputationTrackerSidebar;
    declare defaultIcon: string;
    declare entityType: string;
    htmlContext: Record<string, string | undefined> = {
        name: undefined,
        uuid: undefined,
        imgsrc: undefined,
        enrichedUuid: undefined,
    };

    #dragDrop;
    #filePicker;

    constructor(parentApp: ReputationTrackerSidebar) {
        super();
        this.parentApp = parentApp;
        this.#dragDrop = new foundry.applications.ux.DragDrop({
            dropSelector: ".dropbox",
            callbacks: { drop: this.handleDrop.bind(this) },
        });
        this.#filePicker = new foundry.applications.apps.FilePicker({
            type: "image",
            callback: this.returnFile.bind(this),
        });
    }

    get dragDrop(): foundry.applications.ux.DragDrop {
        return this.#dragDrop;
    }

    get filePicker(): foundry.applications.apps.FilePicker {
        return this.#filePicker;
    }

    get entityReputations():
        | foundry.helpers.ClientSettings.SettingInitializedType<
              "emissary",
              foundry.helpers.ClientSettings.KeyFor<"emissary">
          >
        | undefined {
        switch (this.entityType) {
            case "Factions":
                return game.settings.get(MODNAME, "factionReputation");
            case "People":
                return game.settings.get(MODNAME, "interpersonalReputation");
            case "Notoriety":
                return game.settings.get(MODNAME, "notorietyReputation");
            default:
                return undefined;
        }
    }

    get reputationIncrements():
        | foundry.helpers.ClientSettings.SettingInitializedType<
              "emissary",
              foundry.helpers.ClientSettings.KeyFor<"emissary">
          >
        | undefined {
        switch (this.entityType) {
            case "Factions":
                return game.settings.get(MODNAME, "factionReputationIncrement");
            case "People":
                return game.settings.get(MODNAME, "interpersonalReputationIncrement");
            case "Notoriety":
                return game.settings.get(MODNAME, "notorietyReputationIncrement");
            default:
                return undefined;
        }
    }

    protected override async _onRender(
        context: DeepPartial<foundry.applications.api.ApplicationV2.RenderContext>,
        options: DeepPartial<ApplicationV2.RenderOptions>,
    ): Promise<void> {
        super._onRender(context, options);
        this.#dragDrop.bind(this.element);
    }

    protected override _onClose(options: ApplicationRenderOptions): void {
        this.parentApp.render(true);
        super._onClose(options);
    }

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);

        this.htmlContext.enrichedUuid = this.htmlContext.uuid
            ? await foundry.applications.ux.TextEditor.enrichHTML(`@UUID[${this.htmlContext.uuid}]`)
            : undefined;

        const mergedContext = foundry.utils.mergeObject(context, {
            inputData: this.htmlContext,
            footerButtons: [{ type: "submit", label: "emissary.menu.generic.buttons.submit" }],
        });

        return mergedContext;
    }

    async createFolderStructure(): Promise<string> {
        const emissaryFolder =
            game.folders.find((f) => f.name === "Emissary" && f.type === "JournalEntry") ??
            (await Folder.create({ name: "Emissary", type: "JournalEntry" }));

        if (!emissaryFolder) throw game.i18n.localize("emissary.menu.addEntity.errors.folder");

        const subFolder =
            emissaryFolder.getSubfolders().find((f) => f.name === this.entityType) ??
            (await Folder.create({
                name: this.entityType,
                type: "JournalEntry",
                folder: emissaryFolder._id,
            }));

        if (!subFolder) throw game.i18n.localize("emissary.menu.addEntity.errors.subfolder");
        return subFolder._id;
    }

    async createEntityJournal(
        entityInformation: (EntityReputation & { imgsrc?: string; journalUuid: string }) | AnyMutableObject,
    ): Promise<string> {
        const entityIcon =
            entityInformation.imgsrc === "" || !entityInformation.imgsrc ? this.defaultIcon : entityInformation.imgsrc;
        delete entityInformation.imgsrc;

        const pages = [
            { name: "About" },
            { name: "Log" },
            { name: "emissary-icon", type: "image", src: entityIcon } as JournalEntryPage.CreateData,
        ];

        const subFolderId = await this.createFolderStructure();
        const data: JournalEntry.CreateData = { name: (entityInformation.name as string) ?? "", folder: subFolderId };

        const journalEntry = await JournalEntry.create(data);
        if (!journalEntry) throw game.i18n.localize("emissary.menu.addEntity.errors.journal");
        await journalEntry.createEmbeddedDocuments("JournalEntryPage", pages);

        return (entityInformation.journalUuid = journalEntry.uuid);
    }

    async handleDrop(event: DragEvent): Promise<void> {
        let _a;
        const dataString = null === (_a = event.dataTransfer) || void 0 === _a ? void 0 : _a.getData("text/plain"),
            dropData = (() => {
                try {
                    if (typeof dataString === "string") return JSON.parse(null !== dataString ? dataString : "");
                    else throw "dataString not of type string";
                } catch (_a) {
                    return _a;
                }
            })();

        const droppedItem = (await fromUuid(dropData.uuid)) as JournalEntry;
        if (!droppedItem) return;

        this.htmlContext = {
            uuid: droppedItem.uuid,
            name: droppedItem.name,
            imgsrc: droppedItem.pages.find((p) => p.name === "emissary-icon")!.src ?? this.defaultIcon,
        };
        this.render({ force: true });
    }

    static openPicker(this: AddEntityMenu): void {
        this.filePicker.render({ force: true });
    }

    returnFile(file: string): void {
        this.htmlContext.imgsrc = file;
        this.render({ force: true });
    }
}

export { AddEntityMenu };
