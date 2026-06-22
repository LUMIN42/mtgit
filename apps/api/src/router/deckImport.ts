import {z} from "zod";
import {router} from "../trpc.js";
import {protectedProcedure} from "../trpc.js";
import {parseDeckImportText} from "../services/deckImport.js";
import {getCollection} from "../db/mongo.js";
import {ObjectId} from "mongodb";
import {mergeCardCounts} from "@mtgit/shared";

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

      const deck = await repoCollection.findOne({
        _id: new ObjectId(deckId)
      });

      if (!deck) {
        throw new Error("Deck not found");
      }

      if (deck.owner_id !== ctx.user._id) {
        throw new Error("Unauthorized");
      }

      const parsed = await parseDeckImportText(text);

      const existingBranch = deck.branches?.[branchName];

      let nextBranch;

      if (mode === "overwrite" || !existingBranch) {
        nextBranch = parsed;
      }
      else {
        // 🔥 USE shared mergeDecks here
        nextBranch = {...existingBranch};

        for (const [section, cards] of Object.entries(parsed)) {
          if (!nextBranch[section]) {
            nextBranch[section] = {};
          }

          nextBranch[section] = mergeCardCounts(
            nextBranch[section],
            cards
          );
        }
      }

      await repoCollection.updateOne(
        {_id: new ObjectId(deckId)},
        {
          $set: {
            [`branches.${branchName}`]: nextBranch
          }
        }
      );

      return nextBranch;
    })
});