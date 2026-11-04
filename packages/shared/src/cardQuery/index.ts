/**
 * Scryfall-like card query language: parsing into a backend-independent AST.
 * Evaluation lives with each backend, e.g. the API compiles the AST into a mongo filter,
 * only the meaning of comparisons is shared (evaluation.ts).
 */

export * from "./ast.js";
export * from "./evaluation.js";
export {parseCardQuery} from "./parser.js";
export {DIRECTIVE_KEYWORDS} from "./fields.js";
