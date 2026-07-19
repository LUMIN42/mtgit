"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositorySchema = exports.BranchesSchema = exports.DeckCardCountsSchema = exports.ObjectIdSchema = exports.CardCountsSchema = exports.OracleIdSchema = exports.TagsMapSchema = exports.OptionalDeckSectionNameSchema = exports.DeckSectionNameSchema = exports.DECK_SECTION_NAMES = exports.OPTIONAL_DECK_SECTION_NAMES = void 0;
exports.emptyDeckCardCounts = emptyDeckCardCounts;
exports.createEmptyRepositoryTemplate = createEmptyRepositoryTemplate;
exports.allDeckOracleIds = allDeckOracleIds;
exports.mergeTagsMaps = mergeTagsMaps;
exports.mergeCardCounts = mergeCardCounts;
exports.withoutIdenticalParts = withoutIdenticalParts;
exports.allRepositoryOracleIds = allRepositoryOracleIds;
var zod_1 = require("zod");
var deckFormats_js_1 = require("./deckFormats.js");
exports.OPTIONAL_DECK_SECTION_NAMES = [
    "Commander",
    "Sideboard",
    "Considering"
];
exports.DECK_SECTION_NAMES = __spreadArray([
    "Main"
], exports.OPTIONAL_DECK_SECTION_NAMES, true);
exports.DeckSectionNameSchema = zod_1.z.enum(exports.DECK_SECTION_NAMES);
exports.OptionalDeckSectionNameSchema = zod_1.z.enum(exports.OPTIONAL_DECK_SECTION_NAMES);
exports.TagsMapSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.array(zod_1.z.string()));
exports.OracleIdSchema = zod_1.z.string();
exports.CardCountsSchema = zod_1.z.record(exports.OracleIdSchema, zod_1.z.number().int().positive());
exports.ObjectIdSchema = zod_1.z.preprocess(function (value) { return String(value); }, zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/));
/**
 * Each deck section must contain optional sections,
 * Main is enforced separately in refinement.
 */
exports.DeckCardCountsSchema = zod_1.z
    .partialRecord(exports.DeckSectionNameSchema, exports.CardCountsSchema);
function emptyDeckCardCounts(format) {
    if (format === undefined) {
        return { Main: {} };
    }
    return Object.fromEntries((0, deckFormats_js_1.relevantSections)(format)
        .map(function (sectionName) { return [sectionName, {}]; }));
}
exports.BranchesSchema = zod_1.z.record(zod_1.z.string(), exports.DeckCardCountsSchema);
exports.RepositorySchema = zod_1.z.object({
    name: zod_1.z.string(),
    _id: exports.ObjectIdSchema,
    owner_id: zod_1.z.string(),
    tags: exports.TagsMapSchema,
    branches: exports.BranchesSchema,
    format: deckFormats_js_1.FormatSchema
    // colorIdentity: ColorIdentitySchema.default(null)
});
function createEmptyRepositoryTemplate(name, owner_id, format) {
    return {
        name: name,
        owner_id: owner_id,
        tags: {},
        branches: {
            main: emptyDeckCardCounts(format)
        },
        format: format
    };
}
function allDeckOracleIds(cardCounts) {
    var result = new Set();
    for (var sectionNameRaw in cardCounts) {
        var sectionName = sectionNameRaw;
        for (var _i = 0, _a = Object.keys(cardCounts[sectionName]); _i < _a.length; _i++) {
            var oracleId = _a[_i];
            result.add(oracleId);
        }
    }
    return __spreadArray([], result.keys(), true);
}
function mergeTagsMaps(currentTags, importedTags) {
    var _a;
    var merged = __assign({}, currentTags);
    for (var _i = 0, _b = Object.entries(importedTags); _i < _b.length; _i++) {
        var _c = _b[_i], cardId = _c[0], tags = _c[1];
        var existingTags = (_a = merged[cardId]) !== null && _a !== void 0 ? _a : [];
        merged[cardId] = Array.from(new Set(__spreadArray(__spreadArray([], existingTags, true), tags, true)));
    }
    return merged;
}
function mergeCardCounts(a, b) {
    var _a;
    var result = __assign({}, a);
    for (var _i = 0, _b = Object.entries(b); _i < _b.length; _i++) {
        var _c = _b[_i], oracleId = _c[0], count = _c[1];
        result[oracleId] = ((_a = result[oracleId]) !== null && _a !== void 0 ? _a : 0) + count;
    }
    return result;
}
function withoutIdenticalParts(deck1, deck2) {
    var _a, _b;
    var result1 = {};
    var result2 = {};
    var sections = new Set(__spreadArray(__spreadArray([], Object.keys(deck1), true), Object.keys(deck2), true));
    for (var _i = 0, sections_1 = sections; _i < sections_1.length; _i++) {
        var section = sections_1[_i];
        var section1 = (_a = deck1[section]) !== null && _a !== void 0 ? _a : {};
        var section2 = (_b = deck2[section]) !== null && _b !== void 0 ? _b : {};
        var ids = new Set(__spreadArray(__spreadArray([], Object.keys(section1), true), Object.keys(section2), true));
        var sectionCardCounts1 = {};
        var sectionCardCounts2 = {};
        for (var _c = 0, ids_1 = ids; _c < ids_1.length; _c++) {
            var id = ids_1[_c];
            var cardCount1 = section1[id];
            var cardCount2 = section2[id];
            if (cardCount1 === undefined && cardCount2 === undefined) {
                continue;
            }
            if (cardCount1 === cardCount2) {
                // identical → drop from both
                continue;
            }
            if (cardCount1 !== undefined) {
                sectionCardCounts1[id] = cardCount1;
            }
            if (cardCount2 !== undefined) {
                sectionCardCounts2[id] = cardCount2;
            }
        }
        result1[section] = sectionCardCounts1;
        result2[section] = sectionCardCounts2;
    }
    return [result1, result2];
}
function allRepositoryOracleIds(repository) {
    return new Set(Object.values(repository.branches)
        .flatMap(function (branchValue) { return allDeckOracleIds(branchValue); }));
}
