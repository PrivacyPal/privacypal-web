# PrivacyPal SDK for Node.js

**Package:** `@privacypal/sdk`  
**Version:** 1.0.0  
**License:** MIT  
**Module System:** ES Modules  
**Runtime:** Node.js 18+, Browser (Chrome Extensions, Web Apps)

---

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [PrivacyPalClient](#privacypalclient)
  - [PrivacyPalClientNLP](#privacypalclientnlp)
  - [EntityDetector](#entitydetector)
  - [IntelligentDecoder](#intelligentdecoder)
  - [ConversationSession](#conversationsession)
  - [Session Manager](#session-manager)
- [Type Reference](#type-reference)
- [Guides](#guides)
  - [Encoding Sensitive Data](#encoding-sensitive-data)
  - [Batch Encoding](#batch-encoding)
  - [Decoding Privacy Twins](#decoding-privacy-twins)
  - [File Encoding](#file-encoding)
  - [AI Chat with Privacy Protection](#ai-chat-with-privacy-protection)
  - [Streaming AI Chat](#streaming-ai-chat)
  - [Multi-Turn Conversations](#multi-turn-conversations)
  - [Local Decoding (Offline)](#local-decoding-offline)
  - [Client-Side Entity Detection](#client-side-entity-detection)
  - [Custom Intelligent Decoding](#custom-intelligent-decoding)
  - [User & Account Management](#user--account-management)
  - [Token Management](#token-management)
- [Error Handling](#error-handling)
- [Configuration Reference](#configuration-reference)
- [Changelog](#changelog)

---

## Introduction

The PrivacyPal SDK enables Node.js applications to detect, encode, and decode sensitive data (PII/PHI/PCI) using **Privacy Twins** technology. Privacy Twins are synthetic values that replace real sensitive data while preserving format, structure, and utility — allowing your application to safely process, store, and transmit data through third-party services (LLMs, analytics, logs, etc.) without exposing real personal information.

### Key Capabilities

- **Encode** — Detect PII in text and replace it with synthetic Privacy Twins
- **Decode** — Restore original values from Privacy Twins with full audit trail
- **Batch Processing** — Encode multiple records in a single request
- **File Encoding** — Process files (PDF, DOCX, CSV, images) for PII detection
- **AI Chat** — Send prompts to LLMs (Gemini, GPT, Claude) with automatic PII protection
- **Streaming** — Real-time streaming AI responses with Server-Sent Events
- **Multi-Turn Conversations** — Track Privacy Twin mappings across conversation turns
- **Local Decoding** — Decode Privacy Twins offline using stored transformations
- **Client-Side NLP** — Optional local entity detection with winkNLP

---

## Installation

```bash
npm install @privacypal/sdk
```

### Peer Dependencies

The SDK uses the following runtime dependencies (installed automatically):

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.7.7 | HTTP client |
| `fuse.js` | ^7.1.0 | Fuzzy search for intelligent decoding |
| `wink-nlp` | ^2.4.0 | Client-side NLP (optional) |
| `wink-eng-lite-web-model` | ^1.8.1 | English NLP model (optional) |

---

## Quick Start

```typescript
import { PrivacyPalClient } from '@privacypal/sdk';

// 1. Initialize the client with your API URL and user's JWT token
const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: 'your-jwt-token'
});

// 2. Encode sensitive data
const encoded = await client.encode({
  data: 'Contact John Doe at john.doe@company.com, SSN: 123-45-6789'
});

console.log(encoded.encodedData);
// Output: "Contact Maria Garcia at maria.garcia@example.net, SSN: 987-65-4321"

console.log(encoded.continuationId);
// Output: "cont-7f3a-4b2c-9d1e-8f6a5c3b2d1e"

console.log(encoded.transformations);
// Output: [{ entityType: "PERSON", original: "John Doe", twin: "Maria Garcia", ... }, ...]

// 3. Decode back to original values
const decoded = await client.decode({
  continuationId: encoded.continuationId,
  data: encoded.encodedData,
  sensitiveHashes: encoded.transformations.map(t => t.originalHash),
  authorization: {
    token: 'your-jwt-token',
    purpose: 'Customer support ticket #12345'
  }
});

console.log(decoded.decodedData);
// Output: "Contact John Doe at john.doe@company.com, SSN: 123-45-6789"
```

---

## Authentication

The SDK requires an authenticated user's JWT token. There is no anonymous or demo mode.

### Obtaining a Token

Use the `login()` or `register()` methods to obtain a JWT:

```typescript
// Create client without apiKey for login/register
const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: '' // Empty for unauthenticated endpoints
});

// Login
const loginResult = await client.login('user@example.com', 'password');
console.log(loginResult.data.token); // JWT token

// Update the client with the token
client.updateApiKey(loginResult.data.token);
```

### Token Refresh

When tokens expire, refresh them using:

```typescript
const refreshResult = await client.refreshUserToken(currentToken);
// Update client with new token
client.updateApiKey(refreshResult.data.token);
```

### Token Refresh Callback

For automatic token management, provide a callback:

```typescript
const client = new PrivacyPalClient(
  { apiUrl: 'https://api.privacypal.io', apiKey: token },
  (newToken) => {
    // Called when your app refreshes the token
    console.log('Token updated:', newToken);
    saveTokenToStorage(newToken);
  }
);
```

---

## Core Concepts

### Privacy Twins

A Privacy Twin is a synthetic value that replaces a real PII value. For example:

| Original (Real PII) | Privacy Twin (Synthetic) |
|---------------------|-------------------------|
| John Doe | Maria Garcia |
| 123-45-6789 | 987-65-4321 |
| john@company.com | maria.garcia@example.net |
| 03/15/1990 | 07/22/1988 |
| Tampa, FL | Portland, OR |

Privacy Twins preserve the **format** and **data type** of the original, allowing downstream systems (LLMs, analytics, etc.) to process them normally without access to real sensitive data.

### Continuation ID

Every encoding operation returns a `continuationId` — a unique identifier that correlates the encoding session. Use this ID to:

- **Decode** twins back to originals
- **Retrieve** all twins in a dataset
- **Audit** who accessed what data

### Transformations

Each detected PII entity produces a `Transformation` object containing:

- `originalHash` / `twinHash` — Cryptographic hashes of the values
- `entityType` — What kind of PII it is (e.g., `"PERSON"`, `"US_SSN"`)
- `original` / `twin` — The actual values (when available for local decoding)
- `components` — Sub-part breakdowns (e.g., first name, last name, city, state)

---

## API Reference

### PrivacyPalClient

The primary SDK client for all PrivacyPal API interactions.

#### Constructor

```typescript
new PrivacyPalClient(config: PrivacyPalConfig, onTokenRefresh?: (newToken: string) => void)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `PrivacyPalConfig` | Yes | Client configuration |
| `config.apiUrl` | `string` | Yes | API base URL |
| `config.apiKey` | `string` | Yes | JWT token (can be empty for login/register) |
| `config.timeout` | `number` | No | Request timeout in ms (default: 30000) |
| `onTokenRefresh` | `function` | No | Callback when token is refreshed |

**Example:**

```typescript
import { PrivacyPalClient } from '@privacypal/sdk';

const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: 'eyJhbGciOiJIUzI1NiIs...',
  timeout: 60000
});
```

---

#### `encode(params)`

Encode sensitive data by detecting PII and replacing it with Privacy Twins.

```typescript
encode(params: EncodeSingleParams): Promise<EncodeResponse>
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `string` | — | **Required.** Input text containing potential PII |
| `sourceContainer` | `string` | `"sdk_data"` | Source identifier (e.g., `"customer_db.users"`) |
| `sourceElement` | `string` | `"text_input"` | Element identifier (e.g., `"personal_info"`) |
| `metadata` | `EncodingMetadata` | `{}` | Additional metadata for audit trail |
| `scoreThreshold` | `number` | `0.35` | Detection confidence threshold (0.0 – 1.0) |
| `language` | `string` | `"en"` | Language code |
| `continuationId` | `string` | — | Optional correlation ID |

**Returns:** `Promise<EncodeResponse>`

**Example:**

```typescript
const result = await client.encode({
  data: 'John Doe, SSN: 123-45-6789, email: john@company.com',
  sourceContainer: 'customer_db.users',
  sourceElement: 'personal_info',
  metadata: {
    rowId: '1001',
    source: 'crm_system'
  },
  scoreThreshold: 0.35,
  language: 'en'
});

// result:
// {
//   success: true,
//   encodedData: "Maria Garcia, SSN: 987-65-4321, email: maria.garcia@example.net",
//   continuationId: "cont-7f3a-4b2c-9d1e-8f6a5c3b2d1e",
//   transformations: [
//     {
//       originalHash: "a1b2c3d4...",
//       twinHash: "f6e5d4c3...",
//       entityType: "PERSON",
//       catalogItemId: "cat-001",
//       position: { start: 0, end: 8 },
//       score: 0.95,
//       original: "John Doe",
//       twin: "Maria Garcia",
//       components: [
//         { original: "John", twin: "Maria", type: "FIRST_NAME" },
//         { original: "Doe", twin: "Garcia", type: "LAST_NAME" }
//       ]
//     },
//     {
//       originalHash: "b2c3d4e5...",
//       twinHash: "e5d4c3b2...",
//       entityType: "US_SSN",
//       catalogItemId: "cat-002",
//       score: 1.0
//     },
//     {
//       originalHash: "c3d4e5f6...",
//       twinHash: "d4c3b2a1...",
//       entityType: "EMAIL_ADDRESS",
//       catalogItemId: "cat-003",
//       score: 1.0
//     }
//   ],
//   statistics: {
//     originalLength: 52,
//     encodedLength: 64,
//     piiEntitiesDetected: 3,
//     transformationsApplied: 3,
//     processingTimeMs: 245
//   }
// }
```

---

#### `encodeBatch(params)`

Encode multiple data items in a single request. All items share one `continuationId`.

```typescript
encodeBatch(params: EncodeBatchParams): Promise<EncodeBatchResponse>
```

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `items` | `Array<EncodeSingleParams>` | **Required.** Array of items to encode (without `continuationId`) |

**Returns:** `Promise<EncodeBatchResponse>`

**Example:**

```typescript
const result = await client.encodeBatch({
  items: [
    {
      data: 'Alice Smith, alice@email.com',
      sourceContainer: 'users',
      metadata: { rowId: '1' }
    },
    {
      data: 'Bob Jones, 555-123-4567',
      sourceContainer: 'users',
      metadata: { rowId: '2' }
    }
  ]
});

// result:
// {
//   success: true,
//   continuationId: "cont-batch-8a9b-1c2d",
//   results: [
//     {
//       success: true,
//       encodedData: "Clara Johnson, clara.j@sample.net",
//       continuationId: "cont-batch-8a9b-1c2d",
//       transformations: [...],
//       statistics: { piiEntitiesDetected: 2, processingTimeMs: 180, ... }
//     },
//     {
//       success: true,
//       encodedData: "Daniel Rivera, 555-987-6543",
//       continuationId: "cont-batch-8a9b-1c2d",
//       transformations: [...],
//       statistics: { piiEntitiesDetected: 2, processingTimeMs: 165, ... }
//     }
//   ],
//   statistics: {
//     itemsProcessed: 2,
//     totalProcessingTimeMs: 345,
//     averageTimePerItemMs: 172
//   }
// }
```

---

#### `decode(params)`

Decode Privacy Twins back to original sensitive values. Creates an audit trail entry.

```typescript
decode(params: DecodeParams): Promise<DecodeResponse>
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `continuationId` | `string` | Yes | From the encoding response |
| `data` | `string` | Yes | Text containing Privacy Twins |
| `sensitiveHashes` | `string[]` | Yes | Original value hashes to decode |
| `authorization.token` | `string` | Yes | JWT or authorization token |
| `authorization.purpose` | `string` | Yes | Reason for accessing data |
| `authorization.type` | `string` | No | Auth type (default: `"jwt"`) |

**Returns:** `Promise<DecodeResponse>`

**Example:**

```typescript
const decoded = await client.decode({
  continuationId: 'cont-7f3a-4b2c-9d1e-8f6a5c3b2d1e',
  data: 'Maria Garcia, SSN: 987-65-4321, email: maria.garcia@example.net',
  sensitiveHashes: [
    'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7',
    'c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8'
  ],
  authorization: {
    token: 'eyJhbGciOiJIUzI1NiIs...',
    purpose: 'Customer support ticket #12345',
    type: 'jwt'
  }
});

// decoded:
// {
//   success: true,
//   decodedData: "John Doe, SSN: 123-45-6789, email: john@company.com",
//   transformations: [
//     { twin: "Maria Garcia", original: "John Doe", entityType: "PERSON", decrypted: true },
//     { twin: "987-65-4321", original: "123-45-6789", entityType: "US_SSN", decrypted: true },
//     { twin: "maria.garcia@example.net", original: "john@company.com", entityType: "EMAIL_ADDRESS", decrypted: true }
//   ],
//   continuationId: "cont-7f3a-4b2c-9d1e-8f6a5c3b2d1e",
//   auditLog: {
//     accessedBy: "jane.smith@example.com",
//     timestamp: "2026-02-12T18:45:00.000Z",
//     purpose: "Customer support ticket #12345",
//     transformationsCount: 3
//   },
//   statistics: {
//     originalLength: 64,
//     decodedLength: 52,
//     twinsDecoded: 3,
//     processingTimeMs: 120
//   }
// }
```

---

#### `getDatasetTwins(continuationId)`

Retrieve all Privacy Twins for a specific dataset.

```typescript
getDatasetTwins(continuationId: string): Promise<GetDatasetTwinsResponse>
```

**Example:**

```typescript
const twins = await client.getDatasetTwins('cont-7f3a-4b2c-9d1e-8f6a5c3b2d1e');

// twins:
// {
//   success: true,
//   continuationId: "cont-7f3a-4b2c-9d1e-8f6a5c3b2d1e",
//   twins: [
//     {
//       catalogItemId: "cat-001",
//       originalHash: "a1b2c3d4...",
//       twinHash: "f6e5d4c3...",
//       entityType: "PERSON",
//       category: "PII",
//       sourceContainer: "customer_db.users",
//       sourceElement: "personal_info",
//       timestamp: 1739389500000
//     }
//   ],
//   count: 4
// }
```

---

#### `encodeFile(params)`

Encode a file by uploading it for server-side processing and PII detection. Supports PDF, DOCX, CSV, images, and more.

```typescript
encodeFile(params: EncodeFileParams): Promise<EncodeFileResponse>
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `file` | `Blob \| ArrayBuffer` | — | **Required.** File content |
| `fileName` | `string` | — | **Required.** Original file name |
| `processImages` | `boolean` | `true` | Convert images to markdown (`true`) or bypass (`false`) |
| `platform` | `string` | — | Platform identifier |
| `continuationId` | `string` | — | Optional session grouping ID |

**Returns:** `Promise<EncodeFileResponse>`

**Example (Node.js):**

```typescript
import { readFileSync } from 'fs';

const fileBuffer = readFileSync('./customer-report.pdf');
const blob = new Blob([fileBuffer], { type: 'application/pdf' });

const result = await client.encodeFile({
  file: blob,
  fileName: 'customer-report.pdf',
  processImages: true,
  platform: 'node_sdk'
});

// result:
// {
//   success: true,
//   encodedFile: "base64-encoded-content...",
//   continuationId: "cont-file-9x8y-7z6w",
//   transformations: [...],
//   mimeType: "text/markdown",
//   fileName: "customer-report.pdf.md",
//   originalContent: "Original extracted text...",
//   encodedContent: "Text with Privacy Twins...",
//   imageBypassed: false
// }

// Decode the file content from base64
const decodedContent = Buffer.from(result.encodedFile, 'base64').toString('utf-8');
```

---

#### `chatWithAI(params)`

Send a prompt to an LLM with automatic PII encoding/decoding. Your prompt is encoded before reaching the LLM, and the LLM's response is decoded back to original values.

```typescript
chatWithAI(params: AIChatParams): Promise<AIChatResponse>
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | `string` | — | **Required.** User prompt (will be encoded) |
| `conversationHistory` | `ConversationMessage[]` | `[]` | Previous messages for context |
| `sessionId` | `string` | — | Session tracking ID |
| `sessionContinuationIds` | `string[]` | — | Prior turn continuation IDs for multi-turn decoding |
| `model` | `string` | — | LLM model name (e.g., `"gemini-2.0-flash-exp"`) |
| `provider` | `string` | — | LLM provider (`"vertex"`, `"aws"`, `"mock"`) |
| `temperature` | `number` | `0.7` | Generation temperature (0.0 – 1.0) |
| `maxTokens` | `number` | `2048` | Max tokens in response |

**Returns:** `Promise<AIChatResponse>`

**Example:**

```typescript
const result = await client.chatWithAI({
  prompt: 'Analyze credit history for John Doe at john@company.com',
  model: 'gemini-2.0-flash-exp',
  provider: 'vertex',
  temperature: 0.7,
  maxTokens: 2048
});

// What happened internally:
console.log(result.originalPrompt);
// "Analyze credit history for John Doe at john@company.com"

console.log(result.encodedPrompt);
// "Analyze credit history for Maria Garcia at maria.garcia@example.net"
// ^ This is what the LLM actually saw — no real PII exposed

console.log(result.llmResponse);
// "Based on the credit history for Maria Garcia..." (LLM response with twins)

console.log(result.decodedResponse);
// "Based on the credit history for John Doe..." (final response with originals)

console.log(result.llm);
// { model: "gemini-2.0-flash-exp", provider: "vertex", finishReason: "stop",
//   metadata: { promptTokens: 245, completionTokens: 512, totalTokens: 757 } }

console.log(result.processingTimeMs);
// 3450
```

---

#### `chatWithAIStream(params, onUpdate)`

Streaming AI chat with real-time response chunks via Server-Sent Events.

```typescript
chatWithAIStream(
  params: AIChatParams,
  onUpdate: (update: StreamUpdate) => void
): Promise<AIChatResponse>
```

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `params` | `AIChatParams` | Same as `chatWithAI()` |
| `onUpdate` | `function` | Callback for each streaming event |

**Stream Event Types:**

| Type | Description | Data |
|------|-------------|------|
| `encoding_complete` | PII encoding finished | `{ continuationId, transformations }` |
| `llm_chunk` | Partial LLM response | `{ chunk: string }` |
| `llm_complete` | Full LLM response assembled | `{ fullResponse: string }` |
| `complete` | Processing finished | Full `AIChatResponse` |
| `error` | Error occurred | `{ error: string }` |

**Example:**

```typescript
let fullResponse = '';

const result = await client.chatWithAIStream(
  {
    prompt: 'Summarize the account for Jane Smith, SSN 234-56-7890',
    model: 'gemini-2.0-flash-exp'
  },
  (update) => {
    switch (update.type) {
      case 'encoding_complete':
        console.log('Encoding done, continuation:', update.data.continuationId);
        break;
      case 'llm_chunk':
        process.stdout.write(update.data.chunk); // Real-time output
        fullResponse += update.data.chunk;
        break;
      case 'llm_complete':
        console.log('\nLLM finished.');
        break;
      case 'complete':
        console.log('Final decoded response:', update.data.decodedResponse);
        break;
      case 'error':
        console.error('Stream error:', update.data.error);
        break;
    }
  }
);

console.log('Processing time:', result.processingTimeMs, 'ms');
```

---

#### `getAIProviders()`

Get available AI providers and models.

```typescript
getAIProviders(): Promise<ProviderInfo>
```

**Example:**

```typescript
const providers = await client.getAIProviders();

// providers:
// {
//   success: true,
//   name: "vertex",
//   models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
//   current: "vertex"
// }
```

---

#### `storeContinuation(continuationId, data)`

Store transformation data locally for offline decoding.

```typescript
storeContinuation(
  continuationId: string,
  data: {
    continuationId: string;
    transformations: Transformation[];
    originalMessage?: string;
  }
): void
```

**Example:**

```typescript
// After encoding, store transformations for later local decoding
const encoded = await client.encode({ data: 'John Doe lives in Tampa, FL' });

client.storeContinuation(encoded.continuationId, {
  continuationId: encoded.continuationId,
  transformations: encoded.transformations,
  originalMessage: 'John Doe lives in Tampa, FL'
});
```

---

#### `getStoredContinuation(continuationId)`

Retrieve stored continuation data.

```typescript
getStoredContinuation(continuationId: string): {
  continuationId: string;
  transformations: Transformation[];
  originalMessage?: string;
} | null
```

**Example:**

```typescript
const stored = client.getStoredContinuation('cont-7f3a-4b2c-9d1e');
if (stored) {
  console.log('Found', stored.transformations.length, 'transformations');
}
```

---

#### `decodeLocal(text, continuationId)`

Decode Privacy Twins locally using stored transformations — no API call required. Uses the `IntelligentDecoder` internally for fuzzy matching.

```typescript
decodeLocal(text: string, continuationId: string): string
```

**Example:**

```typescript
// Assume transformations are stored from a previous encode
const decoded = client.decodeLocal(
  'Hello Maria Garcia, your appointment in Portland, OR is confirmed.',
  'cont-7f3a-4b2c-9d1e'
);
// Returns: "Hello John Doe, your appointment in Tampa, FL is confirmed."
```

---

#### `clearContinuation(continuationId?)`

Clear stored continuation data.

```typescript
clearContinuation(continuationId?: string): void
```

**Example:**

```typescript
// Clear specific continuation
client.clearContinuation('cont-7f3a-4b2c-9d1e');

// Clear all stored continuations
client.clearContinuation();
```

---

#### `invalidateContinuationCache(continuationId)`

Invalidate the in-memory cache for a continuation so the next read fetches fresh data from sessionStorage.

```typescript
invalidateContinuationCache(continuationId: string): void
```

---

#### `updateApiKey(newApiKey)`

Update the API key (JWT token) used for requests.

```typescript
updateApiKey(newApiKey: string): void
```

---

#### `updateApiUrl(newApiUrl)`

Update the API base URL.

```typescript
updateApiUrl(newApiUrl: string): void
```

---

#### `getConfig()`

Get the current client configuration (read-only).

```typescript
getConfig(): Readonly<PrivacyPalConfig>
```

---

#### `healthCheck()`

Check API connectivity.

```typescript
healthCheck(): Promise<{ success: boolean; status?: number; data?: any; error?: string }>
```

**Example:**

```typescript
const health = await client.healthCheck();
// { success: true, status: 200, data: "success" }
```

---

#### `login(email, password)`

Authenticate a user. Does not require an existing API key.

```typescript
login(email: string, password: string): Promise<any>
```

**Example:**

```typescript
const result = await client.login('user@example.com', 'password123');

// result:
// {
//   code: 200,
//   data: {
//     id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
//     email: "user@example.com",
//     firstName: "Jane",
//     lastName: "Smith",
//     token: "eyJhbGciOiJIUzI1NiIs..."
//   }
// }

// Use the token for subsequent requests
client.updateApiKey(result.data.token);
```

---

#### `register(firstName, lastName, email, password)`

Register a new user. Does not require an existing API key.

```typescript
register(firstName: string, lastName: string, email: string, password: string): Promise<any>
```

**Example:**

```typescript
const result = await client.register('Jane', 'Smith', 'jane@example.com', 'SecureP@ss1');

// result:
// {
//   token: "eyJhbGciOiJIUzI1NiIs...",
//   newUserId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
//   email: "jane@example.com"
// }

client.updateApiKey(result.token);
```

---

#### `refreshUserToken(token)`

Refresh an expired JWT token.

```typescript
refreshUserToken(token: string): Promise<any>
```

---

#### `getAccount()`

Get the authenticated user's account information.

```typescript
getAccount(): Promise<any>
```

**Example:**

```typescript
const account = await client.getAccount();

// account:
// {
//   id: "a1b2c3d4...",
//   email: "jane@example.com",
//   firstName: "Jane",
//   lastName: "Smith",
//   role: "admin",
//   tier: "pro",
//   status: "active",
//   trialActive: false,
//   companyId: "comp-1234-5678"
// }
```

---

#### `getUserStats(days?)`

Get user statistics.

```typescript
getUserStats(days?: number | null): Promise<any>
```

**Example:**

```typescript
// Last 7 days
const stats = await client.getUserStats(7);

// All time
const allTimeStats = await client.getUserStats(null);
```

---

#### `getUsage(days?)`

Get usage data.

```typescript
getUsage(days?: number): Promise<any>
```

---

#### `getCompany()`

Get company information.

```typescript
getCompany(): Promise<any>
```

---

#### `generateInviteLink()`

Generate a team invite link.

```typescript
generateInviteLink(): Promise<any>
```

---

#### `updateAuditTokens(params)`

Update audit log entries with LLM token usage.

```typescript
updateAuditTokens(params: {
  continuationId: string;
  tokensIn?: number;
  tokensOut?: number;
  model?: string | null;
}): Promise<{ success: boolean; data?: any }>
```

**Example:**

```typescript
await client.updateAuditTokens({
  continuationId: 'cont-ai-5f6g-7h8i',
  tokensIn: 245,
  tokensOut: 512,
  model: 'gemini-2.0-flash-exp'
});
```

---

### PrivacyPalClientNLP

Extended client with client-side NLP entity detection capabilities. Extends `PrivacyPalClient` with local detection powered by winkNLP.

#### Constructor

```typescript
new PrivacyPalClientNLP(config: ExtendedConfig, onTokenRefresh?: (newToken: string) => void)
```

**Additional Config:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `useClientSideNLP` | `boolean` | `true` | Enable client-side NLP detection |
| `detectorConfig.useNLP` | `boolean` | `true` | Use winkNLP engine |
| `detectorConfig.usePatterns` | `boolean` | `true` | Use regex pattern matching |
| `detectorConfig.useFuzzy` | `boolean` | `true` | Use fuzzy matching |
| `detectorConfig.minConfidence` | `number` | `0.7` | Minimum detection confidence |

#### Factory Function

```typescript
import { createPrivacyPalClientWithNLP } from '@privacypal/sdk';

const client = await createPrivacyPalClientWithNLP({
  apiUrl: 'https://api.privacypal.io',
  apiKey: 'your-jwt-token',
  useClientSideNLP: true,
  detectorConfig: {
    useNLP: true,
    usePatterns: true,
    useFuzzy: true,
    minConfidence: 0.7
  }
});
```

#### `detectEntitiesLocal(text)`

Detect PII entities locally without making an API call.

```typescript
detectEntitiesLocal(text: string): Promise<DetectedEntity[]>
```

**Example:**

```typescript
const entities = await client.detectEntitiesLocal(
  'John Doe lives at 123 Main St, Tampa FL 33601. Email: john@example.com'
);

// entities:
// [
//   { entityType: "PERSON", text: "John Doe", start: 0, end: 8, score: 0.92, method: "nlp" },
//   { entityType: "LOCATION", text: "123 Main St, Tampa FL 33601", start: 18, end: 45, score: 0.85, method: "nlp" },
//   { entityType: "EMAIL_ADDRESS", text: "john@example.com", start: 54, end: 70, score: 1.0, method: "pattern" }
// ]
```

---

### EntityDetector

Standalone client-side entity detector using a hybrid approach: winkNLP + regex patterns + fuzzy matching.

#### Constructor

```typescript
new EntityDetector(config?: EntityDetectorConfig)
```

#### Factory Function

```typescript
import { createEntityDetector } from '@privacypal/sdk';

const detector = await createEntityDetector({
  useNLP: true,
  usePatterns: true,
  useFuzzy: true,
  minConfidence: 0.6
});
```

#### `initialize()`

Initialize the NLP engine (must be called before `detectEntities()`).

```typescript
initialize(): Promise<void>
```

#### `detectEntities(text)`

Detect entities in text.

```typescript
detectEntities(text: string): Promise<DetectedEntity[]>
```

**Example:**

```typescript
import { createEntityDetector } from '@privacypal/sdk';

const detector = await createEntityDetector();

const entities = await detector.detectEntities(
  'Call me at 555-123-4567 or email sarah.connor@skynet.com'
);

// entities:
// [
//   { entityType: "PHONE_NUMBER", text: "555-123-4567", start: 11, end: 23, score: 1.0, method: "pattern" },
//   { entityType: "EMAIL_ADDRESS", text: "sarah.connor@skynet.com", start: 33, end: 56, score: 1.0, method: "pattern" }
// ]
```

---

### IntelligentDecoder

Advanced decoder with fuzzy matching and NLP for robust Privacy Twin decoding. Handles cases where AI models reformat names, dates, or addresses.

#### Constructor

```typescript
new IntelligentDecoder(config?: DecoderConfig)
```

**Config:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fuzzyThreshold` | `number` | `0.8` | Minimum fuzzy match score (0–1) |
| `caseInsensitive` | `boolean` | `true` | Case-insensitive matching |
| `partialMatch` | `boolean` | `true` | Partial word matching |

#### `decode(text, mappings, componentMappings?)`

Decode text using multi-pass intelligent matching.

```typescript
decode(
  text: string,
  mappings: TwinMapping[],
  componentMappings?: { date?: TwinMapping[]; location?: TwinMapping[] }
): string
```

#### Standalone Helper Function

```typescript
import { intelligentDecode } from '@privacypal/sdk';

const decoded = intelligentDecode(
  'Hello Maria, your appointment in Portland is confirmed.',
  [
    { original: 'John Doe', twin: 'Maria Garcia', entityType: 'PERSON' },
    { original: 'Tampa, FL', twin: 'Portland, OR', entityType: 'LOCATION' }
  ],
  {
    location: [
      { original: 'Tampa', twin: 'Portland', entityType: 'CITY' },
      { original: 'FL', twin: 'OR', entityType: 'STATE' }
    ]
  }
);
// Returns: "Hello John Doe, your appointment in Tampa is confirmed."
```

---

### ConversationSession

Manages Privacy Twin mappings across an entire multi-turn conversation. Critical for decoding responses where the AI references entities from earlier turns.

#### Constructor

```typescript
new ConversationSession(sessionId?: string)
```

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `addTurn(result)` | `void` | Add transformations from a new conversation turn |
| `getAllHashes()` | `string[]` | Get all original hashes from the entire session |
| `getAllDateComponents()` | `DateComponentMapping[]` | Get all date component mappings |
| `getAllLocationComponents()` | `LocationComponentMapping[]` | Get all location component mappings |
| `getContinuationIds()` | `string[]` | Get all continuation IDs for this session |
| `getSessionId()` | `string` | Get session ID |
| `getTurnNumber()` | `number` | Get current turn number |
| `clear()` | `void` | Clear session (start fresh) |

**Example:**

```typescript
import { ConversationSession } from '@privacypal/sdk';

const session = new ConversationSession('chat-001');

// Turn 1
const turn1 = await client.chatWithAI({
  prompt: 'What is the credit score for John Doe?',
  sessionId: session.getSessionId()
});

session.addTurn({
  transformations: turn1.encoding.transformations,
  continuationId: turn1.continuationId
});

// Turn 2 — references John Doe from Turn 1
const turn2 = await client.chatWithAI({
  prompt: 'What about his mortgage history?',
  sessionId: session.getSessionId(),
  sessionContinuationIds: session.getContinuationIds(),
  conversationHistory: [
    { role: 'user', content: turn1.encodedPrompt, encoded: true },
    { role: 'assistant', content: turn1.llmResponse }
  ]
});

session.addTurn({
  transformations: turn2.encoding.transformations,
  continuationId: turn2.continuationId
});

console.log('Session has', session.getTurnNumber(), 'turns');
console.log('Total continuation IDs:', session.getContinuationIds());
```

---

### Session Manager

Singleton for tracking multiple active conversation sessions.

```typescript
import { sessionManager } from '@privacypal/sdk';
```

| Method | Returns | Description |
|--------|---------|-------------|
| `getOrCreateSession(sessionId?)` | `ConversationSession` | Get existing or create new session |
| `getSession(sessionId)` | `ConversationSession \| undefined` | Get session by ID |
| `clearSession(sessionId)` | `void` | Clear and remove a session |

**Example:**

```typescript
import { sessionManager } from '@privacypal/sdk';

// Get or create a session
const session = sessionManager.getOrCreateSession('user-chat-001');

// Later, retrieve the same session
const sameSession = sessionManager.getOrCreateSession('user-chat-001');
console.log(session === sameSession); // true

// Clean up when conversation ends
sessionManager.clearSession('user-chat-001');
```

---

## Type Reference

### Configuration Types

```typescript
interface PrivacyPalConfig {
  apiUrl: string;         // API base URL
  apiKey: string;         // JWT token
  timeout?: number;       // Request timeout in ms (default: 30000)
}

interface ExtendedConfig extends PrivacyPalConfig {
  useClientSideNLP?: boolean;    // Enable local NLP (default: true)
  detectorConfig?: EntityDetectorConfig;
}

interface EntityDetectorConfig {
  useNLP?: boolean;        // Use winkNLP (default: true)
  usePatterns?: boolean;   // Use regex patterns (default: true)
  useFuzzy?: boolean;      // Use fuzzy matching (default: true)
  minConfidence?: number;  // Minimum confidence (default: 0.6)
}

interface DecoderConfig {
  fuzzyThreshold?: number;   // Fuzzy match score 0–1 (default: 0.8)
  caseInsensitive?: boolean; // Case-insensitive (default: true)
  partialMatch?: boolean;    // Partial word matching (default: true)
}
```

### Encoding Types

```typescript
interface EncodeSingleParams {
  data: string;                    // Input text with potential PII
  sourceContainer?: string;        // Source identifier
  sourceElement?: string;          // Element identifier
  metadata?: EncodingMetadata;     // Additional metadata
  scoreThreshold?: number;         // Detection threshold (0.0–1.0)
  language?: string;               // Language code
  continuationId?: string;         // Correlation ID
}

interface EncodeBatchParams {
  items: Array<Omit<EncodeSingleParams, 'continuationId'>>;
}

interface EncodingMetadata {
  rowId?: string;
  sourceTable?: string;
  sourceColumn?: string;
  recordType?: string;
  source?: string;
  sourceDataType?: string;
  sourceDataKey?: string;
  sourceDataOutlet?: string;
  [key: string]: any;
}

interface EncodeResponse {
  success: boolean;
  encodedData: string;              // PII replaced with twins
  continuationId: string;           // For later decoding
  transformations: Transformation[];
  statistics: EncodingStatistics;
  message?: string;
}

interface EncodeBatchResponse {
  success: boolean;
  continuationId: string;
  results: EncodeResponse[];
  statistics: {
    itemsProcessed: number;
    totalProcessingTimeMs: number;
    averageTimePerItemMs: number;
  };
}

interface EncodeFileParams {
  file: Blob | ArrayBuffer;
  fileName: string;
  processImages?: boolean;    // default: true
  platform?: string;
  continuationId?: string;
}

interface EncodeFileResponse {
  success: boolean;
  encodedFile: string;         // Base64-encoded content
  continuationId: string;
  transformations: Transformation[];
  mimeType: string;
  fileName: string;
  originalContent?: string;
  encodedContent?: string;
  imageBypassed?: boolean;
}

interface Transformation {
  originalHash: string;
  twinHash: string;
  entityType: string;
  catalogItemId: string;
  position?: { start: number; end: number };
  score?: number;
  original?: string;
  twin?: string;
  components?: TransformationComponent[];
}

interface TransformationComponent {
  original: string;
  twin: string;
  type: string;    // "FIRST_NAME", "LAST_NAME", "CITY", "STATE", "DATE_FULL_FORMAT", etc.
}

interface EncodingStatistics {
  originalLength: number;
  encodedLength: number;
  piiEntitiesDetected: number;
  transformationsApplied: number;
  processingTimeMs: number;
}
```

### Decoding Types

```typescript
interface DecodeParams {
  continuationId: string;
  data: string;
  sensitiveHashes: string[];
  authorization: DecodeAuthorization;
}

interface DecodeAuthorization {
  token: string;
  purpose: string;
  type?: string;    // default: "jwt"
}

interface DecodeResponse {
  success: boolean;
  decodedData: string;
  transformations: DecodedTransformation[];
  continuationId: string;
  auditLog: AuditLog;
  statistics: DecodingStatistics;
  error?: string;
}

interface DecodedTransformation {
  twin: string;
  original: string;
  entityType: string;
  decrypted: boolean;
  catalogItemId?: string;
}

interface AuditLog {
  accessedBy: string;
  timestamp: string;
  purpose: string;
  transformationsCount: number;
}

interface DecodingStatistics {
  originalLength: number;
  decodedLength: number;
  twinsDecoded: number;
  processingTimeMs: number;
}
```

### AI Chat Types

```typescript
interface AIChatParams {
  prompt: string;
  conversationHistory?: ConversationMessage[];
  sessionId?: string;
  sessionContinuationIds?: string[];
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  encoded?: boolean;
}

interface AIChatResponse {
  success: boolean;
  originalPrompt: string;
  encodedPrompt: string;
  llmResponse: string;
  decodedResponse: string;
  continuationId: string;
  encoding: {
    transformations: Transformation[];
    statistics: EncodingStatistics;
  };
  llm: {
    model: string;
    provider: string;
    finishReason: string;
    metadata: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  decoding: {
    twinsDecoded: number;
    transformations: DecodedTransformation[];
  };
  processingTimeMs: number;
}

type StreamUpdateType =
  | 'encoding_complete'
  | 'llm_chunk'
  | 'llm_complete'
  | 'complete'
  | 'error';

interface StreamUpdate {
  type: StreamUpdateType;
  data: any;
}

interface ProviderInfo {
  success: boolean;
  name: string;
  models: string[];
  current: string;
}
```

### Dataset & Twin Types

```typescript
interface GetDatasetTwinsResponse {
  success: boolean;
  continuationId: string;
  twins: DataTwin[];
  count: number;
}

interface DataTwin {
  catalogItemId: string;
  originalHash: string;
  twinHash: string;
  entityType: string;
  category?: string;
  sourceContainer?: string;
  sourceElement?: string;
  timestamp?: number;
}
```

### Entity Detection Types

```typescript
interface DetectedEntity {
  entityType: string;
  text: string;
  start: number;
  end: number;
  score: number;
  method: 'nlp' | 'pattern' | 'fuzzy';
}
```

### Decoder Types

```typescript
interface TwinMapping {
  original: string;
  twin: string;
  entityType: string;
  componentType?: string;
}
```

### Session Types

```typescript
interface SessionTwinMapping {
  original: string;
  twin: string;
  originalHash: string;
  twinHash: string;
  entityType: string;
  turnNumber: number;
}

interface DateComponentMapping {
  original: string;
  twin: string;
  componentType: string;
}

interface LocationComponentMapping {
  original: string;
  twin: string;
  componentType: string;
}
```

### Error Types

```typescript
interface ApiError {
  success: false;
  error: string;
  message?: string;
  trialExpired?: boolean;
  requiresSubscription?: boolean;
}
```

---

## Guides

### Encoding Sensitive Data

The simplest use case: detect and replace PII in text.

```typescript
import { PrivacyPalClient } from '@privacypal/sdk';

const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: 'your-jwt-token'
});

// Encode a customer message before sending to a third-party analytics service
const encoded = await client.encode({
  data: 'Customer John Doe (john@acme.com) reported an issue with order #12345',
  sourceContainer: 'support_tickets',
  sourceElement: 'description',
  metadata: {
    source: 'zendesk',
    recordType: 'ticket'
  }
});

// Send encoded data safely to any third-party service
await analyticsService.track({
  event: 'support_ticket',
  message: encoded.encodedData // No real PII exposed
});

// Store the continuationId for later decoding
await db.saveContinuationId(ticketId, encoded.continuationId);
```

### Batch Encoding

Process multiple records efficiently in a single request.

```typescript
// Read customer records from database
const customers = await db.query('SELECT id, name, email, phone FROM customers LIMIT 100');

// Encode all records in one batch
const batchResult = await client.encodeBatch({
  items: customers.map(c => ({
    data: `${c.name}, ${c.email}, ${c.phone}`,
    sourceContainer: 'customers_table',
    metadata: { rowId: c.id.toString() }
  }))
});

console.log(`Processed ${batchResult.statistics.itemsProcessed} items`);
console.log(`Average: ${batchResult.statistics.averageTimePerItemMs}ms per item`);

// All items share the same continuationId
const continuationId = batchResult.continuationId;
```

### Decoding Privacy Twins

Restore original values when authorized access is needed.

```typescript
// Retrieve encoded data and continuationId
const ticket = await db.getTicket(ticketId);
const continuationId = await db.getContinuationId(ticketId);

// Decode with authorization and purpose tracking
const decoded = await client.decode({
  continuationId: continuationId,
  data: ticket.encodedDescription,
  sensitiveHashes: ticket.transformationHashes,
  authorization: {
    token: currentUserJwt,
    purpose: 'Resolving customer complaint #' + ticketId,
    type: 'jwt'
  }
});

// decoded.decodedData contains the original text
// decoded.auditLog records who accessed it and why
console.log('Decoded by:', decoded.auditLog.accessedBy);
console.log('Purpose:', decoded.auditLog.purpose);
```

### File Encoding

Process uploaded files (PDF, DOCX, CSV, images) for PII detection.

```typescript
import { readFileSync } from 'fs';

// Read the file
const buffer = readFileSync('./customer-report.pdf');
const blob = new Blob([buffer], { type: 'application/pdf' });

// Encode the file
const result = await client.encodeFile({
  file: blob,
  fileName: 'customer-report.pdf',
  processImages: true,
  platform: 'node_sdk'
});

if (result.success) {
  // Save encoded version
  const encodedContent = Buffer.from(result.encodedFile, 'base64');
  writeFileSync('./encoded-report.md', encodedContent);

  console.log('File encoded:', result.fileName);
  console.log('PII entities found:', result.transformations.length);
}
```

### AI Chat with Privacy Protection

Use any LLM safely without exposing real PII.

```typescript
const result = await client.chatWithAI({
  prompt: 'Write a formal letter to John Doe at 123 Main St, Tampa FL about his account #4567',
  model: 'gemini-2.0-flash-exp',
  provider: 'vertex'
});

// The LLM never saw real names or addresses
console.log('What the LLM received:', result.encodedPrompt);
// "Write a formal letter to Maria Garcia at 456 Oak Ave, Portland OR about her account #4567"

// The final response has real data restored
console.log('Final response:', result.decodedResponse);
// "Dear John Doe,\n\nWe are writing regarding your account at 123 Main St, Tampa FL..."
```

### Streaming AI Chat

Get real-time streaming responses for better UX.

```typescript
const chunks: string[] = [];

const result = await client.chatWithAIStream(
  {
    prompt: 'Analyze the financial profile of Jane Smith, SSN 234-56-7890',
    model: 'gemini-2.0-flash-exp'
  },
  (update) => {
    if (update.type === 'llm_chunk') {
      chunks.push(update.data.chunk);
      process.stdout.write(update.data.chunk); // Stream to terminal
    }
  }
);

console.log('\n\nFinal decoded response:', result.decodedResponse);
console.log('Tokens used:', result.llm.metadata.totalTokens);
```

### Multi-Turn Conversations

Track Privacy Twin mappings across multiple conversation turns so the AI can reference entities from earlier turns.

```typescript
import { PrivacyPalClient, ConversationSession } from '@privacypal/sdk';

const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: 'your-jwt-token'
});

const session = new ConversationSession('chat-session-001');
const history: Array<{ role: 'user' | 'assistant'; content: string; encoded?: boolean }> = [];

// Turn 1
const turn1 = await client.chatWithAI({
  prompt: 'Look up the account for John Doe, SSN 123-45-6789',
  sessionId: session.getSessionId()
});

session.addTurn({
  transformations: turn1.encoding.transformations,
  continuationId: turn1.continuationId
});

history.push(
  { role: 'user', content: turn1.encodedPrompt, encoded: true },
  { role: 'assistant', content: turn1.llmResponse }
);

// Turn 2 — "his" refers to John Doe from Turn 1
const turn2 = await client.chatWithAI({
  prompt: 'What is his mortgage payment history?',
  sessionId: session.getSessionId(),
  sessionContinuationIds: session.getContinuationIds(),
  conversationHistory: history
});

session.addTurn({
  transformations: turn2.encoding.transformations,
  continuationId: turn2.continuationId
});

// The decoded response correctly maps twins back to "John Doe"
console.log(turn2.decodedResponse);
```

### Local Decoding (Offline)

Decode Privacy Twins without an API call using stored transformations.

```typescript
// After encoding, store transformations locally
const encoded = await client.encode({
  data: 'John Doe lives at 123 Main St, Tampa FL'
});

client.storeContinuation(encoded.continuationId, {
  continuationId: encoded.continuationId,
  transformations: encoded.transformations
});

// Later, decode locally (no network required)
const aiResponse = 'The account for Maria Garcia in Portland, OR has been updated.';
const decoded = client.decodeLocal(aiResponse, encoded.continuationId);
// "The account for John Doe in Tampa, FL has been updated."

// Clean up when done
client.clearContinuation(encoded.continuationId);
```

### Client-Side Entity Detection

Detect PII locally without sending data to any server.

```typescript
import { createEntityDetector } from '@privacypal/sdk';

const detector = await createEntityDetector({
  useNLP: true,
  usePatterns: true,
  useFuzzy: true,
  minConfidence: 0.6
});

const text = `
  Patient: John Doe
  DOB: 03/15/1990
  SSN: 123-45-6789
  Email: john.doe@hospital.com
  Phone: (555) 123-4567
  Address: 123 Main St, Tampa, FL 33601
`;

const entities = await detector.detectEntities(text);

entities.forEach(entity => {
  console.log(`${entity.entityType}: "${entity.text}" (score: ${entity.score}, method: ${entity.method})`);
});

// Output:
// PERSON: "John Doe" (score: 0.92, method: nlp)
// DATE_TIME: "03/15/1990" (score: 1.0, method: pattern)
// US_SSN: "123-45-6789" (score: 1.0, method: pattern)
// EMAIL_ADDRESS: "john.doe@hospital.com" (score: 1.0, method: pattern)
// PHONE_NUMBER: "(555) 123-4567" (score: 1.0, method: pattern)
// LOCATION: "123 Main St, Tampa, FL 33601" (score: 0.85, method: nlp)
```

### Custom Intelligent Decoding

Use the `IntelligentDecoder` directly for advanced decoding scenarios with fuzzy matching.

```typescript
import { IntelligentDecoder } from '@privacypal/sdk';

const decoder = new IntelligentDecoder({
  fuzzyThreshold: 0.8,
  caseInsensitive: true,
  partialMatch: true
});

// AI reformatted names — decoder handles it
const text = 'Dear Ms. Garcia, your appointment on September 16, 1996 in Portland is confirmed.';

const decoded = decoder.decode(
  text,
  [
    { original: 'John Doe', twin: 'Maria Garcia', entityType: 'PERSON' },
    { original: '12/24/1996', twin: '09/16/1996', entityType: 'DATE_TIME' },
    { original: 'Tampa, FL', twin: 'Portland, OR', entityType: 'LOCATION' }
  ],
  {
    date: [
      { original: 'December', twin: 'September', entityType: 'MONTH_NAME' },
      { original: '24', twin: '16', entityType: 'DAY' },
      { original: '1996', twin: '1996', entityType: 'YEAR' }
    ],
    location: [
      { original: 'Tampa', twin: 'Portland', entityType: 'CITY' },
      { original: 'FL', twin: 'OR', entityType: 'STATE' }
    ]
  }
);

console.log(decoded);
// "Dear Ms. Doe, your appointment on December 24, 1996 in Tampa is confirmed."
```

### User & Account Management

```typescript
const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: 'your-jwt-token'
});

// Get account info
const account = await client.getAccount();
console.log(`${account.firstName} ${account.lastName} — ${account.tier} tier`);

// Get usage stats
const stats = await client.getUserStats(30); // Last 30 days
console.log(`Total prompts: ${stats.totalPrompts}`);

// Get company info
const company = await client.getCompany();
console.log(`Company: ${company.name}, ${company.memberCount} members`);

// Generate invite link for team
const invite = await client.generateInviteLink();
console.log(`Invite link: ${invite.inviteLink}`);
```

### Token Management

```typescript
const client = new PrivacyPalClient({
  apiUrl: 'https://api.privacypal.io',
  apiKey: ''  // Start without token
});

// Register
const regResult = await client.register('Jane', 'Smith', 'jane@example.com', 'SecureP@ss1');
client.updateApiKey(regResult.token);

// ... later, token expires ...

// Refresh token
const refreshResult = await client.refreshUserToken(regResult.token);
client.updateApiKey(refreshResult.data.token);

// Check current config
const config = client.getConfig();
console.log('Current API URL:', config.apiUrl);
```

---

## Error Handling

The SDK throws standard JavaScript `Error` objects with descriptive messages. HTTP status codes are included for specific error types.

```typescript
try {
  const result = await client.encode({ data: 'John Doe, SSN 123-45-6789' });
} catch (error) {
  if (error.message.startsWith('401:')) {
    // Token expired — re-authenticate
    const login = await client.login(email, password);
    client.updateApiKey(login.data.token);
  } else if (error.message.startsWith('403:')) {
    // Trial expired or subscription required
    if (error.message.includes('[Trial expired]')) {
      console.log('Trial expired. Please subscribe.');
    }
  } else if (error.message.startsWith('Network Error')) {
    // API unreachable
    console.log('Cannot connect to PrivacyPal API');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Error Message Patterns

| Pattern | HTTP Status | Meaning |
|---------|-------------|---------|
| `401: ...` | 401 | Authentication failed / token expired |
| `403: ... [Trial expired]` | 403 | Trial expired or subscription required |
| `Network Error: Unable to connect...` | — | API unreachable |
| `Request Error: ...` | — | Request configuration error |

### Health Check (Non-Throwing)

The `healthCheck()` method never throws — use it to verify connectivity:

```typescript
const health = await client.healthCheck();
if (!health.success) {
  console.log('API unavailable:', health.error);
}
```

---

## Configuration Reference

### Environment Variables

The SDK reads configuration from constructor parameters, not environment variables. However, your application should manage these values:

| Variable | Description |
|----------|-------------|
| `PRIVACYPAL_API_URL` | API base URL |
| `PRIVACYPAL_API_KEY` | JWT token |

**Example setup:**

```typescript
const client = new PrivacyPalClient({
  apiUrl: process.env.PRIVACYPAL_API_URL || 'http://localhost:42026',
  apiKey: process.env.PRIVACYPAL_API_KEY || ''
});
```

### Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| Timeout | 30,000ms | HTTP request timeout |
| Score Threshold | 0.35 | PII detection confidence threshold |
| Language | `"en"` | Detection language |
| Source Container | `"sdk_data"` | Default source container |
| Source Element | `"text_input"` | Default source element |
| Fuzzy Threshold | 0.8 | Intelligent decoder fuzzy match threshold |
| File Upload Timeout | 120,000ms | File encoding timeout |

### Supported Entity Types

| Entity Type | Description | Example |
|-------------|-------------|---------|
| `PERSON` | Full person name | John Doe |
| `EMAIL_ADDRESS` | Email address | john@example.com |
| `PHONE_NUMBER` | Phone number | 555-123-4567 |
| `US_SSN` | US Social Security Number | 123-45-6789 |
| `DATE_TIME` | Date or time value | 03/15/1990 |
| `LOCATION` | Physical location/address | 123 Main St, Tampa, FL |
| `CREDIT_CARD` | Credit card number | 4111-1111-1111-1111 |
| `IP_ADDRESS` | IP address | 192.168.1.100 |
| `IBAN_CODE` | International Bank Account | DE89370400440532013000 |
| `US_PASSPORT` | US passport number | 123456789 |
| `US_DRIVER_LICENSE` | US driver's license | D123-456-789-012 |
| `NRP` | National Registration Number | Various formats |
| `MEDICAL_LICENSE` | Medical license | Various formats |
| `URL` | Web URL | https://example.com |

---

## Changelog

### 1.0.0

- Initial release
- Core encoding/decoding with Privacy Twins
- Batch encoding support
- File encoding (PDF, DOCX, CSV, images)
- AI Chat with automatic PII protection (streaming and non-streaming)
- Multi-turn conversation session management
- Local offline decoding with IntelligentDecoder
- Client-side NLP entity detection with winkNLP
- User authentication and account management
- Stripe billing integration

---

*PrivacyPal SDK Documentation — Generated February 2026*
