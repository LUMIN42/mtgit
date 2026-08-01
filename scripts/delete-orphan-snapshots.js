// mongosh

const snapshots = db.branch_snapshots.find({}).toArray();
const repositories = db.repositories.find({}).toArray();

const repositoryIds = new Set(
    repositories.map(r => r._id.toString())
);

const orphanSnapshots = snapshots.filter(s => {
    return !repositoryIds.has(s.deckId);
});

print(`Found ${orphanSnapshots.length} orphan snapshots`);

orphanSnapshots.forEach(s => {
    db.branch_snapshots.deleteOne({
        _id: s._id
    });
});

print(`Deleted ${orphanSnapshots.length} snapshots`);