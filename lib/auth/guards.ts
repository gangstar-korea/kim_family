import { redirect } from "next/navigation";

import type { AppRole, UserProfile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentApprovalState, getCurrentUserProfile } from "@/lib/supabase/queries";

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
  const supabase = await createClient();
  const profile = await getCurrentUserProfile(supabase);

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export function hasRole(profile: UserProfile, roles: AppRole[]) {
  return roles.includes(profile.role);
}

export async function requireApprovedProfile() {
  const supabase = await createClient();
  const approvalState = await getCurrentApprovalState(supabase);
  const fallbackProfile = approvalState?.profile ?? (await getCurrentUserProfile(supabase));

  if (!fallbackProfile) {
    redirect("/login");
  }

  if (fallbackProfile.role === "super_admin") {
    return fallbackProfile;
  }

  if (approvalState?.status !== "approved" || fallbackProfile.status !== "approved") {
    redirect("/me");
  }

  return fallbackProfile;
}

export async function requireSuperAdminProfile() {
  const profile = await requireApprovedProfile();

  if (profile.role !== "super_admin") {
    redirect("/");
  }

  return profile;
}
