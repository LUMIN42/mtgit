"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOR_NAME_TO_CODE = exports.COLOR_CODE_TO_NAMES = exports.ColorNameSchema = exports.COLOR_NAMES = exports.MAIN_TYPE_SET = exports.MAIN_TYPE_ORDER = exports.MainCardTypeSchema = exports.MAIN_CARD_TYPES = void 0;
exports.isMainCardType = isMainCardType;
exports.mainTypes = mainTypes;
var zod_1 = require("zod");
exports.MAIN_CARD_TYPES = [
    "Artifact",
    "Battle",
    "Creature",
    "Enchantment",
    "Instant",
    "Land",
    "Planeswalker",
    "Sorcery"
];
exports.MainCardTypeSchema = zod_1.z.enum(exports.MAIN_CARD_TYPES);
exports.MAIN_TYPE_ORDER = [
    "Artifact",
    "Battle",
    "Creature",
    "Enchantment",
    "Instant",
    "Sorcery",
    "Planeswalker",
    "Land"
];
exports.MAIN_TYPE_SET = new Set(exports.MAIN_CARD_TYPES);
function isMainCardType(value) {
    return exports.MAIN_TYPE_SET.has(value);
}
function mainTypes(typeLine) {
    var output = new Set();
    for (var _i = 0, MAIN_CARD_TYPES_1 = exports.MAIN_CARD_TYPES; _i < MAIN_CARD_TYPES_1.length; _i++) {
        var mainCardType = MAIN_CARD_TYPES_1[_i];
        if (typeLine.includes(mainCardType)) {
            output.add(mainCardType);
        }
    }
    return output;
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
exports.COLOR_NAMES = ["Black", "White", "Blue", "Red", "Green"];
exports.ColorNameSchema = zod_1.z.preprocess(function (raw) {
    if (typeof raw === "string") {
        return capitalize(raw);
    }
    return raw;
}, zod_1.z.enum(exports.COLOR_NAMES));
exports.COLOR_CODE_TO_NAMES = {
    B: "Black",
    W: "White",
    U: "Blue",
    R: "Red",
    G: "Green"
};
exports.COLOR_NAME_TO_CODE = {
    Black: "B",
    White: "W",
    Blue: "U",
    Red: "R",
    Green: "G"
};
