# Genix UI — AI Regression Testing Framework

A production-grade, provider-independent AI regression testing framework for the Genix UI backend.

---

## Folder Structure

```
src/tests/ai/
├── config/
│   └── test.config.ts         # All config via env vars (CI/CD-friendly)
├── prompts/
│   ├── button.prompt.json      # 20 representative test prompts
│   ├── card.prompt.json
│   ├── navbar.prompt.json
│   ├── modal.prompt.json
│   ├── accordion.prompt.json
│   ├── tabs.prompt.json
│   ├── tooltip.prompt.json
│   ├── loader.prompt.json
│   ├── profile-card.prompt.json
│   ├── hero.prompt.json
│   ├── dashboard.prompt.json
│   ├── login-form.prompt.json
│   ├── pricing.prompt.json
│   ├── data-table.prompt.json
│   ├── image-gallery.prompt.json
│   ├── sidebar.prompt.json
│   ├── footer.prompt.json
│   ├── js-to-ts.prompt.json
│   ├── improve-component.prompt.json
│   └── explain-component.prompt.json
├── rules/
│   └── rule.registry.ts        # Validation rules per ruleSet
├── runner/
│   ├── test.runner.ts           # Executes a single test case
│   └── index.ts                 # CLI entry point
├── validators/
│   └── output.validator.ts      # Structure + quality validation
├── reports/
│   ├── html.template.ts         # HTML report renderer
│   ├── report.generator.ts      # Writes JSON + HTML reports to disk
│   ├── report.json              # Generated on each run
│   └── report.html              # Generated on each run
├── snapshots/                   # (Optional) baseline output snapshots
├── types/
│   └── test.types.ts            # All shared interfaces
├── utils/
│   └── http.client.ts           # Authenticated HTTP client
└── README.md                    # This file
```

---

## How to Run Tests

### 1. Ensure the server is running

```bash
cd server
npm run dev
```

### 2. Get an auth token

Login once to get a JWT access token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Copy the `accessToken` from the response.

### 3. Set environment variables

```bash
# Windows (PowerShell)
$env:TEST_JWT_TOKEN="<your-access-token>"

# Linux / macOS / CI
export TEST_JWT_TOKEN="<your-access-token>"
```

### 4. Run the framework

```bash
npm run test:ai
```

---

## Configuration (Environment Variables)

| Variable | Default | Description |
|---|---|---|
| `TEST_JWT_TOKEN` | *(required)* | Valid JWT access token |
| `TEST_API_BASE_URL` | `http://localhost:5000` | Backend API URL |
| `AI_DEFAULT_PROVIDER` | `gemini` | AI provider name |
| `GEMINI_MODEL` | `gemini-2.5-flash` | AI model ID |
| `TEST_TIMEOUT_MS` | `60000` | Per-request timeout |
| `TEST_CONCURRENCY` | `1` | Parallel test count |
| `TEST_OUTPUT_DIR` | `src/tests/ai/reports` | Report output folder |
| `TEST_GENERATE_SNAPSHOTS` | `false` | Save baseline snapshots |

---

## Adding a New Prompt

1. Create a JSON file in `src/tests/ai/prompts/your-prompt.json`:

```json
{
  "id": "my-component",
  "name": "My Component",
  "feature": "generate",
  "endpoint": "/api/ai/generate",
  "body": {
    "prompt": "Create a ..."
  },
  "ruleSet": "button"
}
```

2. The runner auto-discovers all `*.json` files in `prompts/`. No code changes needed.

---

## Adding a New Rule Set

In `rules/rule.registry.ts`, add a new entry:

```typescript
"my-rule-set": {
  mustContain: ["interface", "export const"],
  mustNotContain: ["any", "TODO"],
  accessibilityRules: ["aria-label"],
  architectureRules: ["export const MyComponent"],
  stylingRules: [".module.css"],
  typescriptRules: ["interface", ": string"],
  qualityWeights: { accessibility: 20, typing: 20, architecture: 20, styling: 20, responsiveness: 20 },
},
```

Then reference it as `"ruleSet": "my-rule-set"` in your prompt JSON.

---

## Quality Score

Each test produces a 100-point quality score across 5 dimensions:

| Dimension | Max Points | What It Checks |
|---|---|---|
| Accessibility | 20 | ARIA attributes, roles, keyboard support |
| TypeScript | 20 | Interfaces, typed props, no `any` |
| Architecture | 20 | Named exports, component structure |
| Styling | 20 | CSS Modules, no inline styles |
| Responsiveness | 20 | CSS media queries |

---

## CI/CD Integration

The process exits with **code 0** on all-pass and **code 1** on any failure.

**GitHub Actions example:**

```yaml
- name: AI Regression Tests
  env:
    TEST_JWT_TOKEN: ${{ secrets.AI_TEST_TOKEN }}
    TEST_API_BASE_URL: https://your-api.com
  run: npm run test:ai
```

---

## Future Provider Support

To test a different provider, simply:

```bash
AI_DEFAULT_PROVIDER=openai npm run test:ai
```

No framework changes required. The prompts, rules, validators, and reporters are all provider-agnostic.
