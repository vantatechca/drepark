import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isPublicPage = isLoginPage || isRegisterPage;
  const isAuthApi = pathname.startsWith("/api/auth");
  const isRegisterApi = pathname === "/api/register";

  if (isAuthApi || isRegisterApi) return;

  if (!isLoggedIn && !isPublicPage) {
    return Response.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isPublicPage) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
