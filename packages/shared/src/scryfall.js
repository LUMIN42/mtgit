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
exports.ScryfallSearchResponseSchema = exports.ScryfallErrorSchema = exports.ScryfallSearchListSchema = exports.ScryfallApiCardIdSchema = exports.OracleCardSchema = exports.ColorCombinationSchema = exports.ColorCodeSchema = exports.COLOR_CODES = exports.PricesSchema = exports.LegalitiesSchema = exports.CardFaceSchema = exports.ImageUrisSchema = void 0;
exports.getCardImageUrls = getCardImageUrls;
var zod_1 = require("zod");
var repositoryTypes_js_1 = require("./repositoryTypes.js");
exports.ImageUrisSchema = zod_1.z
    .object({
    small: zod_1.z.string(),
    normal: zod_1.z.string(),
    large: zod_1.z.string(),
    png: zod_1.z.string(),
    art_crop: zod_1.z.string(),
    border_crop: zod_1.z.string()
});
exports.CardFaceSchema = zod_1.z
    .object({
    object: zod_1.z.literal("card_face"),
    name: zod_1.z.string(),
    mana_cost: zod_1.z.string(),
    type_line: zod_1.z.string(),
    oracle_text: zod_1.z.string(),
    power: zod_1.z.string().optional(),
    toughness: zod_1.z.string().optional(),
    colors: zod_1.z.array(zod_1.z.string()).catch(function () { return []; }), // todo handle adventure and prepared cards
    image_uris: exports.ImageUrisSchema.optional() // again, adventures break this
});
exports.LegalitiesSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.string());
exports.PricesSchema = zod_1.z
    .object({
    usd: zod_1.z.string().nullable().optional()
});
exports.COLOR_CODES = ["B", "W", "U", "R", "G"];
exports.ColorCodeSchema = zod_1.z.enum(exports.COLOR_CODES);
exports.ColorCombinationSchema = zod_1.z.array(exports.ColorCodeSchema).refine(function (colors) { return new Set(colors).size === colors.length; }, {
    message: "Color identity must not contain duplicate colors"
});
var ScryfallOracleCardBaseSchema = zod_1.z
    .object({
    object: zod_1.z.literal("card"),
    id: zod_1.z.string(),
    oracle_id: repositoryTypes_js_1.OracleIdSchema,
    name: zod_1.z.string(),
    lang: zod_1.z.string(),
    released_at: zod_1.z.string(),
    layout: zod_1.z.string(),
    card_faces: zod_1.z.array(exports.CardFaceSchema).optional(),
    // mana_cost: z.string().optional(),
    cmc: zod_1.z.number(),
    type_line: zod_1.z.string(),
    // oracle_text: z.string().optional(),
    power: zod_1.z.string().optional(),
    toughness: zod_1.z.string().optional(),
    // fixme colors: ColorIdentitySchema.catch([]), // the catch is needed for two-sided cards, which lack colors
    color_identity: exports.ColorCombinationSchema,
    produced_mana: exports.ColorCombinationSchema.catch([]),
    // keywords: z.array(z.string()),
    legalities: exports.LegalitiesSchema,
    // games: z.array(z.string()),
    // set: z.string(),
    // set_name: z.string(),
    rarity: zod_1.z.string(),
    prices: exports.PricesSchema.optional()
});
var SingleFacedScryfallOracleCardSchema = ScryfallOracleCardBaseSchema.and(zod_1.z.object({
    name: zod_1.z.string(),
    mana_cost: zod_1.z.string(),
    type_line: zod_1.z.string(),
    oracle_text: zod_1.z.string(),
    image_uris: exports.ImageUrisSchema,
    colors: exports.ColorCombinationSchema
}));
var DoubleFacedScryfallOracleCardSchema = ScryfallOracleCardBaseSchema.extend({ card_faces: zod_1.z.array(exports.CardFaceSchema) });
var AdventureOracleCardSchema = DoubleFacedScryfallOracleCardSchema
    .extend({
    image_uris: exports.ImageUrisSchema
});
exports.OracleCardSchema = zod_1.z
    .preprocess(function (rawCard) {
    var singleFacedParsing = SingleFacedScryfallOracleCardSchema.safeParse(rawCard);
    if (singleFacedParsing.success) {
        return __assign(__assign({}, singleFacedParsing.data), { card_faces: [__assign(__assign({}, singleFacedParsing.data), { object: "card_face" })] });
    }
    var adventureParsing = AdventureOracleCardSchema.safeParse(rawCard);
    if (adventureParsing.success) {
        var adventureCard = adventureParsing.data;
        var modifiedCard = __assign(__assign({}, adventureCard), { card_faces: __spreadArray([
                __assign(__assign({}, (adventureCard.card_faces[0])), { image_uris: adventureCard.image_uris })
            ], adventureCard.card_faces.slice(1), true) });
        return modifiedCard;
    }
    return rawCard;
}, DoubleFacedScryfallOracleCardSchema)
    .transform(function (parsed) {
    return __assign(__assign({}, parsed), { colors: __spreadArray([], new Set(parsed.card_faces
            .filter(function (face) { return face.colors; })
            .flatMap(function (face) { return face.colors; })), true) });
});
// Live Scryfall API payloads can occasionally omit fields this app expects.
// This variant keeps core identifiers strict while filling optional app fields.
// export const ScryfallApiOracleCardSchema = DoubleFacedScryfallOracleCardSchema.extend({
//   cmc: z.number().catch(0),
//   type_line: z.string().catch(""),
//   colors: ColorCombinationSchema.catch([]),
//   color_identity: ColorCombinationSchema.catch([]),
//   keywords: z.array(z.string()).catch([]),
//   legalities: LegalitiesSchema.catch({}),
//   games: z.array(z.string()).catch([]),
//   set: z.string().catch(""),
//   set_name: z.string().catch(""),
//   rarity: z.string().catch("common")
// });
exports.ScryfallApiCardIdSchema = zod_1.z.object({
    oracle_id: repositoryTypes_js_1.OracleIdSchema
}).transform(function (card) { return repositoryTypes_js_1.OracleIdSchema.parse(card.oracle_id); });
exports.ScryfallSearchListSchema = zod_1.z.object({
    object: zod_1.z.literal("list"),
    has_more: zod_1.z.boolean(),
    data: zod_1.z.array(exports.ScryfallApiCardIdSchema),
    total_cards: zod_1.z.number().int().nonnegative(),
    next_page: zod_1.z.string().optional(),
    warnings: zod_1.z.array(zod_1.z.string()).optional()
});
exports.ScryfallErrorSchema = zod_1.z.object({
    object: zod_1.z.literal("error"),
    code: zod_1.z.string(),
    status: zod_1.z.number().int(),
    details: zod_1.z.string(),
    type: zod_1.z.string().optional(),
    warnings: zod_1.z.array(zod_1.z.string()).optional()
});
exports.ScryfallSearchResponseSchema = zod_1.z.union([
    exports.ScryfallSearchListSchema,
    exports.ScryfallErrorSchema
]);
function getCardImageUrls(card) {
    var urls = card.card_faces
        .filter(function (face) { return "image_uris" in face; })
        .map(function (face) { return face.image_uris.normal; });
    if (urls.length === 1) {
        return [urls[0]];
    }
    else if (urls.length === 2) {
        return [urls[0], urls[1]];
    }
    else {
        console.log(card);
        console.log(urls);
        throw new Error("wrong card uris object: ".concat(urls));
    }
}
