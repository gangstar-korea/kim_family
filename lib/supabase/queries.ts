import type {
  BranchCode,
  EditRequest,
  EntityId,
  FamilyGraphData,
  JoinRequest,
  Person,
  Relationship,
  UserProfile,
} from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getCurrentUserProfile(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<UserProfile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPersonsByBranch(
  supabase: SupabaseServerClient,
  branchCode?: BranchCode,
) {
  let query = supabase
    .from("persons")
    .select("*")
    .order("generation", { ascending: true })
    .order("internal_code", { ascending: true });

  if (branchCode && branchCode !== "ROOT") {
    query = query.eq("branch_code", branchCode);
  }

  const { data, error } = await query.returns<Person[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getRelationships(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .returns<Relationship[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFamilyGraphData(
  supabase: SupabaseServerClient,
  branchCode?: BranchCode,
): Promise<FamilyGraphData> {
  const [persons, relationships] = await Promise.all([
    getPersonsByBranch(supabase, branchCode),
    getRelationships(supabase),
  ]);

  return {
    persons,
    relationships,
  };
}

export async function getPersonById(supabase: SupabaseServerClient, personId: EntityId) {
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("id", personId)
    .maybeSingle<Person>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPendingJoinRequests(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("join_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<JoinRequest[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPendingEditRequests(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("edit_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<EditRequest[]>();

  if (error) {
    throw error;
  }

  return data;
}
