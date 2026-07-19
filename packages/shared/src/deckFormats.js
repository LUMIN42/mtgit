"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatSchema = exports.formats = void 0;
exports.maximumCardAmount = maximumCardAmount;
exports.maximumCardAmountWithoutCard = maximumCardAmountWithoutCard;
exports.expectedSectionCardCounts = expectedSectionCardCounts;
exports.relevantSections = relevantSections;
exports.isLegalDeck = isLegalDeck;
var zod_1 = require("zod");
// import {cardCount} from "./deckTypes.js";
exports.formats = ["Standard", "Modern", "Commander", "Pauper"];
exports.FormatSchema = zod_1.z.enum(exports.formats);
function maximumCardAmount(card, format) {
    var _a;
    if (card.type_line.includes("Basic")) {
        return Infinity;
    }
    else if (((_a = card.card_faces[0].oracle_text) !== null && _a !== void 0 ? _a : "").includes("A deck can have any number of cards named")) {
        return Infinity;
    }
    else if (format !== "Commander") {
        return 4;
    }
    return 1;
}
function maximumCardAmountWithoutCard(format) {
    if (format === "Commander") {
        return 1;
    }
    return 4;
}
function expectedSectionCardCounts(format) {
    if (format === "Commander") {
        return {
            "Main": 99
        };
    }
    return {
        "Main": 60,
        "Sideboard": 15
    };
}
function relevantSections(format) {
    if (format === "Commander") {
        return ["Main", "Commander"];
    }
    return ["Main", "Sideboard"];
}
function isLegalDeck(hydratedDeck, format) {
    for (var _i = 0, _a = Object.entries(hydratedDeck); _i < _a.length; _i++) {
        var _b = _a[_i], sn = _b[0], sectionContent = _b[1];
        var sectionName = sn;
        var cardCount = function (section) {
            return Object.values(section).reduce(function (sum, c) { return sum + c.count; }, 0);
        };
        var count = cardCount(sectionContent);
        if (expectedSectionCardCounts(format)[sectionName] !== count
            && !(format === "Commander" && sectionName === "Commander" && count > 0)) {
            return false;
        }
        for (var _c = 0, _d = Object.values(sectionContent); _c < _d.length; _c++) {
            var card = _d[_c];
            if (card.legalities[format.toLowerCase()] === "not_legal") {
                return false;
            }
        }
    }
    return true;
}
