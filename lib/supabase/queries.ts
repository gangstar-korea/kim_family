import type {
  AppRole,
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

export type ApprovalAdminItem = {
  joinRequest: JoinRequest;
  profile: Pick<UserProfile, "id" | "role" | "status" | "person_id" | "display_name" | "phone"> | null;
  effectiveStatus: "pending" | "approved" | "rejected";
  role: AppRole | null;
  personId: string | null;
};

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
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  if (error) {
    console.error("[approval] current user profile lookup failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
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

  if (profile.role === "super_admin") {
    return {
      profile,
      latestJoinRequest,
      status: "approved",
    };
  }

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

export async function getApprovalAdminItems(
  supabase: SupabaseServerClient,
): Promise<ApprovalAdminItem[]> {
  const [joinRequests, userProfiles] = await Promise.all([
    getAllJoinRequests(supabase),
    getApprovalProfiles(supabase),
  ]);

  const profileById = new Map(userProfiles.map((profile) => [profile.id, profile]));

  return joinRequests
    .map((joinRequest) => {
      const profile = profileById.get(joinRequest.user_id) ?? null;

      return {
        joinRequest,
        profile,
        effectiveStatus: profile?.status ?? joinRequest.status,
        role: profile?.role ?? null,
        personId: profile?.person_id ?? joinRequest.person_id ?? null,
      };
    })
    .sort((left, right) => {
      const rankDiff =
        getStatusSortRank(left.effectiveStatus) - getStatusSortRank(right.effectiveStatus);

      if (rankDiff !== 0) {
        return rankDiff;
      }

      return left.joinRequest.created_at < right.joinRequest.created_at ? 1 : -1;
    });
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

async function getApprovalProfiles(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, role, status, person_id, display_name, phone")
    .returns<
      Array<
        Pick<UserProfile, "id" | "role" | "status" | "person_id" | "display_name" | "phone">
      >
    >();

  if (error) {
    throw error;
  }

  return data;
}

function getStatusSortRank(status: "pending" | "approved" | "rejected") {
  if (status === "pending") {
    return 0;
  }

  if (status === "approved") {
    return 1;
  }

  return 2;
}
