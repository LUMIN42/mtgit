"use strict";
// Deck-related fully functional model (no classes, no mutation)
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.addCardToDeck = exports.cardCount = exports.addCard = exports.SECTION_BY_LABEL = void 0;
exports.isDeckCard = isDeckCard;
var repositoryTypes_js_1 = require("./repositoryTypes.js");
exports.SECTION_BY_LABEL = Object.fromEntries(repositoryTypes_js_1.DECK_SECTION_NAMES.map(function (name) { return [name.toLowerCase(), name]; }));
function isDeckCard(card) {
    return "count" in card;
}
/* -------------------------
   Section-level operations
--------------------------*/
var addCard = function (section, card, amount) {
    var _a;
    if (amount === void 0) { amount = 1; }
    var existing = section[card.oracle_id];
    return __assign(__assign({}, section), (_a = {}, _a[card.oracle_id] = existing
        ? __assign(__assign({}, existing), { count: existing.count + amount }) : __assign(__assign({}, card), { count: amount }), _a));
};
exports.addCard = addCard;
var cardCount = function (section) {
    return Object.values(section).reduce(function (sum, c) { return sum + c.count; }, 0);
};
exports.cardCount = cardCount;
/* -------------------------
   Deck-level operations
--------------------------*/
// todo consider removing
var ensureSection = function (deck, name) {
    var _a;
    var _b;
    return (__assign(__assign({}, deck), (_a = {}, _a[name] = (_b = deck[name]) !== null && _b !== void 0 ? _b : {}, _a)));
};
var addCardToDeck = function (deck, sectionName, card, amount) {
    var _a;
    var _b;
    if (amount === void 0) { amount = card.count; }
    var section = (_b = deck[sectionName]) !== null && _b !== void 0 ? _b : {};
    return __assign(__assign({}, deck), (_a = {}, _a[sectionName] = (0, exports.addCard)(section, card, amount), _a));
};
exports.addCardToDeck = addCardToDeck;
var isEmpty = function (deck) {
    return Object.values(deck).every(function (section) { return Object.keys(section !== null && section !== void 0 ? section : {}).length === 0; });
};
exports.isEmpty = isEmpty;
/* -------------------------
   Tagging
--------------------------*/
// export const tagSection = (
//   section: DeckSection,
//   tagsMap: TagsMap
// ): Record<OracleId, TaggedDeckCard> => {
//   const out: Record<OracleId, TaggedDeckCard> = {};
//
//   for (const [id, card] of Object.entries(section)) {
//     out[id] = {
//       ...card,
//       tags: tagsMap[id] ?? []
//     };
//   }
//
//   return out;
// };
// export const withTags = (
//   deck: DeckSections,
//   tagsMap: TagsMap
// ): DeckSections => {
//   const out: DeckSections = {};
//
//   for (const name of DECK_SECTION_NAMES) {
//     const section = deck[name];
//     if (!section) continue;
//
//     out[name] = tagSection(section, tagsMap);
//   }
//
//   return out;
// };
