"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionSchema = exports.UserSchema = exports.DeckOverviewSchema = void 0;
var zod_1 = require("zod");
exports.DeckOverviewSchema = zod_1.z.object({
    name: zod_1.z.string(),
    last_updated: zod_1.z.date(),
    deck_id: zod_1.z.string()
});
// todo move this to backend ?
exports.UserSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    username: zod_1.z.string(),
    password_hash: zod_1.z.string()
});
exports.SessionSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    user_id: zod_1.z.string(),
    validity_ends: zod_1.z.date()
});
