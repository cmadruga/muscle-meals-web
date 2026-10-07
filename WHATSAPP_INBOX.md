# WhatsApp Inbox — Plan de implementación

## Estado: BLOQUEADO — pendiente decisión de arquitectura Meta

---

## Hallazgo clave (oct 2026)

El número de WhatsApp de Muscle Meals está registrado dentro de la **Meta App de AssistIA**
(App ID: 1741218223481746, Business: Assist IA). Los webhooks de WhatsApp se configuran
a nivel de app — si AssistIA ya tiene webhook activo, todos los mensajes entrantes van a
sus servidores, no a los nuestros.

### Opciones (elegir una antes de implementar):

| Opción | Descripción | Pros | Contras |
|--------|-------------|------|---------|
| **A** | Crear Meta App propia de Muscle Meals + migrar número | Independiente, control total | Requiere proceso de migración de número con Meta |
| **B** | Pedirle a Assistia/Rafa forwarding del webhook | Sin migración | Dependencia permanente de Assistia |
| **C** | Usar Assistia como inbox directamente | Ya está construido y funciona | Costo de licencia, no integrado en /panel |

**Siguiente paso:** Decidir opción A, B o C antes de escribir código.
Preguntar a Rafa si hay webhook activo en el número de MM y cuál es la mejor ruta.

---

## Contexto

Actualmente Muscle Meals envía mensajes vía WhatsApp Cloud API (templates de confirmación
de pago, alertas internas). No hay forma de ver ni responder las conversaciones entrantes.

El objetivo es una vista `/panel/inbox` simple: lista de conversaciones, thread de mensajes,
responder texto libre, y enviar templates cuando aplique.

---

## Lo que necesitas confirmar en Meta for Developers

La configuración actual de WhatsApp probablemente está ligada a la app de Assistia.
Necesitas determinar si puedes reusar o si debes crear una app nueva para Muscle Meals.

### Preguntas a resolver:

1. **¿Existe una Meta App de Muscle Meals?**
   - En [developers.facebook.com](https://developers.facebook.com) → Mis apps
   - Busca si hay una app con nombre Muscle Meals o similar

2. **¿El WHATSAPP_PHONE_ID actual está en la app de Assistia o en una propia?**
   - El `WHATSAPP_PHONE_ID` que tienes en `.env` → ¿en cuál app de Meta aparece ese número?
   - Si está en Assistia → necesitas migrar o crear app propia

3. **¿Hay webhook configurado actualmente para ese número?**
   - WhatsApp → Configuration → Webhook en la app que tiene el phone number
   - Si hay uno apuntando a Assistia, recibirán los mensajes ellos, no tú

4. **¿El número de teléfono es tuyo o de Assistia?**
   - Si el número pertenece a la cuenta de Assistia como proveedor, hay que ver cómo separarlo

### Escenarios posibles:

| Escenario | Qué hacer |
|-----------|-----------|
| Tienes tu propia Meta App con tu número | Solo configurar webhook → directo a implementar |
| El número está en app de Assistia pero es tuyo | Migrar número a app propia de MM |
| Todo está en Assistia | Crear Meta App nueva + agregar/migrar número |

---

## Arquitectura planeada (lo más simple posible)

```
Meta WhatsApp Cloud API
        │
        │  webhook POST (mensajes entrantes)
        ▼
/api/webhooks/whatsapp  ←── Next.js API route
        │
        ▼
   Supabase
   wa_conversations + wa_messages
        │
        ▼
/panel/inbox  ←── UI de admin (polling o Supabase Realtime)
```

---

## Qué hay que construir

### 1. Tablas en Supabase

```sql
CREATE TABLE wa_conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_phone text NOT NULL,
  contact_name  text,
  last_message_at timestamptz,
  unread_count  int DEFAULT 0,
  status        text DEFAULT 'open',  -- open | closed
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE wa_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES wa_conversations(id),
  direction       text NOT NULL,  -- in | out
  body            text,
  wa_msg_id       text UNIQUE,    -- ID de Meta (evita duplicados)
  sent_at         timestamptz DEFAULT now()
);
```

### 2. Webhook receiver → `/api/webhooks/whatsapp`
- Verificación GET (Meta requiere esto al configurar el webhook)
- POST: recibe mensaje → upsert conversación → insert mensaje → 200 OK
- Patrón ya existe en `/api/webhooks/mercadopago/route.ts`

### 3. UI `/panel/inbox`
- **Lista izquierda**: conversaciones ordenadas por `last_message_at`
- **Thread derecha**: mensajes al seleccionar conversación
- **Input de respuesta**: llama a `sendWhatsAppText()` existente
- **Botón template**: para ventana >24h (templates ya existen en whatsapp.ts)
- Actualización: polling cada 5-10s (simple) o Supabase Realtime (reactivo)

---

## Limitación de WhatsApp (importante)

- **Dentro de 24h** del último mensaje del cliente → texto libre permitido
- **Después de 24h** → solo templates aprobados (ya los tienes)
- El UI debe indicar cuánto tiempo queda en la ventana de 24h

---

## Estimado de trabajo (una vez confirmado Meta)

| Tarea | Tiempo estimado |
|-------|----------------|
| Tablas Supabase | 1h |
| Webhook receiver | 2-3h |
| UI básico de inbox | 1 día |
| Responder + templates | 2-3h |
| **Total** | **~2 días** |

---

## Siguiente paso

Carlos revisa Meta for Developers y confirma:
- Qué app tiene el número actual
- Si hay webhook configurado y a dónde apunta
- Si el número es propio o de Assistia

Con esa info se define si se puede implementar directo o hay pasos previos de migración.
