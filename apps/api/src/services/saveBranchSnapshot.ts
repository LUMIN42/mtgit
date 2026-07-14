import {DeckCardCounts} from "@mtgit/shared";
import {getCollection} from "../db/mongo.js";
import {DbBranchSnapshot} from "@mtgit/frontend/src/types/dbBranchSnapshot.js";

export async function performCleanup() {
  const snapshotsCollection = getCollection("branch_snapshots");
  await snapshotsCollection.deleteMany({
    "snapshot.timestamp": {
      $lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    isDailySnapshot: false
  });
}

// this assumes that you know you do want to save this (it's not a duplicate)
export async function saveBranchSnapshot(repositoryId: string, branchName: string, branchContent: DeckCardCounts) {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  const snapshotsCollection = getCollection("branch_snapshots");

  const todaysDailySnapshotFilter: Partial<DbBranchSnapshot> = {
    deckId: repositoryId,
    branchName,
    isDailySnapshot: true,
    day
  };

  await snapshotsCollection.updateOne(
    todaysDailySnapshotFilter,
    {
      $set: {
        isDailySnapshot: false
      }
    }
  );

  const snapshotToAdd: DbBranchSnapshot = {
    branchName,
    day,
    deckId: repositoryId,
    isDailySnapshot: true,
    snapshot: {
      timestamp: now,
      cards: branchContent
    }
  };

  await snapshotsCollection.insertOne(snapshotToAdd);

  await performCleanup();
}