import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DOCS_DIR = join(process.cwd(), "docs", "backend");

const EXPECTED_DOCS = [
  "API-PLAN.md",
  "ARCHITECTURE.md",
  "DATA-MODEL.md",
  "DECISIONS.md",
  "IMPLEMENTATION-PLAN.md",
  "SECURITY.md",
];

interface Heading {
  level: number;
  text: string;
  line: number;
}

interface FenceInfo {
  marker: string;
  line: number;
}

interface Analysis {
  headings: Heading[];
  problems: string[];
}

function analyzeMarkdown(markdown: string): Analysis {
  const lines = markdown.split(/\r?\n/);
  const headings: Heading[] = [];
  const problems: string[] = [];

  let openFence: FenceInfo | null = null;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(rawLine);
    const marker = fenceMatch?.[1];

    if (marker !== undefined) {
      if (openFence === null) {
        openFence = { marker, line: lineNumber };
      } else if (
        marker[0] === openFence.marker[0] &&
        marker.length >= openFence.marker.length
      ) {
        openFence = null;
      }
      return;
    }

    if (openFence !== null) {
      return;
    }

    const headingMatch = /^(#{1,6})\s+(\S.*)$/.exec(rawLine);
    const hashes = headingMatch?.[1];
    const text = headingMatch?.[2];
    if (hashes !== undefined && text !== undefined) {
      headings.push({ level: hashes.length, text, line: lineNumber });
    }
  });

  if (openFence !== null) {
    const fence: FenceInfo = openFence as FenceInfo;
    problems.push(`unclosed code fence opened at line ${fence.line}`);
  }

  if (headings.length === 0) {
    problems.push("document has no headings");
  } else {
    const first = headings.at(0);
    if (first === undefined) {
      problems.push("document has no headings");
    } else if (first.level !== 1) {
      problems.push(
        `first heading is h${first.level} at line ${first.line}, expected h1`,
      );
    }

    for (let index = 1; index < headings.length; index += 1) {
      const previous = headings.at(index - 1);
      const current = headings.at(index);
      if (previous === undefined || current === undefined) {
        continue;
      }
      if (current.level > previous.level + 1) {
        problems.push(
          `heading level jumps from h${previous.level} to h${current.level} at line ${current.line} ("${current.text}")`,
        );
      }
    }

    const firstSection = headings.find((heading) => heading.level === 2);
    if (firstSection === undefined) {
      problems.push("document has no level-2 section");
    } else if (firstSection.text !== "Overview") {
      problems.push(
        `first level-2 section is "${firstSection.text}" at line ${firstSection.line}, expected "Overview"`,
      );
    }
  }

  return { headings, problems };
}

describe("backend design docs", () => {
  it("contains every expected document", () => {
    const found = readdirSync(DOCS_DIR)
      .filter((name) => name.endsWith(".md"))
      .sort();
    expect(found).toEqual(EXPECTED_DOCS);
  });

  for (const name of EXPECTED_DOCS) {
    it(`${name} has balanced fences and ordered headings`, () => {
      const markdown = readFileSync(join(DOCS_DIR, name), "utf8");
      const { problems } = analyzeMarkdown(markdown);
      expect(problems).toEqual([]);
    });

    it(`${name} ends with a newline and has no trailing whitespace`, () => {
      const markdown = readFileSync(join(DOCS_DIR, name), "utf8");
      expect(markdown.endsWith("\n")).toBe(true);

      const offending = markdown
        .split(/\r?\n/)
        .map((line, index) => ({ line, number: index + 1 }))
        .filter((entry) => /[ \t]+$/.test(entry.line))
        .map((entry) => entry.number);

      expect(offending).toEqual([]);
    });
  }
});
