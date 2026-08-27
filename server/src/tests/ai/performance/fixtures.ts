/**
 * Performance test fixtures.
 *
 * - Small/Medium/Large fixtures are built from existing mock responses.
 * - "Large" fixtures are generated synthetically to test scaling behavior
 *   without duplicating component code.
 * - No external network calls are made.
 */
import {
  mockButtonResponse,
  mockCardResponse,
  mockNavbarResponse,
  mockModalResponse,
  mockAccordionResponse,
  mockTabsResponse,
} from "../negative/fixtures/mock-responses.js";

// ── Re-export standard fixtures ───────────────────────────────────────────────
export const fixtures = {
  button: mockButtonResponse,
  card: mockCardResponse,
  navbar: mockNavbarResponse,
  modal: mockModalResponse,
  accordion: mockAccordionResponse,
  tabs: mockTabsResponse,
};

// ── Synthetic large fixtures ──────────────────────────────────────────────────
// Build a large fixture by repeating interface/type declarations inside the
// same file content — simulates a genuinely large generated file without
// inventing new component logic.

function buildLargeContent(base: string, repeats: number): string {
  const commentBlock = Array.from(
    { length: repeats },
    (_, i) =>
      `// ── Extended type variant ${i} ──────────────────────────────────────────\n` +
      `// interface ExtendedVariant${i} extends React.HTMLAttributes<HTMLElement> {\n` +
      `//   variantProp${i}?: string;\n` +
      `// }\n`
  ).join("\n");
  return base + "\n" + commentBlock;
}

const baseContent = mockButtonResponse.data.files[0].content;

/** ~5× the base button content — medium load */
export const mediumFixture = {
  success: true,
  data: {
    files: [
      {
        path: "Button.tsx",
        type: "code",
        language: "typescript",
        content: buildLargeContent(baseContent, 50),
      },
    ],
  },
};

/** ~20× the base button content — heavy load */
export const largeFixture = {
  success: true,
  data: {
    files: [
      {
        path: "Button.tsx",
        type: "code",
        language: "typescript",
        content: buildLargeContent(baseContent, 200),
      },
    ],
  },
};

/** Multi-file fixture simulating a full component set generated at once */
export const multiFileFixture = {
  success: true,
  data: {
    files: [
      ...mockNavbarResponse.data.files,          // 2 files (tsx + css)
      ...mockModalResponse.data.files,            // 1 tsx
      mockButtonResponse.data.files[0],           // 1 tsx
      mockCardResponse.data.files[0],             // 1 tsx
    ],
  },
};
