import { AddFactionMenu } from "../addEntity/addFaction.ts";
import { _DeepPartial } from "fvtt-types/utils";
import { UUID } from "crypto";
import HandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import { MODNAME } from "src/constants.ts";
import { AddPersonMenu } from "../addEntity/addPerson.ts";
import { AddNotorietyMenu } from "../addEntity/addNotoriety.ts";
import { clamp } from "../helpers.ts";
import { EditEntityMenu } from "../editEntity/editEntity.ts";
import { ReputationTabConstructor } from "./tabs/reputationTabConstructor.ts";

const { AbstractSidebarTab } = foundry.applications.sidebar;

declare namespace ReputationTrackerSidebar {
    interface RenderContext extends ApplicationV2.RenderContext {
        user: User;
        tab?: foundry.applications.api.ApplicationV2.Tab;
        isGM?: boolean;
        reputationData?: ReputationData;
    }
}

class ReputationTrackerSidebar<
    RenderContext extends ReputationTrackerSidebar.RenderContext,
> extends HandlebarsApplicationMixin(AbstractSidebarTab)<
    RenderContext,
    ApplicationV2.Configuration,
    ApplicationV2.RenderOptions
> {
    static override tabName = "emissary";
    static override DEFAULT_OPTIONS = {
        classes: ["emissary", "reputation-tracker"],
        window: { title: "Emissary Reputation Tracker" },
        actions: {
            addEntity: ReputationTrackerSidebar.addEntity,
            openRollout: ReputationTrackerSidebar.openRollout,
            deleteEntity: ReputationTrackerSidebar.deleteEntity,
            updateReputation: ReputationTrackerSidebar.updateReputation,
            hideEntity: ReputationTrackerSidebar.hideEntity,
            editEntity: ReputationTrackerSidebar.editEntity,
        },
    };

    static override PARTS = {
        tabs: { template: "modules/emissary/templates/reputation-tracker/partials/tabs.hbs" },
        interpersonal: {
            template: "modules/emissary/templates/reputation-tracker/interpersonal.hbs",
            id: "interpersonal",
        },
        faction: {
            template: "modules/emissary/templates/reputation-tracker/faction.hbs",
            templates: [
                "modules/emissary/templates/reputation-tracker/faction.hbs",
                "modules/emissary/templates/reputation-tracker/partials/faction-item.hbs",
            ],
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
        footer: { template: "modules/emissary/templates/reputation-tracker/partials/footer.hbs" },
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

    get hiddenElements(): Record<
        string,
        ClientSettings.SettingInitializedType<
            "emissary",
            "factionHiddenElements" | "interpersonalHiddenElements" | "notorietyHiddenElements"
        >
    > {
        return {
            faction: game.settings.get(MODNAME, "factionHiddenElements"),
            interpersonal: game.settings.get(MODNAME, "interpersonalHiddenElements"),
            notoriety: game.settings.get(MODNAME, "notorietyHiddenElements"),
        };
    }

    get activeTab(): string | null | undefined {
        return this.element.querySelector(".tabs .active")?.getAttribute("data-tab");
    }

    protected override _onActivate(): void {
        this.render(true);
    }

    protected override async _preparePartContext(
        partId: ReputationTrackerPartIds,
        context: RenderContext,
    ): Promise<RenderContext> {
        context = foundry.utils.deepClone(context);

        const constructor = new ReputationTabConstructor();
        constructor.setFactionReputationLevels();
        constructor.setInterpersonalReputationLevels();
        constructor.setNotorietyReputationLevels();
        context.tab = context.tabs ? context.tabs[partId] : undefined;
        context.user = game.user;
        context.isGM = game.user.isGM;
        const reputationData: ReputationData = {
            interpersonal: {
                settings: game.settings.get(MODNAME, "interpersonalReputation"),
                controls: game.settings.get(MODNAME, "interpersonalReputationControls"),
            },
            faction: {
                settings: game.settings.get(MODNAME, "factionReputation"),
                controls: game.settings.get(MODNAME, "factionReputationControls"),
            },
            notoriety: {
                settings: game.settings.get(MODNAME, "notorietyReputation"),
                controls: game.settings.get(MODNAME, "notorietyReputationControls"),
            },
        };

        switch (partId) {
            case "tabs":
                return context;
            case "footer":
                return context;
            default:
                if (Array.isArray(reputationData[partId].settings)) {
                    reputationData[partId].settings = Array.from(
                        await Promise.all(
                            reputationData[partId].settings.map(async (e) => {
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
                                if (this.hiddenElements[partId])
                                    e.hiddenElements = Object.keys(this.hiddenElements[partId]).reduce(
                                        (
                                            acc,
                                            key:
                                                | "incrementColor"
                                                | "incrementName"
                                                | "image"
                                                | "journal"
                                                | "currentReputation",
                                        ) => {
                                            if (game.user.isGM) {
                                                acc[key] = false;
                                            } else {
                                                if (this.hiddenElements[partId] && this.hiddenElements[partId][key])
                                                    acc[key] = this.hiddenElements[partId][key];
                                            }
                                            return acc;
                                        },
                                        this.hiddenElements[partId],
                                    );
                                return e;
                            }),
                        ),
                    ).filter((e) => e !== undefined);
                }

                context = foundry.utils.mergeObject(context, {
                    reputationData: {
                        [partId]: reputationData[partId],
                    },
                }) as RenderContext;

                if (!game.user.isGM) {
                    const notorietySettings = game.settings.get(MODNAME, "notorietyReputation");
                    if (Array.isArray(notorietySettings))
                        for (const rep of notorietySettings) {
                            if (rep && rep.playerRep && Array.isArray(rep.playerRep))
                                rep.playerRep = rep.playerRep.find(
                                    (r) => r!.characterUuid === game.user.character?.uuid,
                                );
                        }
                    foundry.utils.mergeObject(context, reputationData);
                }

                return context;
        }
    }

    protected override _preSyncPartState(
        partId: string,
        newElement: HTMLElement,
        priorElement: HTMLElement,
        state: HandlebarsApplicationMixin.PartState,
    ): void {
        const openRollouts = priorElement.querySelectorAll(".rollout.active");
        for (const openRollout of openRollouts) {
            newElement.querySelector(`#${openRollout.id}`)?.classList.add("active", "no-transition");
        }

        super._preSyncPartState(partId, newElement, priorElement, state);
    }

    static async addEntity(this: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>): Promise<void> {
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

    static async deleteEntity(
        this: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>,
        e: PointerEvent,
    ): Promise<void> {
        const target = e.target as HTMLButtonElement;
        const uuid = target.getAttribute("entity-uuid");
        let setting: "factionReputation" | "interpersonalReputation" | "notorietyReputation";
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
                return;
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

        await this.render(true);
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

    static async updateReputation(
        this: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>,
        _e: never,
        t: HTMLButtonElement,
    ): Promise<void> {
        const value = Number(t.getAttribute("data-value"));
        const uuid = t.getAttribute("entity-uuid") as UUID;

        let settings:
            | (Record<"reputations", "factionReputation" | "interpersonalReputation" | "notorietyReputation"> & {
                  range?: ClientSettings.SettingInitializedType<
                      "emissary",
                      "factionReputationRange" | "interpersonalReputationRange"
                  >;
              })
            | undefined;
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
                settings = undefined;
                break;
        }
        if (!settings) return;
        if (this.activeTab === "faction" || this.activeTab === "interpersonal") {
            if (settings.reputations === "notorietyReputation") return;
            const entityReputation = game.settings.get(MODNAME, settings.reputations);
            if (!entityReputation) return;
            const entityReputations: ClientSettings.SettingInitializedType<
                "emissary",
                "factionReputation" | "interpersonalReputation"
            > = Object.values(entityReputation);

            const entityArray = Array.from(entityReputations);

            const entity = entityArray
                .map((f) => {
                    if (f) return f.id;
                    else return undefined;
                })
                .indexOf(uuid);

            if (entityArray[entity] && typeof entityArray[entity].repNumber === "number") {
                entityArray[entity].repNumber += value;

                if (!settings.range) return;
                const repRange: Record<string, number> = settings.range;
                if (repRange)
                    entityArray[entity].repNumber = clamp(
                        entityArray[entity].repNumber,
                        repRange.minimum,
                        repRange.maximum,
                    );

                await game.settings.set(
                    MODNAME,
                    settings.reputations as ClientSettings.KeyFor<"emissary">,
                    entityReputation,
                );

                await this.render({ force: true });
            }
        } else if (this.activeTab === "notoriety") {
            const entityReputation = game.settings.get(
                MODNAME,
                settings.reputations as ClientSettings.KeyFor<"emissary">,
            );
            if (!entityReputation) return;
            const entityReputations = Object.values(entityReputation);

            const entity = entityReputations
                .map((f) => {
                    return f.id;
                })
                .indexOf(uuid);

            const characterUuid = t.getAttribute("character-uuid");
            const characterIndex = entityReputations[entity].playerRep
                .map((f: Record<string, string | number | Record<string, string | Color>>) => f.characterUuid)
                .indexOf(characterUuid);

            const repRange = entityReputations[entity].range;
            if (!repRange) return;
            entityReputations[entity].playerRep[characterIndex].repNumber = clamp(
                entityReputations[entity].playerRep[characterIndex].repNumber + value,
                repRange.minimum,
                repRange.maximum,
            );

            await game.settings.set(
                MODNAME,
                settings.reputations as ClientSettings.KeyFor<"emissary">,
                entityReputation,
            );

            await this.render(true);
        }
    }

    static editEntity(
        this: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>,
        _e: never,
        t: HTMLButtonElement,
    ): void {
        const id = t.getAttribute("entity-uuid");
        if (!id) throw "Error extracting ID";
        new EditEntityMenu(this, id).render({ force: true });
    }

    static async hideEntity(
        this: ReputationTrackerSidebar<ReputationTrackerSidebar.RenderContext>,
        _e: never,
        t: HTMLButtonElement,
    ): Promise<void> {
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
        const entities = game.settings.get(MODNAME, setting as ClientSettings.KeyFor<"emissary">);
        if (!entities || !Array.isArray(entities)) throw "Error";
        entities.map((f) => {
            if (f && f.id === uuid) {
                f.hidden = !f.hidden;
            }
        });
        await game.settings.set(MODNAME, setting as ClientSettings.KeyFor<"emissary">, entities);
        this.render();
    }
}

type ReputationTrackerPartIds = keyof typeof ReputationTrackerSidebar.PARTS;

type ReputationData = Record<
    Exclude<ReputationTrackerPartIds, "tabs" | "footer">,
    Record<
        "settings" | "controls",
        ClientSettings.SettingInitializedType<"emissary", ClientSettings.KeyFor<"emissary">>
    >
>;

export { ReputationTrackerSidebar };
