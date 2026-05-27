export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type EventType =
  | "wedding"
  | "birthday"
  | "conference"
  | "concert"
  | "reunion"
  | "party"
  | "custom";

export type SharePermission = "view" | "upload" | "tag";
export type MediaType = "image" | "video";
export type TagType = "text" | "person";

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          event_type: EventType;
          starts_at: string;
          ends_at: string | null;
          description: string | null;
          location: string | null;
          cover_media_id: string | null;
          visibility_starts_at: string | null;
          visibility_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          event_type: EventType;
          starts_at: string;
          ends_at?: string | null;
          description?: string | null;
          location?: string | null;
          cover_media_id?: string | null;
          visibility_starts_at?: string | null;
          visibility_ends_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      event_albums: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          cover_media_id: string | null;
          visibility_state: "active" | "hidden" | "expired";
          moderation_state: "open" | "review_required" | "locked";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          cover_media_id?: string | null;
          visibility_state?: "active" | "hidden" | "expired";
          moderation_state?: "open" | "review_required" | "locked";
        };
        Update: Partial<Database["public"]["Tables"]["event_albums"]["Insert"]>;
        Relationships: [];
      };
      share_access: {
        Row: {
          id: string;
          event_id: string;
          album_id: string;
          slug: string;
          state: "active" | "disabled" | "expired";
          permissions: SharePermission[];
          created_by: string;
          created_at: string;
          disabled_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          album_id: string;
          slug: string;
          state?: "active" | "disabled" | "expired";
          permissions?: SharePermission[];
          created_by: string;
          expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["share_access"]["Insert"]> & {
          disabled_at?: string | null;
        };
        Relationships: [];
      };
      client_nicknames: {
        Row: {
          id: string;
          event_id: string;
          album_id: string;
          display_name: string;
          state: "active" | "retired";
          session_key_hash: string | null;
          created_at: string;
          retired_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          album_id: string;
          display_name: string;
          state?: "active" | "retired";
          session_key_hash?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["client_nicknames"]["Insert"]> & {
          retired_at?: string | null;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          event_id: string;
          album_id: string;
          auth_user_id: string | null;
          role: "organizer" | "guest" | "reviewer";
          access_state: "active" | "revoked";
          client_nickname_id: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          album_id: string;
          auth_user_id?: string | null;
          role: "organizer" | "guest" | "reviewer";
          access_state?: "active" | "revoked";
          client_nickname_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Insert"]> & {
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      media_items: {
        Row: {
          id: string;
          album_id: string;
          event_id: string;
          uploader_participant_id: string;
          nickname_id: string | null;
          media_type: MediaType;
          original_object_key: string;
          original_filename: string | null;
          preview_data_url: string | null;
          upload_status: "pending" | "uploaded" | "failed" | "deleted";
          moderation_state: "visible" | "pending_review" | "hidden" | "removed";
          metadata_visibility: "private" | "shared";
          uploaded_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          album_id: string;
          event_id: string;
          uploader_participant_id: string;
          nickname_id?: string | null;
          media_type: MediaType;
          original_object_key: string;
          original_filename?: string | null;
          preview_data_url?: string | null;
          upload_status?: "pending" | "uploaded" | "failed" | "deleted";
          moderation_state?: "visible" | "pending_review" | "hidden" | "removed";
          metadata_visibility?: "private" | "shared";
        };
        Update: Partial<Database["public"]["Tables"]["media_items"]["Insert"]> & {
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          album_id: string;
          media_item_id: string;
          creator_participant_id: string;
          tag_type: TagType;
          display_name: string;
          normalized_value: string;
          state: "active" | "removed";
          created_at: string;
          removed_at: string | null;
        };
        Insert: {
          id?: string;
          album_id: string;
          media_item_id: string;
          creator_participant_id: string;
          tag_type: TagType;
          display_name: string;
          normalized_value: string;
          state?: "active" | "removed";
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]> & {
          removed_at?: string | null;
        };
        Relationships: [];
      };
      album_activity: {
        Row: {
          id: string;
          event_id: string;
          album_id: string;
          actor_participant_id: string | null;
          nickname_id: string | null;
          activity_type:
            | "event_created"
            | "share_created"
            | "nickname_assigned"
            | "media_uploaded"
            | "upload_failed"
            | "tag_added"
            | "tag_removed"
            | "media_removed"
            | "permissions_changed";
          subject_type: string;
          subject_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          album_id: string;
          actor_participant_id?: string | null;
          nickname_id?: string | null;
          activity_type: Database["public"]["Tables"]["album_activity"]["Row"]["activity_type"];
          subject_type: string;
          subject_id: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SupabaseClientLike = {
  from: <T extends keyof Database["public"]["Tables"]>(
    table: T
  ) => unknown;
};
