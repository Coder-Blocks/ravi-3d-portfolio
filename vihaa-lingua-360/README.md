# VIHAA LINGUA-360

**Global AI Language Intelligence Observatory**

Live app: https://vihaa-lingua-360.onrender.com  
Research & methodology: https://vihaa-lingua-360.onrender.com/research.html  
Technical whitepaper: https://vihaa-lingua-360.onrender.com/VIHAA-LINGUA-360-Technical-Whitepaper.pdf

VIHAA LINGUA-360 is a real-provider multilingual AI evaluation and exploration platform built by **Think Innovative Creations (TIC)**.

## What it studies

- Multilingual meaning consistency
- Completeness and safety consistency
- Unsupported-claim risk as an AI-judge signal
- Dialect and register behavior
- Cross-model disagreement
- Refusal consistency
- Model/language regression over time
- Browser voice input/output
- Latency, provider-reported token usage and optional user-supplied cost estimates
- Reproducible Run IDs and designed PDF reports

## Important research rule

The project does **not** fabricate benchmark scores. If a provider fails, the failure remains visible. AI-judge metrics are explicitly presented as model judgments, not independent factual verification.

## Real providers

The client currently supports:

- Local Ollama
- Gemini
- OpenAI-compatible endpoints

Cloud usage requires the user's own provider credentials. Local Ollama can be used without per-request cloud charges.

## Explore Mode

Users can select a language and answer depth, ask a question through a real configured provider, receive a structured answer, listen to it using browser speech synthesis, export a designed PDF, and move the same question into Benchmark Mode.

## Reproducibility

Each benchmark run can capture:

- Run ID
- Timestamp
- Prompt
- Language
- Provider/model ID
- Temperature
- Latency
- Token usage when supplied by the provider
- Optional cost estimate using user-entered pricing
- Response
- Judge metrics
- Error state

## Public benchmark packs

See `benchmark-packs.json`. Packs currently include healthcare safety, cybersecurity, education, emergency safety, banking/scam safety, AI ethics, and general knowledge.

## Limitations

- AI judges can be biased or inconsistent.
- Translation may introduce errors.
- Consistency does not prove factual correctness.
- Browser voice support varies.
- Static client-side BYOK is appropriate for testing, but production deployments should put secret provider credentials behind a secure backend proxy.
- Dialect studies should include native-speaker review.

## Suggested citation

> Think Innovative Creations (TIC). *VIHAA LINGUA-360: A Global AI Language Intelligence Observatory.* Methodology version 1.0, 2026.

## Brand

Built by **TIC - Think Innovative Creations**.
