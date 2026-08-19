# Error Handling Guide

This document describes the **standardized error handling** used across the Istana application. Following these patterns keeps error behaviour consistent for API routes, server actions, application logic, and the UI.

## Overview

- **Server / application code** throws typed errors (`AppError` and subclasses) with a message, optional code, status code, and optional field details.
- **API routes** catch errors and return a standard JSON shape (`ApiErrorResponse`) with the correct HTTP status.
- **Server actions** catch errors and return `{ success: false, message: string }` (or similar) for the client.
- **Client code** reads the `error` (and optionally `details`) from API/action responses and uses shared helpers to show messages or map fields.

All user-facing messages should be safe to show in the UI; use the shared `ERROR_MESSAGES` and error types so messages stay consistent.

---

## Where Things Live

| Location                | Purpose                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `lib/errors.ts`         | Error classes: `AppError`, `ValidationError`, `UnauthorizedError`, etc.                               |
| `lib/error-handler.ts`  | Parsing and querying: `parseApiError`, `getErrorMessage`, `getFieldErrors`, `isValidationError`, etc. |
| `lib/error-messages.ts` | User-facing message constants: `ERROR_MESSAGES` and `getErrorMessage(key)`.                           |
| `types/error.ts`        | Types: `ApiErrorResponse`, `FieldError`, `ErrorContext`; enum `ErrorCode`.                            |

---

## 1. Error Types and Codes

### Base class: `AppError`

All domain/application errors should use `AppError` or one of its subclasses so that API routes and server actions can recognise them and return the right status and payload.

```ts
// lib/errors.ts
throw new AppError(
  "User-friendly message", // message (required)
  "CUSTOM_CODE", // code (optional), use ErrorCode or your own
  400, // statusCode (optional), e.g. 400, 401, 404, 500
  { fieldName: ["Error for this field"] } // details (optional), for validation
);
```

### Built-in subclasses

Use these when the situation matches; they set `code` and `statusCode` for you:

| Class               | Typical use                      | Default status |
| ------------------- | -------------------------------- | -------------- |
| `ValidationError`   | Invalid input, schema validation | 400            |
| `UnauthorizedError` | Not logged in / session invalid  | 401            |
| `ForbiddenError`    | Logged in but not allowed        | 403            |
| `NotFoundError`     | Resource does not exist          | 404            |
| `NetworkError`      | Client/network failure           | 0              |
| `TimeoutError`      | Request timed out                | 408            |

Example:

```ts
import { ValidationError, NotFoundError } from "@/lib/errors";

if (!input.email) {
  throw new ValidationError("Email is required.", { email: ["Email is required."] });
}
const user = await userRepo.findById(id);
if (!user) {
  throw new NotFoundError("User not found.");
}
```

### Error codes (`types/error.ts`)

Use the `ErrorCode` enum when returning or checking error codes so they stay consistent:

```ts
import { ErrorCode } from "@/types";

ErrorCode.VALIDATION_ERROR; // "VALIDATION_ERROR"
ErrorCode.UNAUTHORIZED; // "UNAUTHORIZED"
ErrorCode.FORBIDDEN; // "FORBIDDEN"
ErrorCode.NOT_FOUND; // "NOT_FOUND"
ErrorCode.CONFLICT; // "CONFLICT"
ErrorCode.NETWORK_ERROR; // "NETWORK_ERROR"
ErrorCode.TIMEOUT; // "TIMEOUT"
ErrorCode.UNKNOWN; // "UNKNOWN"
```

---

## 2. API Routes

In API route handlers:

1. **Validate input** and return `400` with a clear message (and optional `code`) when invalid.
2. **Call application/infrastructure code** that may throw `AppError`.
3. **Catch errors** and return a **standard JSON body** and **matching HTTP status**.

### Standard error response shape

Responses should match `ApiErrorResponse`:

```ts
{
  error: string;           // Required. User-facing message.
  code?: string;          // Optional. e.g. ErrorCode.VALIDATION_ERROR.
  message?: string;       // Optional. Alias for error; getErrorMessage() uses message || error.
  details?: Record<string, string[]>;  // Optional. Field-level validation errors.
  statusCode?: number;   // Optional. Reflected in HTTP status.
}
```

### Example: catch and return

```ts
// app/api/quotations/route.ts (pattern)
import { AppError } from "@/lib/errors";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { ErrorCode } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // ... validate body, call handler ...
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          statusCode: error.statusCode ?? 400,
        },
        { status: error.statusCode ?? 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          code: ErrorCode.UNKNOWN,
          statusCode: 500,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: ERROR_MESSAGES.UNKNOWN,
        code: ErrorCode.UNKNOWN,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
```

### Returning validation errors explicitly

For bad request body or query params, return the same shape so the client can show a single message or field errors:

```ts
return NextResponse.json(
  {
    error: "Missing required fields: approvalInstanceId, action",
    code: ErrorCode.VALIDATION_ERROR,
    statusCode: 400,
  },
  { status: 400 }
);
```

Use **`ERROR_MESSAGES`** for user-facing strings so copy is consistent (e.g. `ERROR_MESSAGES.APPROVAL_NOT_FOUND`).

---

## 3. Server Actions

Server actions typically return a result object (e.g. `{ success: boolean; message?: string }`) rather than throwing to the client.

