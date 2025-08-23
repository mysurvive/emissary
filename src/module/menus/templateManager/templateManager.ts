import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import type { ApplicationV2 } from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";
import { ReputationSettingsMenu } from "../settings/reputationSettingsMenu.ts";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";

const { ApplicationV2: AppV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TemplateManagerMenu extends HandlebarsApplicationMixin(AppV2) {
    declare parent;
    constructor(parent: typeof ReputationSettingsMenu) {
        super();
        this.parent = parent;
    }

    static override DEFAULT_OPTIONS = {
        id: "template-manager-menu",
        tag: "div",
        window: {
            title: "Emissary Template Manager",
        },
        position: {
            width: 650,
        },
        actions: {
            applyTemplate: this.#applyTemplate,
            importTemplate: this.#importTemplate,
        },
    };

    static override PARTS = {
        div: {
            template: "modules/emissary/templates/menu/template-manager/template-manager.hbs",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<ApplicationV2.RenderContext> {
        const context = await super._prepareContext(options);
        const mergedContext = foundry.utils.mergeObject(context, {
            templatesOption: game.settings.get(MODNAME, "reputationSettingsTemplates"),
        });

        return mergedContext;
    }

    protected override _onClose(options: ApplicationRenderOptions): void {
        this.parent.render({ force: true });
        super._onClose(options);
    }

    static #applyTemplate(this: TemplateManagerMenu): void {
        const template = this.parts["div"].querySelector("select#settings-template-select") as HTMLSelectElement;
        const templateId = template.options[template.options.selectedIndex].id;
        const settingsTemplates = game.settings.get(MODNAME, "reputationSettingsTemplates");
        if (!settingsTemplates || !Array.isArray(settingsTemplates)) return;
        const chosenTemplate = settingsTemplates.find((t) => {
            if (t && t.id === templateId) {
                return t;
            } else return undefined;
        });

        try {
            if (chosenTemplate) {
                this.parent.template = chosenTemplate.settings;
                this.close();
            } else {
                throw "Error with pre-built template.";
            }
        } catch (error) {
            ui.notifications.error(error);
        }
    }

    static async #importTemplate(this: TemplateManagerMenu): Promise<void> {
        const fileInput = this.parts["div"]?.querySelector("#settingsFile") as HTMLInputElement;
        try {
            if (fileInput.files && fileInput.files.length != 0) {
                this.parent.template = JSON.parse(await foundry.utils.readTextFromFile(fileInput.files[0]));
                this.close();
            } else {
                throw "No file selected.";
            }
        } catch (error) {
            ui.notifications.error(error);
        }
    }
}
