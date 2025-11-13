import { auth } from "@clerk/nextjs/server";

export const getClerkAuthenticatedTokenServer = async (): Promise<
  string | null
> => {
  const { isAuthenticated, getToken } = await auth();
  if (!isAuthenticated) {
    return null;
  }
  const token = await getToken({ template: "convex" });
  return token;
};
