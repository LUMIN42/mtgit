print("Starting batched normalized_name migration...");

const batchSize = 1000;
let ops = [];

// ----------------------------
// HARD FILTER (robust)
// ----------------------------
function isBadCard(card) {
    const layout = (card.layout || "").toLowerCase();
    const setType = (card.set_type || "").toLowerCase();

    return (
        layout === "art_series" ||
        setType === "memorabilia" ||
        layout === "token"
    );
}

// ----------------------------
// NORMALIZER
// ----------------------------
function computeNormalized(card) {
    const rawName = (card.name || "").toLowerCase().trim();

    let normalized = [];

    // ----------------------------
    // 1. Front face (canonical)
    // ----------------------------
    let frontFace = rawName;

    if (card.card_faces && card.card_faces.length > 0) {
        frontFace = (card.card_faces[0].name || "").toLowerCase().trim();
    } else if (rawName.includes(" // ")) {
        frontFace = rawName.split(" // ")[0].trim();
    }

    normalized.push(frontFace);

    // ----------------------------
    // 2. Split cards
    // ----------------------------
    if (rawName.includes(" // ")) {
        const splitParts = rawName
            .split(" // ")
            .map(p => p.toLowerCase().trim())
            .filter(Boolean);

        if (splitParts.length > 0) {
            normalized.push(splitParts[0]);
        }

        if (splitParts.length === 2) {
            const [a, b] = splitParts;

            normalized.push(`${a} // ${b}`);
            normalized.push(`${a} / ${b}`);
        }
    }

    // ----------------------------
    // 3. MDFC faces
    // ----------------------------
    if (card.card_faces && card.card_faces.length > 0) {
        const faces = card.card_faces
            .map(f => (f.name || "").toLowerCase().trim())
            .filter(Boolean);

        normalized.push(faces[0]);

        if (faces.length === 2) {
            const [a, b] = faces;

            normalized.push(`${a} // ${b}`);
            normalized.push(`${a} / ${b}`);
        }
    }

    // ----------------------------
    // 4. Deduplicate
    // ----------------------------
    return [...new Set(normalized)];
}

// ----------------------------
// MAIN LOOP
// ----------------------------
const cursor = db.scryfall_cards.find(
    {},
    {name: 1, card_faces: 1, layout: 1, set_type: 1}
);

cursor.forEach(card => {

    let normalized = [];

    // IMPORTANT FIX:
    // bad cards always become []
    if (!isBadCard(card)) {
        normalized = computeNormalized(card);
    }

    ops.push({
        updateOne: {
            filter: {_id: card._id},
            update: {
                $set: {
                    normalized_name: normalized
                }
            }
        }
    });

    if (ops.length >= batchSize) {
        db.scryfall_cards.bulkWrite(ops, {ordered: false});
        print(`✓ processed ${ops.length} updates`);
        ops = [];
    }
});

// flush remaining
if (ops.length > 0) {
    db.scryfall_cards.bulkWrite(ops, {ordered: false});
    print(`✓ processed final ${ops.length} updates`);
}

print("✓ Migration complete (bad cards excluded properly)");