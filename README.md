# Valorización Minera — Web Admin

Panel de administración (oficina) para el ecosistema de valorización minera. Complementa la app móvil offline; no reemplaza el motor de cálculo en campo.

## Stack

- Next.js 15 (App Router) + TypeScript
- AWS Amplify Gen 2 (Cognito + AppSync)
- Tailwind CSS + componentes estilo shadcn/ui
- React Hook Form + Zod
- TanStack Query

## Inicio rápido

```bash
npm install
npm run sandbox   # genera amplify_outputs.json (Cognito + AppSync)
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) → redirige a `/admin/dashboard`.

## Roles web (MVP)

| Rol | Acceso |
|-----|--------|
| **admin** | CRUD maestros (maquila, etc.) |
| **supervisor** | Lectura + exportación futura |
| **operador** | Solo app móvil |

Asigne usuarios staff desde **Usuarios** en el panel (crea en Cognito + `UserProfile`) o manualmente en consola AWS.

## Módulos

| Ruta | Estado |
|------|--------|
| `/admin/dashboard` | Activo |
| `/admin/maquila` | Activo (vertical slice) |
| `/admin/configuracion` | Activo — defaults comerciales (singleton `AppSettings`) |
| `/admin/materiales` | Activo — catálogo tipos MAT (`MaterialType`) |
| `/admin/proveedores` | Activo — catálogo proveedores + defaults (`Provider`, `ProviderDefaults`) |
| `/admin/usuarios` | Activo — usuarios staff (`UserProfile` + Cognito vía Lambda) |
| `/admin/valorizaciones` | Activo — consulta valorizaciones (`Valuation`, solo lectura) |
| Auditoría | Próximamente (nav preparada) |

## Relación con app móvil

- **Web:** fuente maestra de `maquila_ranges`, defaults, MAT, proveedores (fases siguientes).
- **Móvil:** cotización offline, PDF, historial local.
- **Sync:** preparado en esquema (`syncStatus` en `Valuation`); no implementado en esta fase.

## Deploy

`amplify.yml` — backend `ampx pipeline-deploy` + build Next.js.
