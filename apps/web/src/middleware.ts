import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isAuthBypassed } from "@/lib/auth-mode";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAuthBypassed()) {
    return;
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico)).*)"]
};
