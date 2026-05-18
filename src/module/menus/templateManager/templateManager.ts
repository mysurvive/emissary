import { DeepPartial } from "fvtt-types/utils";
import { MODNAME } from "src/constants.ts";
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;
import HandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;
import { ReputationSettingsMenu } from "../settings/reputationSettingsMenu";

export class TemplateManagerMenu extends HandlebarsApplicationMixin(ApplicationV2) {
    declare parentApp;
    constructor(parentApp: ReputationSettingsMenu) {
        super();
        this.parentApp = parentApp;
    }

    static override DEFAULT_OPTIONS = {
        id: "template-manager-menu",
        tag: "div",
        window: {
            title: "emissary.menu.templateManager.title",
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
            classes: ["emissary", "template-manager"],
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
        this.parentApp.render({ force: true });
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
            if (chosenTemplate && chosenTemplate.settings) {
                this.parentApp.template = chosenTemplate.settings;
                this.close();
            } else {
                throw game.i18n.localize("emissary.menu.templateManager.errors.preBuiltTemplate.generic");
            }
        } catch (error: any) {
            ui.notifications.error(error);
        }
    }

    static async #importTemplate(this: TemplateManagerMenu): Promise<void> {
        const fileInput = this.parts["div"]?.querySelector("#settingsFile") as HTMLInputElement;
        try {
            if (fileInput.files && fileInput.files.length !== 0) {
                this.parentApp.template = JSON.parse(await foundry.utils.readTextFromFile(fileInput.files[0]));
                this.close();
            } else {
                throw game.i18n.localize("emissary.menu.templateManager.errors.importTemplate.noFile");
            }
        } catch (error: any) {
            ui.notifications.error(error);
        }
    }
}
