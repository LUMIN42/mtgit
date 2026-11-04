/**
 * Splits a query into tokens. Quotes keep spaces and parentheses inside a term,
 * the quotes themselves stay in the term text and are removed by {@link unquote}.
 */

export type QueryToken =
  | {type: "lparen"}
  | {type: "rparen"}
  | {type: "not"}
  | {type: "or"}
  | {type: "and"}
  | {type: "term", text: string};

/**
 * Removes quotes and resolves backslash escapes.
 */
export function unquote(text: string): string {
  let result = "";
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      result += char;
      escaped = false;
    }
    else if (char === "\\") {
      escaped = true;
    }
    else if (char !== "\"") {
      result += char;
    }
  }

  return result;
}

export function tokenize(query: string): QueryToken[] {
  const tokens: QueryToken[] = [];
  let index = 0;

  while (index < query.length) {
    const char = query[index];

    if (/\s/.test(char)) {
      index++;
    }
    else if (char === "(") {
      tokens.push({type: "lparen"});
      index++;
    }
    else if (char === ")") {
      tokens.push({type: "rparen"});
      index++;
    }
    else if (char === "-" && index + 1 < query.length && !/\s/.test(query[index + 1])) {
      tokens.push({type: "not"});
      index++;
    }
    else {
      let text = "";
      let inQuotes = false;
      let escaped = false;

      while (index < query.length) {
        const current = query[index];

        if (!escaped && !inQuotes && (/\s/.test(current) || current === ")")) {
          break;
        }

        if (escaped) {
          escaped = false;
        }
        else if (current === "\\") {
          escaped = true;
        }
        else if (current === "\"") {
          inQuotes = !inQuotes;
        }

        text += current;
        index++;
      }

      const lower = text.toLowerCase();

      if (lower === "or") {
        tokens.push({type: "or"});
      }
      else if (lower === "and") {
        tokens.push({type: "and"});
      }
      else {
        tokens.push({type: "term", text});
      }
    }
  }

  return tokens;
}
