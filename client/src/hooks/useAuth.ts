import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
  });

  // Check for authentication errors
  const errorResponse = error as any;
  const isUnauthenticated = errorResponse?.status === 401;
  
  // Check if user needs approval (data will include needsApproval flag)
  const needsApproval = (user as any)?.needsApproval === true;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isUnauthenticated,
    needsApproval,
    isApproved: !!user && !needsApproval && !isUnauthenticated,
  };
}
