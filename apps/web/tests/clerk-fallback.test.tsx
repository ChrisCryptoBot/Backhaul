import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import RootLayout from "@/app/layout";

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  )
}));

describe("root layout Clerk fallback", () => {
  const originalPublicKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalServerKey = process.env.CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublicKey;
    process.env.CLERK_PUBLISHABLE_KEY = originalServerKey;
    cleanup();
  });

  test("bypasses Clerk provider when key is missing", () => {
    const markup = renderToStaticMarkup(<RootLayout>content</RootLayout>);
    expect(markup).not.toContain("data-testid=\"clerk-provider\"");
  });

  test("bypasses Clerk provider when key is invalid", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-publishable";
    const markup = renderToStaticMarkup(<RootLayout>content</RootLayout>);
    expect(markup).not.toContain("data-testid=\"clerk-provider\"");
  });

  test("uses Clerk provider when key is valid", () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
    const markup = renderToStaticMarkup(<RootLayout>content</RootLayout>);
    expect(markup).toContain("data-testid=\"clerk-provider\"");
  });
});
