import {z} from "zod";
import {router} from "../trpc.js";
import {protectedProcedure} from "../trpc.js";
import {parseDeckImportText} from "../services/deckImport.js";
import {getCollection} from "../db/mongo.js";
import {ObjectId} from "mongodb";
import {
  createEmptyRepositoryTemplate,
  mergeCardCounts,
  mergeTagsMaps,
  RepositorySchema
} from "@mtgit/shared";
import {saveBranchSnapshot} from "../services/saveBranchSnapshot.js";
import {TRPCError} from "@trpc/server";

import sampleSnapshots from "../../resources/sampleDeckHistory.json" with {type: "json"};
import {DbBranchSnapshot, DbBranchSnapshotSchema, DbRepository} from "../dbTypes.js";

export const deckImportRouter = router({
  parse: protectedProcedure
    .input(
      z.object({
        deckId: z.string(),
        branchName: z.string(),
        mode: z.enum(["merge", "overwrite"]),
        text: z.string()
      })
    )
    .mutation(async ({input, ctx}) => {
      const {deckId, branchName, mode, text} = input;

      const repoCollection = getCollection("repositories");

      const rawDeck = await repoCollection.findOne({
        _id: new ObjectId(deckId)
      });

      if (!rawDeck) {
        throw new TRPCError({code: "NOT_FOUND", message: "Deck not found."});
      }

      const deck = RepositorySchema.parse(rawDeck);

      if (deck.owner_id !== ctx.user._id) {
        throw new TRPCError({code: "UNAUTHORIZED"});
      }

      const {resultingDeck, oracleTagsMap} = await parseDeckImportText(text);

      const existingBranch = rawDeck.branches?.[branchName];

      let nextBranchContent;

      if (mode === "overwrite" || !existingBranch) {
        nextBranchContent = resultingDeck;
      }
      else {
        // 🔥 USE shared mergeDecks here
        nextBranchContent = {...existingBranch};

        for (const [section, cards] of Object.entries(resultingDeck)) {
          if (!nextBranchContent[section]) {
            nextBranchContent[section] = {};
          }

          nextBranchContent[section] = mergeCardCounts(
            nextBranchContent[section],
            cards
          );
        }
      }

      const newTags = mergeTagsMaps(deck.tags, oracleTagsMap);

      await repoCollection.updateOne(
        {_id: new ObjectId(deckId)},
        {
          $set: {
            [`branches.${branchName}`]: nextBranchContent,
            tags: newTags
          }
        }
      );

      await saveBranchSnapshot(deckId, branchName, nextBranchContent);

      return nextBranchContent;
    }),

  sampleRepository: protectedProcedure.mutation(async ({input, ctx}) => {
    const _id = new ObjectId();

    const repo: DbRepository = {
      ...createEmptyRepositoryTemplate("Sandbox Deck", ctx.user._id, "Legacy"
      ),
      _id
    };

    const snapshots = z.array(DbBranchSnapshotSchema.extend({"_id": z.string()}))
      .parse(sampleSnapshots);
    repo.branches.main = snapshots[0].snapshot.cards;

    repo.branches.experimental = snapshots[10].snapshot.cards;

    const repoCreationPromise = getCollection<DbRepository>("repositories").insertOne(repo);

    const snapshotPromises = snapshots.map(
      async snapshot => {

        const snapshotId = new ObjectId();

        const dbSnapshot: DbBranchSnapshot = {
          ...snapshot,
          deckId: _id.toString(),
          _id: snapshotId,
          isDailySnapshot: true,
          snapshot: {
            ...snapshot.snapshot,
            _id: snapshotId.toString()
          }
        };

        await getCollection<DbBranchSnapshot>("branch_snapshots")
          .insertOne(dbSnapshot);
      }
    );

    await repoCreationPromise;
    await Promise.all(snapshotPromises);

    return _id;
  })
});