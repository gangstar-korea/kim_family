import { redirect } from "next/navigation";

import type { AppRole, UserProfile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/queries";

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
  const profile = await requireUserProfile();

  if (!profile.approved) {
    redirect("/me");
  }

  return profile;
}
