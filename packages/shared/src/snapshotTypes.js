"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchSnapshotSchema = void 0;
var zod_1 = require("zod");
var repositoryTypes_js_1 = require("./repositoryTypes.js");
exports.BranchSnapshotSchema = zod_1.z.object({
    timestamp: zod_1.z.coerce.date(),
    cards: repositoryTypes_js_1.DeckCardCountsSchema
});
