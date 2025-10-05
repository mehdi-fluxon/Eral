-- Migrate existing notes to interactions
INSERT INTO interactions (id, contactId, teamMemberId, type, subject, content, outcome, interactionDate, createdAt, updatedAt)
SELECT
  id,
  contactId,
  teamMemberId,
  'NOTE' as type,
  NULL as subject,
  content,
  NULL as outcome,
  createdAt as interactionDate,
  createdAt,
  createdAt as updatedAt
FROM notes;

-- Drop the notes table
DROP TABLE notes;
