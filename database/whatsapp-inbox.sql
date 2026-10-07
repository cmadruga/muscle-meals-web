-- WhatsApp Inbox — tablas y función auxiliar
-- Correr en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS wa_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_phone   text NOT NULL UNIQUE,
  contact_name    text,
  last_message_at timestamptz,
  unread_count    int  DEFAULT 0,
  status          text DEFAULT 'open',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wa_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES wa_conversations(id) ON DELETE CASCADE,
  direction       text NOT NULL CHECK (direction IN ('in', 'out')),
  body            text,
  wa_msg_id       text UNIQUE,
  sent_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_conv ON wa_messages(conversation_id, sent_at);

-- Función atómica: upsert conversación + incrementa unread_count
CREATE OR REPLACE FUNCTION wa_upsert_conversation(p_phone text, p_name text, p_time timestamptz)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO wa_conversations (contact_phone, contact_name, last_message_at, unread_count)
  VALUES (p_phone, p_name, p_time, 1)
  ON CONFLICT (contact_phone) DO UPDATE SET
    last_message_at = p_time,
    unread_count    = wa_conversations.unread_count + 1,
    contact_name    = COALESCE(p_name, wa_conversations.contact_name)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
