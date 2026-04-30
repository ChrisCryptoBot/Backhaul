import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <main>
        <h1>Sign-in unavailable</h1>
        <p>Clerk is not configured for this environment.</p>
        <p>Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) and refresh.</p>
      </main>
    );
  }

  return (
    <main>
      <SignIn />
    </main>
  );
}
