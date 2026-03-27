## 2024-03-25 - Add Input Length Limit to Text-to-Speech Endpoint
**Vulnerability:** The `/speaking/speech/synthesize` endpoint, which is public without authentication, did not impose a limit on the input text length. This allowed attackers to send arbitrarily large texts to the Azure Speech Service API.
**Learning:** Third-party API calls, especially paid ones, must always have input length/size limits to prevent Server-Side Request Forgery cost exhaustion (Denial of Wallet) and Denial of Service vulnerabilities.
**Prevention:** Always add and enforce explicit size restrictions on user input at the controller boundary before forwarding data to external paid APIs.
## 2024-05-19 - DoS via Azure Speech Service `referenceText`
**Vulnerability:** The `/speaking/speech/transcribe-assess` and `/speaking/speech/pronunciation` endpoints accepted unbounded input for the `referenceText` parameter, passing it directly to the paid external Azure Speech Service.
**Learning:** External API dependencies are vulnerable to Server-Side Request Forgery cost exhaustion (Denial of Wallet) and Denial of Service (DoS) attacks if user-supplied text lengths are not constrained.
**Prevention:** Always validate and limit the length of string parameters that are sent to external services (e.g., Azure Speech, translation APIs) to an expected maximum (e.g., 5000 chars).
