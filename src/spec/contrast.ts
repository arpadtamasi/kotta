import { readFileSync } from "node:fs";
import { parseMarkdown, sections } from "../core/markdown.js";
import type { SpecNode } from "./registry.js";

/**
 * Glossary contrast: a node's claim that says of a glossary term's non-example what the term denies.
 *
 * A glossary term lists non-examples as "<subject>: <why it is not the term>". A contrast candidate is
 * one sentence of another node's claim — its Rule, Meaning, Definition, Then, Postconditions,
 * Invariants or Response — that names the term, names the non-example's subject, and states without
 * negation what the non-example's explanation negates ("… nem zárja le a játszmát" against "… lezárja
 * a játszmát"). A word merely appearing in a title is not a contrast. The test is lexical and
 * deliberately narrow: where it cannot tell, it stays silent, because the list is an aid to the agent
 * who has to compare every claim anyway, not a measure.
 */

/** The sections in which a node states something, as opposed to explaining or scoping it. */
export const CLAIM_SECTIONS = ["rule", "meaning", "definition", "then", "postconditions", "invariants", "response"] as const;

const NEGATIONS = new Set(["not", "no", "never", "without", "none", "nor", "cannot", "doesn", "don", "isn", "aren", "won", "nem", "nincs", "nincsen", "nincsenek", "sem", "soha", "sosem", "nélkül", "ne", "se", "semmi", "semmilyen"]);

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "its", "are", "was", "but", "from", "into", "than", "then", "when", "which", "who", "whose", "also", "only", "one", "any", "all", "each", "shall", "must", "may", "will", "can", "has", "have", "been", "being", "does", "did",
  "egy", "egyik", "még", "már", "meg", "fel", "ide", "oda", "aki", "ami", "amely", "amelyet", "amelyek", "ahol", "hogy", "ezt", "azt", "ez", "az", "ezért", "azért", "hanem", "csak", "vagy", "és", "is", "mint", "pedig", "de", "ha", "akkor", "után", "előtt", "alatt", "felett", "között", "szerint", "által", "annak", "ennek", "van", "volt", "lesz",
]);

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[`*_"„”“]/g, " ").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** The words that carry a text's meaning; numbers only when asked, since "a pikk 2" is not "a pikk". */
function contentWords(text: string, numbers = false): string[] {
  return [...new Set(tokens(text).filter((token) => /^\d+$/.test(token) ? numbers : token.length >= 3 && !STOPWORDS.has(token) && !NEGATIONS.has(token)))];
}

/** A word of a statement matches a token of a sentence across inflection: a shared stem, or a prefixed verb. */
export function wordMatches(word: string, token: string): boolean {
  if (/^\d+$/.test(word)) return token === word;
  if (token.startsWith(word)) return true;
  if (word.startsWith(token) && token.length >= 4) return true;
  return word.length >= 5 && token.includes(word);
}

const present = (word: string, sentence: string[]) => sentence.some((token) => wordMatches(word, token));
const negations = (text: string) => tokens(text).filter((token) => NEGATIONS.has(token)).length;

export interface NonExample { subject: string; explanation: string }

export function nonExamples(content: string): NonExample[] {
  const text = sections(content).get("non-examples") ?? "";
  return text.split(/\r?\n/)
    .map((line) => /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line)?.[1] ?? "")
    .map((item) => item.replace(/[`*_]/g, "").trim())
    .map((item) => {
      const split = /\s+[—–-]\s+|:\s/.exec(item);
      return split ? { subject: item.slice(0, split.index).trim(), explanation: item.slice(split.index + split[0].length).trim() } : { subject: item, explanation: "" };
    })
    .filter((item) => item.subject.length >= 3);
}

/** The words a non-example's explanation denies: every clause that follows a negation, to the next punctuation. */
function deniedWords(explanation: string): string[] {
  const words: string[] = [];
  for (const clause of explanation.toLowerCase().split(/[,;:.!?()]/)) {
    const parts = tokens(clause);
    const at = parts.findIndex((token) => NEGATIONS.has(token));
    if (at >= 0) words.push(...contentWords(parts.slice(at + 1).join(" ")));
  }
  return [...new Set(words)];
}

/** The sentences a node claims, from its claim sections. */
export function claimSentences(content: string): string[] {
  const body = sections(content);
  return CLAIM_SECTIONS.flatMap((heading) => (body.get(heading) ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .split(/\r?\n\s*\r?\n|\r?\n(?=\s*(?:[-*+]|\d+[.)])\s)/)
    .flatMap((block) => block.split(/(?<=[.!?])\s+(?=[\p{Lu}„"“(])/u))
    .map((sentence) => sentence.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean));
}

export interface Contrast { sentence: string; subject: string; explanation: string }

/**
 * The sentences of `claims` that contradict one of `term`'s non-examples: each names the term (every
 * content word of its title), names the non-example's subject (at least two thirds of its content
 * words), states a word the explanation negates, and carries no negation of its own beyond what the
 * subject itself says.
 */
export function glossaryContrasts(termTitle: string, termContent: string, claims: string[]): Contrast[] {
  const titleWords = contentWords(termTitle);
  if (!titleWords.length) return [];
  const found: Contrast[] = [];
  for (const { subject, explanation } of nonExamples(termContent)) {
    const subjectWords = contentWords(subject, true).filter((word) => !titleWords.includes(word));
    const denied = deniedWords(explanation).filter((word) => !titleWords.includes(word) && !subjectWords.includes(word));
    if (!subjectWords.length || !denied.length) continue;
    const needed = Math.max(1, Math.ceil((subjectWords.length * 2) / 3));
    for (const sentence of claims) {
      const words = tokens(sentence);
      if (!titleWords.every((word) => present(word, words))) continue;
      // A token spent on naming the term names nothing else: "pikktöbbségért" is not "a pikk 2".
      const rest = words.filter((token) => !titleWords.some((word) => wordMatches(word, token)));
      if (subjectWords.filter((word) => present(word, rest)).length < needed) continue;
      if (!denied.some((word) => present(word, rest))) continue;
      if (negations(sentence) > negations(subject)) continue;
      found.push({ sentence, subject, explanation });
    }
  }
  return found;
}

export function readContent(node: SpecNode): string {
  return parseMarkdown(readFileSync(node.path, "utf8")).content;
}
