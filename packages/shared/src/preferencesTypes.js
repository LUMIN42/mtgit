"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryPreferencesSchema = void 0;
var zod_1 = require("zod");
// saved separately in case we will later allow multiple people edit the same deck
exports.RepositoryPreferencesSchema = zod_1.z.object({
    defaultQuery: zod_1.z.string().default(""),
    openBranchName: zod_1.z.string().optional(),
    hiddenBranches: zod_1.z.array(zod_1.z.string()).default(function () { return []; }),
    quickEdit: zod_1.z.boolean().default(false)
});
