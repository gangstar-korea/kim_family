import type {
  BranchCode,
  CurrentApprovalState,
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

export async function getCurrentUserJoinRequest(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("join_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<JoinRequest>();

  if (error) {
    console.error("[approval] current join request lookup failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return data;
}

export async function getCurrentApprovalState(
  supabase: SupabaseServerClient,
): Promise<CurrentApprovalState | null> {
  const profile = await getCurrentUserProfile(supabase);

  if (!profile) {
    return null;
  }

  const latestJoinRequest = await getCurrentUserJoinRequest(supabase);

  return {
    profile,
    latestJoinRequest,
    status: profile.status ?? latestJoinRequest?.status ?? "pending",
  };
}

export async function getPersonsByBranch(
  supabase: SupabaseServerClient,
  branchCode?: BranchCode,
): Promise<Person[]> {
  let query = supabase
    .from("persons")
    .select("*")
    .order("generation_depth", { ascending: true, nullsFirst: false })
    .order("birth_order", { ascending: true, nullsFirst: false })
    .order("birth_date", { ascending: true, nullsFirst: false })
    .order("full_name", { ascending: true });

  if (branchCode && branchCode !== "ROOT") {
    query = query.eq("branch_code", branchCode);
  }

  const { data, error } = await query.returns<Person[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getRelationships(supabase: SupabaseServerClient): Promise<Relationship[]> {
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const personsResult = await getFamilyPersonsForGraph(supabase, branchCode);
  const relationshipsResult = await getFamilyRelationshipsForGraph(supabase);
  const supabaseErrorMessage =
    userError?.message ??
    personsResult.error?.message ??
    relationshipsResult.error?.message ??
    null;

  if (userError) {
    console.error("[family graph] auth user lookup failed", userError.message);
  }

  if (personsResult.error) {
    console.error("[family graph] persons query failed", personsResult.error.message);
  }

  if (relationshipsResult.error) {
    console.error(
      "[family graph] relationships query failed",
      relationshipsResult.error.message,
    );
  }

  const persons = personsResult.data ?? [];
  const relationships = relationshipsResult.data ?? [];
  const visiblePersonsCount = persons.filter((person) => person.is_visible).length;

  console.error("[family graph] debug", {
    personsCount: persons.length,
    relationshipsCount: relationships.length,
    visiblePersonsCount,
    authenticatedUserId: user?.id ?? null,
    branchCode: branchCode ?? "ALL",
    supabaseErrorMessage,
    personsErrorMessage: personsResult.error?.message ?? null,
    relationshipsErrorMessage: relationshipsResult.error?.message ?? null,
  });

  return {
    persons,
    relationships,
    debug: {
      personsCount: persons.length,
      relationshipsCount: relationships.length,
      visiblePersonsCount,
      authenticatedUserId: user?.id ?? null,
      supabaseErrorMessage,
      personsErrorMessage: personsResult.error?.message ?? null,
      relationshipsErrorMessage: relationshipsResult.error?.message ?? null,
      appliedFilters: {
        branchCode: branchCode ?? "ALL",
        isVisible: "not_applied",
        relationType: "not_applied",
        generationDepth: "order_only",
      },
    },
  };
}

async function getFamilyPersonsForGraph(
  supabase: SupabaseServerClient,
  branchCode?: BranchCode,
) {
  let query = supabase
    .from("persons")
    .select("*")
    .order("generation_depth", { ascending: true, nullsFirst: false })
    .order("birth_order", { ascending: true, nullsFirst: false })
    .order("birth_date", { ascending: true, nullsFirst: false })
    .order("full_name", { ascending: true });

  if (branchCode && branchCode !== "ROOT") {
    query = query.eq("branch_code", branchCode);
  }

  return query.returns<Person[]>();
}

async function getFamilyRelationshipsForGraph(supabase: SupabaseServerClient) {
  return supabase.from("relationships").select("*").returns<Relationship[]>();
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

export async function getAllJoinRequests(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("join_requests")
    .select("*")
    .order("created_at", { ascending: false })
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
