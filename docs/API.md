# Kinetic Academy API Documentation

All API responses use the shared envelope:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": { "message": "Human readable", "code": "VALIDATION_ERROR" } }
```

## Error Codes

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `OTP_EXPIRED`
- `OTP_INVALID`
- `OTP_MAX_ATTEMPTS`
- `NOT_CONFIGURED`
- `INTERNAL_ERROR`

## AI Rate Limit

AI routes are limited to 20 requests per IP per 60 seconds by the in-memory MVP limiter. Replace this with Redis before multi-instance production.

## POST `/api/ai/feynman`

Grades a student explanation using Gemini when `GEMINI_API_KEY` exists; otherwise uses deterministic local rubric.

Request:

```json
{
  "topicTitle": "XOR Logic Gate",
  "providedExplanation": "XOR means exclusive OR. It returns true when exactly one input is true.",
  "userExplanation": "XOR is true when one input is on and the other is off. If both are same it returns false.",
  "subject": "ICT"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "provider": "google-gemini",
    "model": "gemini-2.5-flash",
    "data": {
      "score": 88,
      "missingConcepts": [],
      "misconceptions": [],
      "feedbackBangla": "দারুণ। তুমি সহজ ভাষায় মূল idea ধরেছো।",
      "status": "GOOD"
    }
  }
}
```

## POST `/api/ai/socratic`

Generates five progressive Socratic questions.

Request:

```json
{
  "topic": "Binary Place Value",
  "context": "Binary is base-2 and each left move doubles the place value."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "provider": "local-rubric",
    "model": "deterministic-v1",
    "data": {
      "questions": [
        "Binary Place Value conceptটা exist করার দরকার কেন?",
        "Under the hood Binary Place Value কীভাবে কাজ করে?",
        "Binary Place Value ভুল apply করলে কী failure হতে পারে?",
        "Alternative approach থাকলে Binary Place Value কেন better বা worse হতে পারে?",
        "Extreme exam conditionে Binary Place Value test করতে কী scenario বানাবে?"
      ]
    }
  }
}
```

## POST `/api/ai/socratic/evaluate`

Evaluates one Socratic defense answer.

Request:

```json
{
  "question": "Binary place value exist করার দরকার কেন?",
  "answer": "Because computers store signals as on/off states, so base-2 maps directly to hardware states."
}
```

Response:

```json
{
  "success": true,
  "data": {
    "provider": "google-gemini",
    "model": "gemini-2.5-flash",
    "data": {
      "logicGaps": [],
      "defenseScore": 84,
      "feedbackBangla": "সুন্দর logic defense।",
      "idealAnswerBangla": "Strong answer purpose, mechanism, and edge case দিয়ে তৈরি হয়।"
    }
  }
}
```

## POST `/api/ai/first-principles`

Checks whether a student can reconstruct a claim from axioms.

Request:

```json
{
  "topic": "XOR Logic Gate",
  "claim": "XOR detects difference because it is true only when exactly one input is active.",
  "axioms": [
    "Logic gates map input signals to one output.",
    "OR is true if one or both inputs are active.",
    "Exclusive OR removes the both-active case."
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "provider": "local-rubric",
    "model": "deterministic-v1",
    "data": {
      "score": 91,
      "passedAxioms": ["Logic gates map input signals to one output."],
      "missingAxioms": [],
      "synthesisFeedback": "Strong reconstruction.",
      "status": "PASSED"
    }
  }
}
```

## POST `/api/ai/chat`

Kino AI assistant response.

Request:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Why does XOR reject both true?"
    }
  ],
  "examType": "IBA",
  "activeTopic": "XOR Logic Gate",
  "workspaceState": { "mode": "learning-lab", "energy": 68, "streak": 15 }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "provider": "google-gemini",
    "model": "gemini-2.5-flash",
    "data": {
      "reply": "XOR means exclusive OR, তাই both true হলে exclusive condition ভেঙে যায়।",
      "suggestedAction": "Open Feynman mode and explain it in one sentence."
    }
  }
}
```

## Auth Routes

Existing auth routes:

- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/auth/me`

These use Zod validation, OTP hashing, cooldowns, retry limits, JWT cookies, and RBAC helpers.
