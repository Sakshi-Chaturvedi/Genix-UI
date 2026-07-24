import { IRuleSet } from "../types/test.types.js";

// ─── Rule Registry ────────────────────────────────────────────────────────────
// Each key maps to a feature's ruleSet id defined in the prompt JSON files.

const defaultWeights = {
  accessibility: 20,
  typing: 20,
  architecture: 20,
  styling: 20,
  responsiveness: 20,
};

export const ruleRegistry: Record<string, IRuleSet> = {

  button: {
    mustContain: ["interface", "export const", "ButtonProps", ".module.css", "disabled", "onClick"],
    mustNotContain: ["any", "style={{", "className=\"", "TODO", "Tailwind", "styled-components", "@emotion"],
    accessibilityRules: ["aria-", "role=", "tabIndex", "onKeyDown"],
    architectureRules: ["export const Button", "interface Button"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": React.FC", "React.ButtonHTMLAttributes", ": string", ": boolean"],
    qualityWeights: defaultWeights,
  },

  card: {
    mustContain: ["interface", "export const", "CardProps", ".module.css"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind", "@emotion"],
    accessibilityRules: ["aria-", "role="],
    architectureRules: ["export const Card"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": string", ": React.ReactNode"],
    qualityWeights: defaultWeights,
  },

  navbar: {
    mustContain: ["interface", "export const", ".module.css", "nav", "aria-label"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-label", "role=", "tabIndex", "aria-expanded"],
    architectureRules: ["export const Navbar", "export const Nav"],
    stylingRules: [".module.css", "@media"],
    typescriptRules: ["interface", ": string", ": boolean"],
    qualityWeights: defaultWeights,
  },

  modal: {
    mustContain: ["interface", "export const", ".module.css", "aria-modal", "role=\"dialog\"", "onClose"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-modal", "role=\"dialog\"", "aria-labelledby", "aria-describedby"],
    architectureRules: ["export const Modal"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": boolean", ": React.ReactNode"],
    qualityWeights: defaultWeights,
  },

  accordion: {
    mustContain: ["interface", "export const", ".module.css", "aria-expanded", "aria-controls"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-expanded", "aria-controls", "role="],
    architectureRules: ["export const Accordion"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": string", ": boolean", ": React.ReactNode"],
    qualityWeights: defaultWeights,
  },

  tabs: {
    mustContain: ["interface", "export const", ".module.css", "role=\"tablist\"", "role=\"tab\"", "aria-selected"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["role=\"tablist\"", "role=\"tab\"", "aria-selected", "aria-controls", "tabIndex"],
    architectureRules: ["export const Tabs", "export const Tab"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": string", ": boolean", ": React.ReactNode"],
    qualityWeights: defaultWeights,
  },

  tooltip: {
    mustContain: ["interface", "export const", ".module.css", "aria-describedby"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-describedby", "role=\"tooltip\""],
    architectureRules: ["export const Tooltip"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": string", ": React.ReactNode"],
    qualityWeights: defaultWeights,
  },

  loader: {
    mustContain: ["interface", "export const", ".module.css", "aria-busy", "aria-label"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-busy", "aria-label", "role=\"status\""],
    architectureRules: ["export const Loader", "export const Spinner"],
    stylingRules: [".module.css", "@keyframes"],
    typescriptRules: ["interface", ": string"],
    qualityWeights: defaultWeights,
  },

  "profile-card": {
    mustContain: ["interface", "export const", ".module.css"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-label", "alt="],
    architectureRules: ["export const ProfileCard", "export const Profile"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": string"],
    qualityWeights: defaultWeights,
  },

  "page-generic": {
    mustContain: ["export const", ".module.css", "interface"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-", "role=", "alt="],
    architectureRules: ["export const"],
    stylingRules: [".module.css", "@media"],
    typescriptRules: ["interface", ": string"],
    qualityWeights: defaultWeights,
  },

  conversion: {
    mustContain: ["interface", "export const", ": React.FC"],
    mustNotContain: ["any", "style={{", "TODO", "export default"],
    accessibilityRules: [],
    architectureRules: ["export const"],
    stylingRules: [],
    typescriptRules: ["interface", ": React.FC", ": string", ": number", ": boolean"],
    qualityWeights: {
      accessibility: 10,
      typing: 40,
      architecture: 20,
      styling: 10,
      responsiveness: 20,
    },
  },

  improvement: {
    mustContain: ["interface", "export const", ".module.css"],
    mustNotContain: ["any", "style={{", "TODO", "Tailwind"],
    accessibilityRules: ["aria-"],
    architectureRules: ["export const"],
    stylingRules: [".module.css"],
    typescriptRules: ["interface", ": string"],
    qualityWeights: defaultWeights,
  },

  explanation: {
    mustContain: ["explanation"],
    mustNotContain: ["TODO"],
    accessibilityRules: [],
    architectureRules: [],
    stylingRules: [],
    typescriptRules: [],
    qualityWeights: {
      accessibility: 20,
      typing: 20,
      architecture: 20,
      styling: 20,
      responsiveness: 20,
    },
  },
};

export function getRuleSet(name: string): IRuleSet | undefined {
  return ruleRegistry[name];
}
