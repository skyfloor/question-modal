# Question Modal 问卷弹窗

A blocking in-chat survey tool for [QwenPaw](https://github.com/agentscope-ai/QwenPaw) agents.

When an agent needs you to **choose between options, confirm a scope, or unblock a decision**,
it calls the `question_modal` tool. Instead of listing "A / B / C" as plain text and waiting for
you to type an answer, the agent renders a **clickable multi-page question card right inside the
conversation**, pauses, and continues reasoning with your structured answers.

## What it does

- Tool: `question_modal(questions, title?)` — blocks until the user submits or skips.
- Question types: `single` (radio), `multi` (checkbox list, answers returned as an array), `text` (free input).
- Every choice question carries an extra "Other" free-text box; the last page has a global
  "additional comments" field.
- **Conditional questions** via `showIf` — a question only appears when an earlier answer matches,
  e.g. `{"q0": ["Option B"]}`. Multi-key conditions are AND; multi-value lists are OR.
- Navigation counts and page progress adapt to the visible question set; hidden answers are
  dropped from the result.
- Answer recovery: the card resolves itself by `tool_call_id`, so refreshed pages and stale
  requests cannot bind to the wrong survey; local handles are persisted so a blocked session can
  always rescue itself.

## Result format

```json
{
  "answers": {
    "q0": {"type": "single", "value": "Option A", "other": "", "skipped": false},
    "q1": {"type": "multi", "value": ["X", "Y"], "other": "", "skipped": false}
  },
  "other": "",
  "skipped": false
}
```

Skipping the whole survey returns `{"skipped": true}`. Skipping one question keeps the survey
running and marks that entry explicitly.

## Requirements

- QwenPaw `>= 2.0.0, < 2.3.0` (verified on 2.2.x).
- No third-party Python or npm dependencies at runtime.

## Install

Console → Plugins → Install, or:

```bash
qwenpaw plugin install question-modal-1.0.0.zip
```

The plugin hot-loads; **hard-refresh the browser (Ctrl+Shift+R) after installing**, because the
front-end bundle is injected at page load, not at install time.

Note: after (re)installing, the tool entry is created in each agent's config **disabled** by the
host. Enable `question_modal` for the agents that should use it (Settings → Tools, or
`agent.json → tools.builtin_tools.question_modal.enabled`).

## Behavior guidance

The tool description tells the model when to use it. If an agent still lists text options instead
of opening a survey, add a note to that agent's `SOUL.md`, e.g.:

> When you need the user to make a choice, call `question_modal` instead of enumerating options
> in the reply body — plain-text options cannot be clicked.

## License

Apache License 2.0. This plugin is derived from `ask-user-plugin` by Levodoubt (MIT); see the
attribution section in [LICENSE](LICENSE).
