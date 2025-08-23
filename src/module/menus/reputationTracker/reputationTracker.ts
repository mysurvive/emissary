import { ReputationTabConstructor } from "./tabs/reputationTabConstructor.ts";
import { AddFactionMenu } from "./add-faction.ts";
import { DeepPartial } from "fvtt-types/utils";
import { UUID } from "crypto";
import type { ApplicationRenderOptions } from "node_modules/fvtt-types/src/foundry/client/applications/_types.d.mts";
import type {
    ApplicationV2 as AV2,
    HandlebarsApplicationMixin as hbs,
} from "node_modules/fvtt-types/src/foundry/client/applications/api/_module.d.mts";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class ReputationTracker extends HandlebarsApplicationMixin(ApplicationV2) {
    static override DEFAULT_OPTIONS = {
        id: "reputation-tracker",
        classes: ["emissary", "reputation-tracker"],
        tag: "div",
        position: { width: 400, height: 850 },
        window: { title: "Emissary" },
        actions: {
            addFaction: ReputationTracker.addFaction,
            openRollout: ReputationTracker.openRollout,
            deleteFaction: ReputationTracker.deleteFaction,
            updateReputation: ReputationTracker.updateReputation,
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
            id: "faction",
        },
    };

    static override TABS = {
        primary: {
            tabs: [
                { id: "interpersonal", cssClass: "" },
                { id: "faction", cssClass: "" },
            ],
            labelPrefix: "emissary.menu.reputationTracker.tab",
            initial: "interpersonal",
        },
    };

    protected override async _prepareContext(
        options: DeepPartial<ApplicationRenderOptions> & { isFirstRender: boolean },
    ): Promise<AV2.RenderContext> {
        {
            const context = await super._prepareContext(options);

            const constructor = new ReputationTabConstructor();
            constructor.setFactionReputationLevels();
            const reputationData = {
                faction: constructor.reputation.faction,
                interpersonal: constructor.reputation.interpersonal,
            };

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

    static addFaction(): void {
        new AddFactionMenu(this).render({ force: true });
    }

    static async deleteFaction(this: ReputationTracker, e: PointerEvent): Promise<void> {
        if (!game.settings) return;
        const target = e.target as HTMLButtonElement;
        const uuid = target.getAttribute("faction-uuid");
        const factionReputation = game.settings.get("emissary", "factionReputation");
        if (!factionReputation) return;
        const factionReputations = Object.values(factionReputation);
        for (const faction of factionReputations) {
            if (faction.id === uuid) {
                factionReputations.splice(factionReputations.indexOf(faction), 1);
            }
        }
        await game.settings.set("emissary", "factionReputation", factionReputations);

        this.render({ force: true });
    }

    static openRollout(e: PointerEvent): void {
        if (!game.user) return;
        if (game.user.isGM) {
            const target = e.target as HTMLDivElement;
            const rollout = target.getElementsByClassName("rollout") as HTMLCollectionOf<HTMLDivElement>;
            for (const r of rollout) {
                if (r.classList.contains("no-transition")) r.classList.remove("no-transition");
                r.classList.toggle("active");
            }
        }
    }

    static async updateReputation(this: ReputationTracker, _e: never, t: HTMLButtonElement): Promise<void> {
        const value = Number(t.getAttribute("data-value"));
        const uuid = t.getAttribute("faction-uuid") as UUID;

        const factionReputation = game.settings.get("emissary", "factionReputation");
        if (!factionReputation) return;
        const factionReputations = Object.values(factionReputation);

        const faction = factionReputations
            .map((f) => {
                return f.id;
            })
            .indexOf(uuid);

        factionReputations[faction].repNumber += value;

        const repRange = game.settings.get("emissary", "factionReputationRange");
        if (!repRange) return;
        if (repRange.minimum && factionReputations[faction].repNumber < repRange.minimum)
            factionReputation[faction].repNumber = repRange.minimum;
        if (repRange.maximum && factionReputations[faction].repNumber > repRange.maximum)
            factionReputation[faction].repNumber = repRange.maximum;

        await game.settings.set("emissary", "factionReputation", factionReputation);

        this.render({ force: true });
    }
}

export { ReputationTracker };
