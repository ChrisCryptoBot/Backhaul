import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Backhaul Phase 1",
  description: "NE operational flow bootstrap"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = Boolean(publishableKey && /^pk_(test|live)_/.test(publishableKey));

  if (!hasValidClerkKey) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey!}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
