import {
  mockButtonResponse,
  mockCardResponse,
  mockAccordionResponse,
  mockProfileCardResponse,
  mockNavbarResponse,
  mockModalResponse,
  mockTabsResponse
} from "../fixtures/mock-responses.js";

export interface IMutationTest {
  component: string;
  ruleSetName: string;
  testName: string;
  mutate: (fixture: any) => any;
  expectedFailureMessage: string;
}

function clone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export const negativeTests: IMutationTest[] = [
  // ─── BUTTON MUTATIONS ──────────────────────────────────────────────────────
  {
    component: "Button",
    ruleSetName: "button",
    testName: "missing onClick",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/onClick/g, "onPress");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "onClick"`,
  },
  {
    component: "Button",
    ruleSetName: "button",
    testName: "missing disabled",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/disabled/g, "isDisabled");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "disabled"`,
  },
  {
    component: "Button",
    ruleSetName: "button",
    testName: "missing aria- requirement",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-label/g, "title");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-"`,
  },

  // ─── CARD MUTATIONS ────────────────────────────────────────────────────────
  {
    component: "Card",
    ruleSetName: "card",
    testName: "missing tabIndex",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/tabIndex=\{0\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "tabIndex"`,
  },
  {
    component: "Card",
    ruleSetName: "card",
    testName: "missing onKeyDown",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/onKeyDown=\{\(e\) => \{\}\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "onKeyDown"`,
  },
  {
    component: "Card",
    ruleSetName: "card",
    testName: "missing aria- requirement",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-labelledby/g, "id");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-"`,
  },

  // ─── ACCORDION MUTATIONS ───────────────────────────────────────────────────
  {
    component: "Accordion",
    ruleSetName: "accordion",
    testName: "missing aria-expanded",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-expanded=\{isOpen\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-expanded"`,
  },
  {
    component: "Accordion",
    ruleSetName: "accordion",
    testName: "missing aria-controls",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-controls=\{contentId\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-controls"`,
  },
  {
    component: "Accordion",
    ruleSetName: "accordion",
    testName: 'missing role="button"',
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/role="button"/g, "");
      // Must also replace native <button> tag to avoid fallback satisfying the rule
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/<button/g, "<div").replace(/<\/button>/g, "</div>");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "role="button""`,
  },

  // ─── PROFILE CARD MUTATIONS ────────────────────────────────────────────────
  {
    component: "Profile Card",
    ruleSetName: "profile-card",
    testName: "missing alt=",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/alt=/g, "title=");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "alt="`,
  },
  {
    component: "Profile Card",
    ruleSetName: "profile-card",
    testName: "missing aria-label",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-label="User Profile"/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-label"`,
  },

  // ─── NAVBAR MUTATIONS ──────────────────────────────────────────────────────
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "missing aria-label",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-label="Main Navigation"/g, "");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "aria-label"`,
  },
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "missing role=\"navigation\"",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content
        .replace(/role="navigation"/g, "")
        .replace(/<button/g, "<div")
        .replace(/<\/button>/g, "</div>");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "role="`,
  },
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "missing tabIndex",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/tabIndex=\{0\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "tabIndex"`,
  },
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "missing aria-expanded",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-expanded=\{menuOpen\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-expanded"`,
  },
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "missing @media",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[1].content = cloned.data.files[1].content.replace(/@media/g, "");
      return cloned;
    },
    expectedFailureMessage: `[responsive] No CSS media queries detected`,
  },

  // ─── MODAL MUTATIONS ───────────────────────────────────────────────────────
  {
    component: "Modal",
    ruleSetName: "modal",
    testName: "missing aria-modal",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-modal=\{true\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "aria-modal"`,
  },
  {
    component: "Modal",
    ruleSetName: "modal",
    testName: "missing role=\"dialog\"",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/role="dialog"/g, "");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "role=\"dialog\""`,
  },
  {
    component: "Modal",
    ruleSetName: "modal",
    testName: "missing aria-labelledby",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-labelledby="modal-title"/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-labelledby"`,
  },
  {
    component: "Modal",
    ruleSetName: "modal",
    testName: "missing onClose",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/onClose/g, "onDismiss");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "onClose"`,
  },

  // ─── TABS MUTATIONS ────────────────────────────────────────────────────────
  {
    component: "Tabs",
    ruleSetName: "tabs",
    testName: "missing role=\"tablist\"",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/role="tablist"/g, "");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "role=\"tablist\""`,
  },
  {
    component: "Tabs",
    ruleSetName: "tabs",
    testName: "missing role=\"tab\"",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/role="tab"/g, "");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "role=\"tab\""`,
  },
  {
    component: "Tabs",
    ruleSetName: "tabs",
    testName: "missing aria-selected",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-selected=\{activeId === tab.id\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "aria-selected"`,
  },
  {
    component: "Tabs",
    ruleSetName: "tabs",
    testName: "missing aria-controls",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-controls=\{[^\}]+\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-controls"`,
  },
  {
    component: "Tabs",
    ruleSetName: "tabs",
    testName: "missing tabIndex",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/tabIndex=\{[^\}]+\}/g, "");
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "tabIndex"`,
  }
];

export const getFixtureForComponent = (component: string) => {
  switch (component) {
    case "Button": return mockButtonResponse;
    case "Card": return mockCardResponse;
    case "Accordion": return mockAccordionResponse;
    case "Profile Card": return mockProfileCardResponse;
    case "Navbar": return mockNavbarResponse;
    case "Modal": return mockModalResponse;
    case "Tabs": return mockTabsResponse;
    default: throw new Error("Unknown component");
  }
};

export interface IAdversarialTest {
  component: string;
  ruleSetName: string;
  testName: string;
  mutate: (fixture: any) => any;
  expectedFailureMessage: string;
  expectedBehavior: "vulnerable" | "secure";
  description: string;
}

export const adversarialTests: IAdversarialTest[] = [
  {
    component: "Button",
    ruleSetName: "button",
    testName: "REQUIRED TOKEN ONLY IN README (Secure)",
    description: "Required token 'interface' only exists in README documentation file.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/interface/g, "type");
      cloned.data.files.push({
        path: "README.md",
        type: "documentation",
        language: "markdown",
        content: "This component has an interface."
      });
      return cloned;
    },
    expectedFailureMessage: `[ts] Missing: "interface"`,
    expectedBehavior: "secure",
  },
  {
    component: "Button",
    ruleSetName: "button",
    testName: "REQUIRED TOKEN ONLY IN FILE PATH (Secure)",
    description: "Required token 'interface' only exists in the file path string.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/interface/g, "type");
      cloned.data.files[0].path = "components/interface/Button.tsx";
      return cloned;
    },
    expectedFailureMessage: `[ts] Missing: "interface"`,
    expectedBehavior: "secure",
  },
  {
    component: "Button",
    ruleSetName: "button",
    testName: "ARIA TOKEN ONLY IN COMMENT (Secure)",
    description: "Required token 'aria-' only exists in a code comment.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/aria-label=\{[^\}]+\}/g, "");
      cloned.data.files[0].content += "\n// TODO: add aria-label fallback";
      return cloned;
    },
    expectedFailureMessage: `[a11y] Missing: "aria-"`,
    expectedBehavior: "secure",
  },
  {
    component: "Modal",
    ruleSetName: "modal",
    testName: "ROLE TOKEN ONLY IN UNRELATED FILE (Secure)",
    description: "Required token 'role=\"dialog\"' only exists in the test file.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/role="dialog"/g, "");
      cloned.data.files.push({
        path: "Modal.test.tsx",
        type: "test",
        language: "typescript",
        content: "describe('Modal', () => { it('should have role=\"dialog\"', () => {}) })"
      });
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "role=\"dialog\""`,
    expectedBehavior: "secure",
  },
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "CSS MODULE TOKEN ONLY IN UNRELATED FILE (Secure)",
    description: "Required token '.module.css' only exists in README documentation file.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/\.module\.css/g, ".css");
      cloned.data.files[1].path = "Navbar.css";
      cloned.data.files.push({
        path: "README.md",
        type: "documentation",
        language: "markdown",
        content: "Requires .module.css file."
      });
      return cloned;
    },
    expectedFailureMessage: `Missing required token: ".module.css"`,
    expectedBehavior: "secure",
  },
  {
    component: "Navbar",
    ruleSetName: "navbar",
    testName: "TYPESCRIPT TOKEN ONLY IN COMMENT/STRING (Secure)",
    description: "Required token 'interface' only exists inside a code comment.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content = cloned.data.files[0].content.replace(/interface/g, "type");
      cloned.data.files[0].content += "\n// This is an interface helper";
      return cloned;
    },
    expectedFailureMessage: `Missing required token: "interface"`,
    expectedBehavior: "secure",
  },
  {
    component: "Button",
    ruleSetName: "button",
    testName: "FORBIDDEN TOKEN IN COMMENT (Secure)",
    description: "Forbidden token 'TODO' inside a comment is correctly flagged by the validator.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files[0].content += "\n// TODO: fix this later";
      return cloned;
    },
    expectedFailureMessage: `Contains forbidden token: "TODO"`,
    expectedBehavior: "secure",
  },
  {
    component: "Button",
    ruleSetName: "button",
    testName: "FORBIDDEN INLINE STYLE IN NON-COMPONENT FILE (Secure)",
    description: "Forbidden inline style inside a test file is correctly ignored by the validator.",
    mutate: (fixture) => {
      const cloned = clone(fixture);
      cloned.data.files.push({
        path: "Button.test.tsx",
        type: "test",
        language: "typescript",
        content: "const test = () => <Button style={{ color: 'red' }} />;"
      });
      return cloned;
    },
    expectedFailureMessage: `Contains forbidden token: "style={{"`,
    expectedBehavior: "secure",
  }
];


