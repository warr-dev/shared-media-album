# Data Model: Event Album Media Sharing

## Event

Represents an organizer-created event.

Fields:
- `id`: Unique event identifier
- `owner_id`: Organizer who owns the event
- `name`: Required event name
- `event_type`: Required type such as wedding, birthday, conference, concert,
  reunion, party, or custom
- `starts_at`: Required event start date/time
- `ends_at`: Optional event end date/time
- `description`: Optional event description
- `location`: Optional event location
- `cover_media_id`: Optional cover media reference
- `visibility_starts_at`: Optional album visibility start
- `visibility_ends_at`: Optional album visibility end
- `created_at`, `updated_at`: Audit timestamps

Relationships:
- Has one primary `EventAlbum`
- Has many `ShareAccess` records
- Has many `Participant` records

Validation:
- `name`, `event_type`, `owner_id`, and `starts_at` are required
- `ends_at` must be empty or after `starts_at`
- `event_type` must be one of the supported values or `custom`

## EventAlbum

Represents the shared media album for an event.

Fields:
- `id`: Unique album identifier
- `event_id`: Parent event
- `title`: Required album title
- `visibility_state`: active, hidden, expired
- `moderation_state`: open, review_required, locked
- `created_at`, `updated_at`: Audit timestamps

Relationships:
- Belongs to one `Event`
- Has many `MediaItem`, `Tag`, `AlbumActivity`, and `ClientNickname` records

Validation:
- One primary album per event in MVP scope
- Album cannot be active when the parent event is disabled

## ShareAccess

Represents a QR code/link that grants access to an event album.

Fields:
- `id`: Unique share access identifier
- `event_id`: Parent event
- `album_id`: Target album
- `slug`: Public share slug used by QR/link
- `state`: active, disabled, expired
- `permissions`: view, upload, tag flags
- `created_by`: Organizer who created or regenerated access
- `created_at`, `disabled_at`, `expires_at`: Lifecycle timestamps

Relationships:
- Belongs to `Event` and `EventAlbum`
- Creates or resumes guest `Participant` and `ClientNickname` records

Validation:
- Active slug must be unique
- Disabled or expired access cannot create new uploads or tags

## Participant

Represents an organizer or guest in an event album.

Fields:
- `id`: Unique participant identifier
- `event_id`: Parent event
- `album_id`: Parent album
- `auth_user_id`: Organizer or anonymous auth identity when available
- `role`: organizer, guest, reviewer
- `access_state`: active, revoked
- `client_nickname_id`: Assigned nickname for QR/link guests
- `created_at`, `revoked_at`: Lifecycle timestamps

Relationships:
- Belongs to one event album
- May upload many `MediaItem` records
- May create many `Tag` records

Validation:
- Active participants must have a role
- Guests entering through QR/link must have a nickname before upload/tag actions

## ClientNickname

Represents an automatically assigned event-scoped display identity.

Fields:
- `id`: Unique nickname identifier
- `event_id`: Parent event
- `album_id`: Parent album
- `display_name`: Assigned nickname
- `state`: active, retired
- `session_key_hash`: Optional association for returning guests
- `created_at`, `retired_at`: Lifecycle timestamps

Relationships:
- Belongs to one event album
- May be used by one active guest participant
- Appears on media, tags, and activity

Validation:
- Active nickname display names must be unique within an album
- Returning clients reuse the same nickname when session association is present

## MediaItem

Represents an uploaded photo or video.

Fields:
- `id`: Unique media identifier
- `album_id`: Parent album
- `event_id`: Parent event
- `uploader_participant_id`: Participant who uploaded
- `nickname_id`: Nickname shown for guest attribution
- `media_type`: image or video
- `original_object_key`: R2 object key for original media
- `upload_status`: pending, uploaded, failed, deleted
- `moderation_state`: visible, pending_review, hidden, removed
- `metadata_visibility`: private by default
- `uploaded_at`, `deleted_at`: Lifecycle timestamps

Relationships:
- Belongs to one event album
- Has many `Tag` records
- Has many `AlbumActivity` records

Validation:
- Completed media must have an object key and uploader
- Removed media is hidden from guests but retained according to retention policy

## Tag

Represents a free-form or people tag on a media item.

Fields:
- `id`: Unique tag identifier
- `album_id`: Parent album
- `media_item_id`: Tagged media
- `creator_participant_id`: Participant who created the tag
- `tag_type`: text or person
- `display_name`: Visible tag label
- `normalized_value`: Search/filter value
- `state`: active, removed
- `created_at`, `removed_at`: Lifecycle timestamps

Relationships:
- Belongs to one media item
- Created by one participant

Validation:
- Duplicate active normalized tags are not allowed on the same media item
- Only tag creator or organizer can edit/remove a tag

## AlbumActivity

Represents auditable album events.

Fields:
- `id`: Unique activity identifier
- `event_id`: Parent event
- `album_id`: Parent album
- `actor_participant_id`: Actor when known
- `nickname_id`: Guest nickname when relevant
- `activity_type`: event_created, share_created, nickname_assigned,
  media_uploaded, upload_failed, tag_added, tag_removed, media_removed,
  permissions_changed
- `subject_type`: event, album, share_access, media_item, tag, participant
- `subject_id`: Identifier of affected subject
- `created_at`: Activity timestamp

Validation:
- Activity payloads must not include private media content or sensitive metadata
