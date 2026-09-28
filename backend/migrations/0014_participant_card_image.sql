-- Filename of the personalized WhatsApp greeting card image for a participant,
-- served back through GET /imagenes/:filename. Nullable: cards are generated
-- and uploaded by a separate pipeline, so a participant may not have one yet.
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS card_image_filename text;
