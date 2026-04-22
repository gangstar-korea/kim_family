export type AppRole = "member" | "branch_admin" | "super_admin";

export type BranchCode =
  | "ROOT"
  | "BR01"
  | "BR02"
  | "BR03"
  | "BR04"
  | "BR05"
  | "BR06"
  | "BR07"
  | "BR08";

export type FamilyRoleType = "blood" | "spouse";

export type RelationshipType = "parent" | "child" | "spouse";

export type RequestStatus = "pending" | "approved" | "rejected";

export type ISODateString = string;
export type ISODateTimeString = string;
export type EntityId = string;

export interface Person {
  id: EntityId;
  full_name: string;
  hanja_name: string | null;
  gender: "male" | "female" | "unknown" | null;
  birth_date: ISODateString | null;
  generation_depth: number | null;
  internal_code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  region: string | null;
  profile_image_url: string | null;
  is_alive: boolean;
  deceased_date: ISODateString | null;
  deceased_note: string | null;
  is_visible: boolean;
  memo: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  created_by: EntityId | null;
  updated_by: EntityId | null;
  branch_code: BranchCode;
  family_role_type: FamilyRoleType;
  birth_order: number | null;
  birth_date_solar: ISODateString | null;
  birth_date_lunar: ISODateString | null;
  birth_calendar_type: "solar" | "lunar" | string | null;
  is_lunar_leap_month: boolean | null;
}

export interface Relationship {
  id: EntityId;
  person_id: EntityId;
  related_person_id: EntityId;
  relation_type: RelationshipType;
  is_primary: boolean;
  created_at: ISODateTimeString;
  created_by: EntityId | null;
}

export interface UserProfile {
  id: EntityId;
  user_id: EntityId;
  person_id: EntityId | null;
  phone: string;
  display_name: string;
  role: AppRole;
  branch_code: BranchCode;
  family_role_type: FamilyRoleType;
  approved: boolean;
  approved_at: ISODateTimeString | null;
  approved_by: EntityId | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface JoinRequest {
  id: EntityId;
  user_id: EntityId;
  person_id: EntityId | null;
  phone: string;
  display_name: string;
  branch_code: BranchCode;
  family_role_type: FamilyRoleType;
  status: RequestStatus;
  reviewed_by: EntityId | null;
  reviewed_at: ISODateTimeString | null;
  rejection_reason: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface EditRequest {
  id: EntityId;
  requester_user_id: EntityId;
  person_id: EntityId;
  requested_changes: Record<string, unknown>;
  status: RequestStatus;
  reviewed_by: EntityId | null;
  reviewed_at: ISODateTimeString | null;
  rejection_reason: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export type AuthActionState = {
  ok: boolean;
  message: string;
};

export type FamilyGraphData = {
  persons: Person[];
  relationships: Relationship[];
  debug?: FamilyGraphDebug;
};

export type FamilyGraphDebug = {
  personsCount: number;
  relationshipsCount: number;
  visiblePersonsCount: number;
  authenticatedUserId: EntityId | null;
  supabaseErrorMessage: string | null;
  personsErrorMessage: string | null;
  relationshipsErrorMessage: string | null;
  appliedFilters: {
    branchCode: BranchCode | "ALL";
    isVisible: "not_applied";
    relationType: "not_applied";
    generationDepth: "order_only";
  };
};
