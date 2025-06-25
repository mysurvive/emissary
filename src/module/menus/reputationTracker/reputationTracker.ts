import { ApplicationRenderOptions } from "types/types/foundry/client-esm/applications/_types.js";
import { ReputationTabs } from "./data.ts";
import { ReputationTabConstructor } from "./tabs/reputationTabConstructor.ts";
import { AddFactionMenu } from "./add-faction.ts";
import { FactionReputation } from "./tabs/types.ts";

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
        "individual-reputation": {
            template: "modules/emissary/templates/reputation-tracker/individual.hbs",
            id: "individual-reputation",
        },
        "faction-reputation": {
            template: "modules/emissary/templates/reputation-tracker/faction.hbs",
            id: "faction-reputation",
        },
    };

    static addFaction() {
        new AddFactionMenu(this).render(true);
    }

    static async deleteFaction(e) {
        const target = e.target as HTMLButtonElement;
        const uuid = target.getAttribute("faction-uuid");
        const factionReputation = game.settings.get("emissary", "factionReputation") as Array<FactionReputation>;
        for (const faction of factionReputation) {
            if (faction.id === uuid) {
                factionReputation.splice(factionReputation.indexOf(faction), 1);
            }
        }
        await game.settings.set("emissary", "factionReputation", factionReputation);

        Hooks.call("renderMenuChanges", this, {
            force: true,
            parts: ["faction-reputation"],
        });
    }

    static openRollout(e) {
        if (game.user.isGM) {
            const target = e.target as HTMLDivElement;
            const rollout = target.getElementsByClassName("rollout") as HTMLCollectionOf<HTMLDivElement>;
            for (const r of rollout) {
                r.classList.toggle("active");
            }
        }
    }

    static async updateReputation(_e, t) {
        const value = Number(t.getAttribute("data-value"));
        const uuid = t.getAttribute("faction-uuid");

        const factionReputation = game.settings.get("emissary", "factionReputation") as Array<FactionReputation>;

        const faction = factionReputation
            .map((f) => {
                return f.id;
            })
            .indexOf(uuid);

        factionReputation[faction].repNumber += value;

        const repRange = game.settings.get("emissary", "reputation-factionRange") as {
            minimum: number;
            maximum: number;
        };
        if (factionReputation[faction].repNumber < repRange.minimum)
            factionReputation[faction].repNumber = repRange.minimum;
        if (factionReputation[faction].repNumber > repRange.maximum)
            factionReputation[faction].repNumber = repRange.maximum;

        await game.settings.set("emissary", "factionReputation", factionReputation);

        Hooks.call("renderMenuChanges", this, {
            force: true,
            parts: ["faction-reputation"],
        });
    }

    protected override async _prepareContext(options: ApplicationRenderOptions): Promise<object> {
        const context = await super._prepareContext(options);

        const constructor = new ReputationTabConstructor();
        constructor.setFactionReputationLevels();
        const reputationData = {
            faction: constructor.reputation.faction,
            individual: constructor.reputation.individual,
        };

        const mergedContext = foundry.utils.mergeObject(context, {
            tabs: ReputationTabs,
            reputationData: reputationData,
            isGM: game.user.isGM,
        });

        return mergedContext;
    }

    protected override _preparePartContext(partId: string, context: any): Promise<any> {
        context.tab = context.tabs[partId];
        return context;
    }
}

export { ReputationTracker };