1. **Catch `AppError`** and return a user-friendly message (e.g. `err.message` or a mapped message from `ERROR_MESSAGES`).
2. **Log or rethrow** non-`AppError` as needed; avoid exposing internal details in the returned message.

Example:

```ts
// modules/auth/presentation/signup.action.ts (pattern)
import { AppError } from "@/lib/errors";

export async function signupAction(formData: FormData) {
  try {
    const result = await signup(...);
    // ...
    redirect("/verify-email/sent");
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code === "RATE_LIMIT") return { success: false, message: err.message };
      return { success: false, message: err.message };
    }
    // Next.js redirect() throws; rethrow so redirect works
    if (err && typeof err === "object" && "digest" in err) throw err;
    return { success: false, message: "We couldn't complete signup. Please try again." };
  }
}
```

Use **`ERROR_MESSAGES`** when you want a fixed string for a given scenario (e.g. rate limit, server error) instead of the raw `AppError` message.

---

## 4. Application / Domain Layer

In **application** (use cases) and **domain** code, throw `AppError` or a subclass with a clear message and, when useful, a code and details.

- **Validation**: Prefer `ValidationError` with optional `details` for field errors.
- **Not found**: Use `NotFoundError`.
- **Auth**: Use `UnauthorizedError` or `ForbiddenError` as appropriate.
- **Custom cases**: Use `new AppError(message, "YOUR_CODE", statusCode, details)`.

Example (application layer):

```ts
// modules/quotation/application/create-quotation.ts
import { AppError } from "@/lib/errors";

const parsed = createQuotationInputSchema.safeParse(input);
if (!parsed.success) {
  const first = parsed.error.flatten().fieldErrors;
  const message = first.items?.[0] ?? first.customerName?.[0] ?? "Invalid input";
  throw new AppError(message, "QUOTATION_VALIDATION_ERROR");
}
```

The API route or server action that calls this code will catch `AppError` and turn it into the standard response.

---

## 5. Client-Side: Reading and Displaying Errors

### After `fetch` (API routes)

The API returns JSON. When `response.ok` is false, parse the body and use the `error` (and optionally `details`) field:

```ts
const response = await fetch("/api/approval/quotations");
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  const message = errorData.error ?? "Failed to load approvals";
  showError("Error", message);
  return;
}
```

If you pass that parsed object into the error-handler helpers, they will treat it as an `ApiErrorResponse` and use `error` / `message` / `details` correctly.

### Using the error-handler helpers

Use these from `@/lib/error-handler` when you have an unknown error (e.g. from `catch` or from a failed response body):

| Helper                      | Use case                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| `parseApiError(error)`      | Normalise any `unknown` error into `ApiErrorResponse`.                        |
| `getErrorMessage(error)`    | Single user-facing string: `parsed.message \|\| parsed.error`.                |
| `getFieldErrors(error)`     | `Record<string, string[]>` for validation details, if present.                |
| `getFieldErrorArray(error)` | Field errors as `{ field, messages }[]` for lists/forms.                      |
| `isValidationError(error)`  | Whether the error looks like a validation (400 / VALIDATION_ERROR / details). |
| `isNetworkError(error)`     | Network/fetch failures.                                                       |
| `isTimeoutError(error)`     | Timeout (e.g. 408).                                                           |
| `shouldRetry(error)`        | Heuristic: retry for network, timeout, 5xx; not for 4xx (except 408).         |

Example (form submit):

```ts
import { getErrorMessage, getFieldErrors } from "@/lib/error-handler";

try {
  const res = await fetch("/api/quotations", { method: "POST", body: JSON.stringify(data) });
  const body = await res.json();
  if (!res.ok) {
    const message = getErrorMessage(body);
    const fieldErrors = getFieldErrors(body);
    setSubmitError(message);
    setFieldErrors(fieldErrors ?? {});
    return;
  }
  // success
} catch (err) {
  setSubmitError(getErrorMessage(err));
}
```

---

## 6. User-Facing Messages: `ERROR_MESSAGES`

`lib/error-messages.ts` defines a single place for user-facing copy. Use it in API routes and server actions so messages are consistent and easy to change.

```ts
import { ERROR_MESSAGES } from "@/lib/error-messages";

// Return a standard message
return NextResponse.json(
  { error: ERROR_MESSAGES.APPROVAL_NOT_FOUND, code: ErrorCode.NOT_FOUND, statusCode: 404 },
  { status: 404 }
);
```

To add a new message, extend the `ERROR_MESSAGES` object and, if you want a typed helper, use `getErrorMessage(key, fallback)` from the same file.

---

## 7. Quick Reference

| Layer                    | What to do                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application / domain** | Throw `AppError` or subclass with message, optional code, statusCode, details.                                                                                       |
| **API route**            | Catch `AppError` → return `NextResponse.json({ error, code, details, statusCode }, { status })`. Use `ERROR_MESSAGES` for body copy.                                 |
| **Server action**        | Catch `AppError` → return `{ success: false, message }`. Use `ERROR_MESSAGES` where appropriate.                                                                     |
| **Client**               | On non-ok response, parse JSON and use `error` (and `details`). Use `getErrorMessage()` / `getFieldErrors()` from `@/lib/error-handler` for display and retry logic. |

Sticking to this flow keeps errors predictable and safe to show in the UI while preserving codes and field details where needed.
