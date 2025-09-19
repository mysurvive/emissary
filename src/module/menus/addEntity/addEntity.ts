import { DeepPartial } from "fvtt-types/utils";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import { MODNAME } from "src/constants.ts";

import { ReputationTracker } from "../reputationTracker/reputationTracker.ts";
import type { ApplicationV2 as AV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";
import { EntityReputation } from "../reputationTracker/tabs/types.ts";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AddEntityMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare parent;
    declare defaultIcon;
    declare entityType;
    htmlContext: Record<string, string | undefined> = {
        name: undefined,
        uuid: undefined,
        imgsrc: undefined,
        enrichedUuid: undefined,
    };

    #dragDrop;
    #filePicker;

    constructor(parent: ReputationTracker) {
        super();
        this.parent = parent;
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
        context: DeepPartial<AV2.RenderContext>,
        options: DeepPartial<AV2.RenderOptions>,
    ): Promise<void> {
        super._onRender(context, options);
        this.#dragDrop.bind(this.element);
    }

    protected override _onClose(options: ApplicationRenderOptions): void {
        this.parent.render({ force: true });
        super._onClose(options);
    }

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<AV2.RenderContext> {
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
        entityInformation: EntityReputation & { imgsrc?: string; journalUuid: string },
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
        const data: JournalEntry.CreateData = { name: entityInformation.name ?? "", folder: subFolderId };

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
                    return JSON.parse(null !== dataString ? dataString : "");
                } catch (_a) {
                    return null;
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
