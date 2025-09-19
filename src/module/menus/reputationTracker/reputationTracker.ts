import { ReputationTabConstructor } from "./tabs/reputationTabConstructor.ts";
import { AddFactionMenu } from "../addEntity/addFaction.ts";
import { DeepPartial } from "fvtt-types/utils";
import { UUID } from "crypto";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import type {
    ApplicationV2 as AV2,
    HandlebarsApplicationMixin as hbs,
} from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";
import { MODNAME } from "src/constants.ts";
import { AddPersonMenu } from "../addEntity/addPerson.ts";
import { AddNotorietyMenu } from "../addEntity/addNotoriety.ts";
import { clamp } from "../helpers.ts";
import { EditEntityMenu } from "../editEntity/editEntity.ts";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class ReputationTracker extends HandlebarsApplicationMixin(ApplicationV2) {
    declare hiddenElements;

    constructor() {
        super();
        this.hiddenElements = {
            faction: game.settings.get(MODNAME, "factionHiddenElements"),
            interpersonal: game.settings.get(MODNAME, "interpersonalHiddenElements"),
            notoriety: game.settings.get(MODNAME, "notorietyHiddenElements"),
        };
    }

    static override DEFAULT_OPTIONS = {
        id: "reputation-tracker",
        classes: ["emissary", "reputation-tracker"],
        tag: "div",
        position: { width: 400, height: 850 },
        window: { title: "emissary.menu.reputationTracker.title" },
        actions: {
            addEntity: ReputationTracker.addEntity,
            openRollout: ReputationTracker.openRollout,
            deleteEntity: ReputationTracker.deleteEntity,
            updateReputation: ReputationTracker.updateReputation,
            hideEntity: ReputationTracker.hideEntity,
            editEntity: ReputationTracker.editEntity,
        },
    };

    get activeTab(): string | null | undefined {
        return this.element.querySelector(".tabs .active")?.getAttribute("data-tab");
    }

    static override PARTS = {
        tabs: { template: "modules/emissary/templates/reputation-tracker/partials/tabs.hbs" },
        interpersonal: {
            template: "modules/emissary/templates/reputation-tracker/interpersonal.hbs",
            id: "interpersonal",
        },
        faction: {
            template: "modules/emissary/templates/reputation-tracker/faction.hbs",
            templates: ["modules/emissary/templates/reputation-tracker/partials/faction-item.hbs"],
            id: "faction",
        },
        notoriety: {
            template: "modules/emissary/templates/reputation-tracker/notoriety.hbs",
            templates: [
                "modules/emissary/templates/reputation-tracker/partials/notoriety-item.hbs",
                "modules/emissary/templates/reputation-tracker/partials/notoriety-item-player.hbs",
            ],
            id: "notoriety",
        },
    };

    static override TABS = {
        primary: {
            tabs: [
                { id: "faction", cssClass: "" },
                { id: "interpersonal", cssClass: "" },
                { id: "notoriety", cssClass: "" },
            ],
            labelPrefix: "emissary.menu.reputationTracker.tab",
            initial: "faction",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<AV2.RenderContext> {
        {
            const context = await super._prepareContext(options);

            const constructor = new ReputationTabConstructor();
            constructor.setFactionReputationLevels();
            constructor.setInterpersonalReputationLevels();
            constructor.setNotorietyReputationLevels();

            const reputationData: Record<
                string,
                Record<
                    string,
                    ClientSettings.SettingInitializedType<"emissary", ClientSettings.KeyFor<"emissary">> | null
                >
            > = {
                faction: {
                    settings: game.settings.get(MODNAME, "factionReputation"),
                    controls: game.settings.get(MODNAME, "factionReputationControls"),
                },
                interpersonal: {
                    settings: game.settings.get(MODNAME, "interpersonalReputation"),
                    controls: game.settings.get(MODNAME, "interpersonalReputationControls"),
                },
                notoriety: {
                    settings: game.settings.get(MODNAME, "notorietyReputation"),
                    controls: game.settings.get(MODNAME, "notorietyReputationControls"),
                },
            };

            if (!game.user.isGM) {
                const notorietySettings = game.settings.get(MODNAME, "notorietyReputation");
                if (Array.isArray(notorietySettings))
                    for (const rep of notorietySettings) {
                        if (rep && rep.playerRep && Array.isArray(rep.playerRep))
                            rep.playerRep = rep.playerRep.find((r) => r!.characterUuid === game.user.character?.uuid);
                    }
                reputationData.notoriety.settings = notorietySettings;
            }

            for (const type in reputationData) {
                if (!reputationData[type].settings) throw "Error";
                if (Array.isArray(reputationData[type].settings))
                    reputationData[type].settings = Array.from(
                        await Promise.all(
                            reputationData[type].settings.map(async (e) => {
                                if (e.hidden && !game.user.isGM) return undefined;
                                if (e && e.journalUuid) {
                                    const factionJournal = (await fromUuid(e.journalUuid)) as JournalEntry;
                                    const iconPage = factionJournal?.pages
                                        ? factionJournal.pages.find((p) => p.name === "emissary-icon")
                                        : undefined;
                                    e.imgsrc = iconPage ? iconPage.src : undefined;
                                    e.enrichedUuid = await foundry.applications.ux.TextEditor.enrichHTML(
                                        `@UUID[${e.journalUuid}]`,
                                    );
                                }
                                e.hiddenElements = Object.keys(this.hiddenElements[type]).reduce((acc, key) => {
                                    if (game.user.isGM) {
                                        acc[key] = false;
                                    } else {
                                        acc[key] = this.hiddenElements[type][key];
                                    }
                                    return acc;
                                }, {});
                                return e;
                            }),
                        ),
                    ).filter((e) => e !== undefined);
            }

            const mergedContext = foundry.utils.mergeObject(context, {
                tabs: this._prepareTabs("primary"),
                reputationData: reputationData,
                isGM: game.user.isGM,
            });

            return mergedContext;
        }
    }

    protected override async _preparePartContext(
        partId: string,
        context: AV2.RenderContextOf<this> & { tab?: AV2.Tab },
    ): Promise<AV2.RenderContextOf<this>> {
        context.tab = context.tabs![partId];

        return context;
    }

    protected override _preSyncPartState(
        partId: string,
        newElement: HTMLElement,
        priorElement: HTMLElement,
        state: hbs.PartState,
    ): void {
        const openRollouts = priorElement.querySelectorAll(".rollout.active");
        for (const openRollout of openRollouts) {
            newElement.querySelector(`#${openRollout.id}`)?.classList.add("active", "no-transition");
        }

        super._preSyncPartState(partId, newElement, priorElement, state);
    }

    static addEntity(this: ReputationTracker): void {
        switch (this.activeTab) {
            case "faction":
                new AddFactionMenu(this).render({ force: true });
                break;
            case "interpersonal":
                new AddPersonMenu(this).render({ force: true });
                break;
            case "notoriety":
                new AddNotorietyMenu(this).render({ force: true });
                break;
            default:
                throw "No active tab";
        }
    }

    static async deleteEntity(this: ReputationTracker, e: PointerEvent): Promise<void> {
        const target = e.target as HTMLButtonElement;
        const uuid = target.getAttribute("entity-uuid");
        let setting;
        switch (this.activeTab) {
            case "faction":
                setting = "factionReputation";
                break;
            case "interpersonal":
                setting = "interpersonalReputation";
                break;
            case "notoriety":
                setting = "notorietyReputation";
                break;
            default:
                break;
        }
        const entityReputation = game.settings.get("emissary", setting);
        if (!entityReputation) return;
        const entityReputations = Object.values(entityReputation);
        for (const entity of entityReputations) {
            if (entity.id === uuid) {
                entityReputations.splice(entityReputations.indexOf(entity), 1);
            }
        }
        await game.settings.set("emissary", setting, entityReputations);

        await this.render({ force: true });
    }

    static openRollout(e: PointerEvent): void {
        if (!game.user) return;
        const target = e.target as HTMLDivElement;
        const rollout = target.getElementsByClassName("rollout") as HTMLCollectionOf<HTMLDivElement>;
        for (const r of rollout) {
            if (r.id === `rollout-${target.id}`) {
                if (r.classList.contains("no-transition")) r.classList.remove("no-transition");
                r.classList.toggle("active");
            }
        }
    }

    static async updateReputation(this: ReputationTracker, _e: never, t: HTMLButtonElement): Promise<void> {
        const value = Number(t.getAttribute("data-value"));
        const uuid = t.getAttribute("entity-uuid") as UUID;

        let settings;
        switch (this.activeTab) {
            case "faction":
                settings = {
                    reputations: "factionReputation",
                    range: game.settings.get(MODNAME, "factionReputationRange"),
                };
                break;
            case "interpersonal":
                settings = {
                    reputations: "interpersonalReputation",
                    range: game.settings.get(MODNAME, "interpersonalReputationRange"),
                };
                break;
            case "notoriety":
                settings = {
                    reputations: "notorietyReputation",
                };
                break;
            default:
                break;
        }
        if (this.activeTab === "faction" || this.activeTab === "interpersonal") {
            const entityReputation = game.settings.get(MODNAME, settings.reputations);
            if (!entityReputation) return;
            const entityReputations = Object.values(entityReputation);

            const entity = entityReputations
                .map((f) => {
                    return f.id;
                })
                .indexOf(uuid);

            entityReputations[entity].repNumber += value;

            const repRange = settings.range;
            if (!repRange) return;
            entityReputation[entity].repNumber = clamp(
                entityReputation[entity].repNumber,
                repRange.minimum,
                repRange.maximum,
            );

            await game.settings.set(MODNAME, settings.reputations, entityReputation);

            await this.render({ force: true });
        } else if (this.activeTab === "notoriety") {
            const entityReputation = game.settings.get(MODNAME, settings.reputations);
            if (!entityReputation) return;
            const entityReputations = Object.values(entityReputation);

            const entity = entityReputations
                .map((f) => {
                    return f.id;
                })
                .indexOf(uuid);

            const characterUuid = t.getAttribute("character-uuid");
            const characterIndex = entityReputations[entity].playerRep
                .map((f) => f.characterUuid)
                .indexOf(characterUuid);

            const repRange = entityReputations[entity].range;
            if (!repRange) return;
            entityReputations[entity].playerRep[characterIndex].repNumber = clamp(
                entityReputations[entity].playerRep[characterIndex].repNumber + value,
                repRange.minimum,
                repRange.maximum,
            );

            await game.settings.set(MODNAME, settings.reputations, entityReputation);

            await this.render({ force: true });
        }
    }

    static editEntity(this: ReputationTracker, _e: never, t: HTMLButtonElement): void {
        const id = t.getAttribute("entity-uuid");
        new EditEntityMenu(this, id).render({ force: true });
    }

    static async hideEntity(this: ReputationTracker, _e: never, t: HTMLButtonElement): Promise<void> {
        const uuid = t.getAttribute("entity-uuid") as UUID;
        let setting;
        switch (this.activeTab) {
            case "faction":
                setting = "factionReputation";
                break;
            case "interpersonal":
                setting = "interpersonalReputation";
                break;
            case "notoriety":
                setting = "notorietyReputation";
                break;
            default:
                break;
        }
        const entities = game.settings.get(MODNAME, setting);
        if (!entities || !Array.isArray(entities)) throw "Error";
        entities.map((f) => {
            if (f && f.id === uuid) {
                f.hidden = !f.hidden;
            }
        });
        await game.settings.set(MODNAME, setting, entities);
        this.render();
    }
}

export { ReputationTracker };
