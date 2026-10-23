# Contributing

Start with a reproducible review problem. For a bug, provide a minimal synthetic diff, expected behavior and actual behavior. Never post private code or credentials.

For a rule, describe the exact pattern, its limitations and the useful action a reviewer should take. Include one matching fixture and one counterexample. Rules should not claim to prove a change is vulnerable or safe.

Keep generated reports free of raw code and credential values. Avoid network requests, telemetry and runtime dependencies. Keep pull requests focused.

```sh
npm run check
npm test
npm run demo
```

For UI changes, test examples, filtering, file selection, clearing, downloads and a narrow viewport. Document changes to the privacy model explicitly.
