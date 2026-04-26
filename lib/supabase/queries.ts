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
  joinRequest: JoinRequest | null;
  profile: Pick<
    UserProfile,
    | "id"
    | "role"
    | "status"
    | "person_id"
    | "display_name"
    | "phone"
    | "created_at"
  > | null;
  effectiveStatus: "pending" | "approved" | "rejected";
  role: AppRole | null;
  personId: string | null;
  accountId: string;
  displayName: string;
  phone: string;
  branchCode: BranchCode | null;
  familyRoleType: UserProfile["family_role_type"] | JoinRequest["family_role_type"] | null;
  createdAt: string;
};

type JoinRequestPayload = {
  branch_code?: BranchCode | null;
  family_role_type?: UserProfile["family_role_type"] | null;
  person_id?: string | null;
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
    .eq("requester_user_id", user.id)
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

  const latestJoinRequestByUserId = new Map<string, JoinRequest>();

  joinRequests.forEach((joinRequest) => {
    const existing = latestJoinRequestByUserId.get(joinRequest.requester_user_id);

    if (!existing || existing.created_at < joinRequest.created_at) {
      latestJoinRequestByUserId.set(joinRequest.requester_user_id, joinRequest);
    }
  });

  const approvalItems: ApprovalAdminItem[] = [];
  const includedAccountIds = new Set<string>();

  userProfiles.forEach((profile) => {
    if (profile.role === "super_admin") {
      return;
    }

    const joinRequest = latestJoinRequestByUserId.get(profile.id) ?? null;
    const payload = parseJoinRequestPayload(joinRequest);

    approvalItems.push({
      joinRequest,
      profile,
      effectiveStatus: profile.status ?? joinRequest?.status ?? "pending",
      role: profile.role ?? null,
      personId: profile.person_id ?? payload?.person_id ?? null,
      accountId: profile.id,
      displayName: profile.display_name ?? joinRequest?.applicant_name ?? "-",
      phone: profile.phone ?? joinRequest?.applicant_phone ?? "-",
      branchCode: payload?.branch_code ?? null,
      familyRoleType: payload?.family_role_type ?? null,
      createdAt: joinRequest?.created_at ?? profile.created_at,
    });

    includedAccountIds.add(profile.id);
  });

  joinRequests.forEach((joinRequest) => {
    if (includedAccountIds.has(joinRequest.requester_user_id)) {
      return;
    }

    const payload = parseJoinRequestPayload(joinRequest);

    approvalItems.push({
      joinRequest,
      profile: null,
      effectiveStatus: joinRequest.status,
      role: null,
      personId: payload?.person_id ?? null,
      accountId: joinRequest.requester_user_id,
      displayName: joinRequest.applicant_name,
      phone: joinRequest.applicant_phone,
      branchCode: payload?.branch_code ?? null,
      familyRoleType: payload?.family_role_type ?? null,
      createdAt: joinRequest.created_at,
    });
  });

  return approvalItems.sort((left, right) => {
    const rankDiff =
      getStatusSortRank(left.effectiveStatus) - getStatusSortRank(right.effectiveStatus);

    if (rankDiff !== 0) {
      return rankDiff;
    }

    return left.createdAt < right.createdAt ? 1 : -1;
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
    .select("id, role, status, person_id, display_name, phone, created_at")
    .returns<
      Array<
        Pick<
          UserProfile,
          | "id"
          | "role"
          | "status"
          | "person_id"
          | "display_name"
          | "phone"
          | "created_at"
        >
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

function parseJoinRequestPayload(joinRequest: JoinRequest | null): JoinRequestPayload | null {
  if (!joinRequest?.payload || typeof joinRequest.payload !== "object") {
    return null;
  }

  return joinRequest.payload as JoinRequestPayload;
}
