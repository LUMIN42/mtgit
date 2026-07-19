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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECK_EXPORT_MODES = void 0;
exports.deckToExportText = deckToExportText;
var repositoryTypes_js_1 = require("./repositoryTypes.js");
exports.DECK_EXPORT_MODES = ["Arena", "MTGO"];
var ARENA_DECK_SECTION_TRANSLATOR = __assign(__assign({}, Object.fromEntries(repositoryTypes_js_1.DECK_SECTION_NAMES.map(function (name) { return [name, name]; }))), { Main: "Deck" });
function serializeCard(card) {
    return "".concat(card.count, " ").concat(card.name);
}
function serializeSectionContent(section) {
    return Object.values(section).map(serializeCard).join("\n");
}
function serializeArenaSection(section, sectionName) {
    return "\n".concat(ARENA_DECK_SECTION_TRANSLATOR[sectionName], "\n").concat(serializeSectionContent(section), "\n").trim();
}
// todo brawl decks
function toArenaText(deck, deckName) {
    return "\nAbout\nName ".concat(deckName, "\n\n").concat(Object.entries(deck)
        .map(function (_a) {
        var sectionName = _a[0], sectionContent = _a[1];
        return serializeArenaSection(sectionContent, sectionName);
    })
        .join("\n\n"), "\n").trim();
}
function toMtgoText(deck) {
    var _a;
    var output = serializeSectionContent((_a = deck.Main) !== null && _a !== void 0 ? _a : {});
    if ("Sideboard" in deck) {
        output = "\n".concat(output, "\n\nSIDEBOARD:\n").concat(serializeSectionContent(deck.Sideboard), "\n").trim();
    }
    if ("Commander" in deck) {
        output = "\n".concat(output, "\n\n").concat(serializeSectionContent(deck.Commander), "\n").trim();
    }
    return output;
}
function deckToExportText(deck, mode, deckName) {
    switch (mode) {
        case "Arena":
            return toArenaText(deck, deckName);
        case "MTGO":
            return toMtgoText(deck);
        default: {
            var _exhaustiveCheck = mode;
            return _exhaustiveCheck;
        }
    }
}
