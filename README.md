# CRM clínico — Next.js + Supabase

## 1. Estructura de carpetas

```
project/
├── .env.local.example
├── README.md
├── app/
│   ├── page.js                        ← dashboard (Agenda / Pacientes / Ajustes)
│   └── api/
│       ├── availability/route.js      ← GET  /api/availability
│       └── appointments/route.js      ← POST /api/appointments
├── utils/
│   ├── supabase.js                    ← cliente para el navegador (anon key)
│   └── supabase-server.js             ← cliente para servidor (service role key)
└── supabase/
    └── schema.sql                     ← tablas + RLS + Realtime
```

## 2. Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y pega el contenido completo de `supabase/schema.sql`. Ejecútalo.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca la subas a git ni la pongas en el frontend)
4. Copia estas rutas dentro de un proyecto Next.js 14+ (App Router) existente, o crea uno nuevo:
   ```bash
   npx create-next-app@latest mi-crm --js --app --tailwind --no-src-dir
   cd mi-crm
   npm install @supabase/supabase-js
   ```
5. Copia `app/page.js`, `app/api/*`, `utils/*` y `supabase/schema.sql` a tu proyecto.
6. Crea `.env.local` a partir de `.env.local.example` y llena las 3 variables.
7. `npm run dev` y abre `http://localhost:3000`.

## 3. Cómo lo consume el Agente de Voz (Vapi / Buildmyagent)

El agente nunca toca Supabase directamente — habla por HTTP con tu app,
igual que cualquier otro cliente:

1. **Consultar disponibilidad**
   ```
   GET https://tu-dominio.com/api/availability?date=2026-09-15&service_id=UUID&staff_id=UUID
   ```
   Respuesta:
   ```json
   {
     "date": "2026-09-15",
     "available_slots": ["09:00", "09:30", "10:30", "..."]
   }
   ```

2. **Agendar la cita**
   ```
   POST https://tu-dominio.com/api/appointments
   Content-Type: application/json

   {
     "client_name": "María López",
     "client_phone": "+52 998 123 4567",
     "service_id": "UUID",
     "staff_id": "UUID",
     "date": "2026-09-15",
     "time": "10:30"
   }
   ```
   El endpoint crea al cliente si no existe, vuelve a validar que el
   horario siga libre (evita que dos llamadas agenden el mismo hueco
   a la vez) y devuelve la cita creada con status `201`.

En la plataforma del agente de voz (Vapi/Buildmyagent), estos dos
endpoints se configuran como "functions"/"tools" que el modelo de
voz puede invocar durante la llamada.

## 4. Seguridad — léelo antes de ir a producción real

`supabase/schema.sql` deja las políticas de RLS abiertas
(`using (true)`) para que el dashboard funcione sin login todavía.
Eso es aceptable para un solo negocio de uso interno, pero **no**
para un SaaS multi-cliente público. Antes de eso:

- Agrega Supabase Auth y una columna `business_id` en cada tabla.
- Cambia las políticas a `using (business_id = auth.uid())` (o al
  esquema de roles que definas).
- Las rutas `app/api/*` seguirán funcionando igual porque usan la
  `service_role` key, que ignora RLS — ahí sí necesitas validar tú
  mismo a qué negocio pertenece cada request (por ejemplo, con un
  API key propio por negocio en el header `Authorization`).

## 5. Realtime

`schema.sql` agrega la tabla `appointments` a la publicación
`supabase_realtime`. El dashboard se suscribe a esos cambios en
`app/page.js`, así que cuando el agente de voz crea una cita vía
`/api/appointments`, la lista y el toast de "nueva cita" aparecen
solos, sin recargar la página.
