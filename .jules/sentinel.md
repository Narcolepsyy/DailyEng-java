## 2024-03-25 - Add Input Length Limit to Text-to-Speech Endpoint
**Vulnerability:** The `/speaking/speech/synthesize` endpoint, which is public without authentication, did not impose a limit on the input text length. This allowed attackers to send arbitrarily large texts to the Azure Speech Service API.
**Learning:** Third-party API calls, especially paid ones, must always have input length/size limits to prevent Server-Side Request Forgery cost exhaustion (Denial of Wallet) and Denial of Service vulnerabilities.
**Prevention:** Always add and enforce explicit size restrictions on user input at the controller boundary before forwarding data to external paid APIs.

## 2025-02-19 - [Missing Input Length Validation for External API Calls]
**Vulnerability:** External APIs like Azure Speech Service were taking an unbounded string `referenceText` directly from user request parameters, risking Denial of Service (DoS) and Denial of Wallet (Cost Exhaustion) through Server-Side Request Forgery.
**Learning:** External API dependencies charge by character count. Lacking a maximum length limitation in the controller causes unbound requests to third party services to execute, draining wallet resources or tying up threads in the backend system processing massive payload sizes.
**Prevention:** Always ensure any parameter (like `referenceText`) sent out to third party APIs (e.g. Azure, OpenAI, DeepL) validates input constraints on string length inside the `@RestController` endpoints prior to calling internal services.

## 2024-03-25 - Prevent DoS/SSRF Cost Exhaustion via Input Length Validation in Custom Scenarios/Chats
**Vulnerability:** Controller DTOs for Azure and Gemini endpoints (e.g., `SpeakingDtos.CreateCustomScenarioRequest.topicPrompt`, `SpeakingDtos.SubmitTurnRequest.userText`, `DoraraDtos.DoraraChatRequest.userMessage`) lacked max string length validation via `@Size(max=X)`. This allowed attackers to send arbitrarily large payloads through to paid external APIs (Azure Speech, Gemini), risking DoS and cost exhaustion.
**Learning:** External API dependencies charge by token/character count. Without strict constraints at the entry boundary (DTOs), unbound string properties on requests bypass the system and run up third-party costs or consume backend memory.
**Prevention:** Always add explicit input length constraints using `jakarta.validation.constraints.Size(max=...)` on DTO fields that get passed to third-party services.

## 2026-04-01 - [Input Validation] Missing input length limit on external API controller payloads
**Vulnerability:** The Spring Boot API mapped large string query/form parameters (`targetLanguage`) and passed them directly to downstream services (Azure Speech / Translator) or resolution functions.
**Learning:** Even internal helper functions mapping standard types (like language codes) can cause OutOfMemory errors, DoS attacks, or massive string allocation overheads if bad actors submit payloads with millions of characters to a REST controller that lacks length bounds.
**Prevention:** Add hardcoded string `.length()` checks (e.g., `> 50`) inside the controller at the entry point, or apply standard Spring `@Size(max=...)` annotations to enforce bounds on every string input, regardless of how "harmless" the field seems.

## 2026-05-11 - [Input Validation] Missing input validation in DoraraController DTOs
**Vulnerability:** The AI chat streaming endpoint (`/dorara/chat`) and the enrichment endpoint (`/dorara/enrich`) mapped raw JSON request bodies to unvalidated DTOs (`ChatRequest`, `EnrichRequest`).
**Learning:** These endpoints pass the user message and previous responses directly to the Gemini AI API. Without validation on properties like `userMessage` and `aiResponse`, an attacker could submit excessively large payloads. This exposes the system to Denial of Wallet (unbounded third-party token costs) and memory exhaustion/DoS.
**Prevention:** Always add `@Valid` to Spring controller `@RequestBody` parameters and annotate DTO string fields with `@Size(max=...)` limits, particularly when the data is passed to external AI services.
