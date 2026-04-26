import { redirect } from "next/navigation";

import type { AppRole, ApprovalStatus, UserProfile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/queries";

type AccessDecision =
  | "unauthenticated"
  | "missing_profile"
  | "super_admin"
  | "approved"
  | "pending"
  | "rejected"
  | "unknown_status";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireUserProfile() {
  const accessContext = await resolveCurrentAccessContext();

  if (!accessContext.profile) {
    redirect("/login");
  }

  return accessContext.profile;
}

export function hasRole(profile: UserProfile, roles: AppRole[]) {
  return roles.includes(profile.role);
}

export async function requireApprovedProfile() {
  const accessContext = await resolveCurrentAccessContext();

  if (accessContext.decision === "unauthenticated") {
    redirect("/login");
  }

  if (accessContext.decision === "super_admin" || accessContext.decision === "approved") {
    return accessContext.profile as UserProfile;
  }

  redirect("/me");
}

export async function requireSuperAdminProfile() {
  const accessContext = await resolveCurrentAccessContext();

  if (accessContext.decision === "unauthenticated") {
    redirect("/login");
  }

  if (accessContext.decision !== "super_admin") {
    redirect("/");
  }

  return accessContext.profile as UserProfile;
}

export async function resolveCurrentAccessContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.info("[access check]", {
      authUserId: null,
      profile: null,
      role: null,
      status: null,
      decision: "unauthenticated",
      authError: userError?.message ?? null,
    });

    return {
      authUserId: null,
      profile: null,
      role: null,
      status: null,
      decision: "unauthenticated" as AccessDecision,
    };
  }

  const profile = await getCurrentUserProfile(supabase);
  const role = profile?.role ?? null;
  const status = (profile?.status ?? null) as ApprovalStatus | null;
  const decision = decideAccess(profile);

  console.info("[access check]", {
    authUserId: user.id,
    profile,
    role,
    status,
    decision,
  });

  return {
    authUserId: user.id,
    profile,
    role,
    status,
    decision,
  };
}

function decideAccess(profile: UserProfile | null): AccessDecision {
  if (!profile) {
    return "missing_profile";
  }

  if (!profile.role) {
    return "missing_profile";
  }

  if (profile.role === "super_admin") {
    return "super_admin";
  }

  if (!profile.status) {
    return "unknown_status";
  }

  if (profile.status === "approved") {
    return "approved";
  }

  if (profile.status === "pending") {
    return "pending";
  }

  if (profile.status === "rejected") {
    return "rejected";
  }

  return "unknown_status";
}
