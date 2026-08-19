# File Upload Configuration Guide

This document explains the robust, multi-layered approach used for handling file uploads and body size limits in this Next.js application.

## Overview

We use a **defense-in-depth** strategy with three layers of protection:

1. **Framework-level configuration** (next.config.ts)
2. **Route-level configuration** (route segment config)
3. **Application-level validation** (code validation)

## Layer 1: Framework-Level Configuration

**Location:** `next.config.ts`

```typescript
experimental: {
  proxyClientMaxBodySize: "50mb",      // For proxy middleware scenarios
  serverActions: {
    bodySizeLimit: "50mb",              // For Server Actions
  },
}
```

**Purpose:**

- Sets framework-level limits before requests reach route handlers
- Protects against excessive memory usage at the Next.js level
- Provides first line of defense

**Why experimental?**

- These are the only officially documented options for global body size limits
- Marked experimental but stable enough for production use
- Recommended by Next.js team for production applications

## Layer 2: Route-Level Configuration

**Location:** Individual route files (e.g., `app/api/jobcards/[id]/shop-drawings/route.ts`)

```typescript
export const maxRequestBodySize = "50mb";
```

**Purpose:**

- Provides route-specific overrides
- May not be officially documented but works as additional safety net
- Allows different limits for different routes

**Note:** This option may not be officially supported, but it provides an extra layer of protection.

## Layer 3: Application-Level Validation

**Location:** `lib/file-validation.ts` and route handlers

**Purpose:**

- Provides business logic validation
- Gives user-friendly error messages
- Works regardless of Next.js version or configuration changes
- Most reliable layer - always works

**Usage:**

```typescript
import { validateFile, FILE_SIZE_LIMITS } from "@/lib/file-validation";

const fileValidation = validateFile(file, {
  sizeLimit: FILE_SIZE_LIMITS.SHOP_DRAWING, // 50MB
  allowedTypes: ["image/", "application/pdf"],
});

if (!fileValidation.isValid) {
  return NextResponse.json({ error: fileValidation.error }, { status: 400 });
}
```

## File Size Limits

Predefined limits are available in `lib/file-validation.ts`:

- `SHOP_DRAWING`: 50MB
- `SITE_MEASUREMENT`: 50MB
- `QUOTATION_ITEM_IMAGE`: 10MB
- `REQUEST_ITEM_IMAGE`: 10MB
- `DEFAULT`: 10MB

## Benefits of This Approach

1. **Resilience**: If one layer fails, others catch it
2. **Maintainability**: Centralized validation logic
3. **User Experience**: Clear, consistent error messages
4. **Future-Proof**: Code-level validation works regardless of Next.js changes
5. **Flexibility**: Different limits for different routes/types

## Best Practices

1. **Always use code-level validation** in route handlers - it's the most reliable
2. **Use shared validation utilities** from `lib/file-validation.ts` for consistency
3. **Provide clear error messages** to help users understand limits
4. **Document route-specific limits** in route file comments
5. **Test with files at the limit** to ensure all layers work correctly

## Example: Complete Route Handler

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateFile, FILE_SIZE_LIMITS } from "@/lib/file-validation";

// Route-level config (optional, may not be officially supported)
export const maxRequestBodySize = "50mb";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Application-level validation (most reliable)
  const validation = validateFile(file, {
    sizeLimit: FILE_SIZE_LIMITS.SHOP_DRAWING,
    allowedTypes: ["image/", "application/pdf"],
  });

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Process file...
}
```

## Troubleshooting

### Issue: "Request body too large" error

**Solution:**

1. Check `next.config.ts` experimental options are set correctly
2. Verify route-level `maxRequestBodySize` if used
3. Ensure code-level validation allows the file size
4. Check deployment platform limits (Vercel, etc.)

### Issue: Inconsistent file size limits

**Solution:**

- Use `FILE_SIZE_LIMITS` constants from `lib/file-validation.ts`
- Avoid hardcoding file size limits in route handlers
- Update limits in one place (file-validation.ts)

## References

- [Next.js proxyClientMaxBodySize](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize)
- [Next.js serverActions.bodySizeLimit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
