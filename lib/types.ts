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
  internal_code: string;
  name: string;
  gender: "male" | "female" | "unknown" | null;
  birth_date: ISODateString | null;
  lunar_birth_date: ISODateString | null;
  phone: string | null;
  address: string | null;
  generation: number | null;
  branch_code: BranchCode;
  family_role_type: FamilyRoleType;
  deceased: boolean;
  death_date: ISODateString | null;
  burial_place: string | null;
  memo: string | null;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
}

export interface Relationship {
  id: EntityId;
  from_person_id: EntityId;
  to_person_id: EntityId;
  relationship_type: RelationshipType;
  created_at: ISODateTimeString;
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
};
