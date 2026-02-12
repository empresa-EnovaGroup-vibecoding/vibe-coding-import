# PRP-001: Hardening & Mejoras - App de Spas (vibe-coding-import)

> **Estado**: PENDIENTE
> **Fecha**: 2026-02-12
> **Proyecto**: vibe-coding-import (SaaS de Gestion de Spas/Salones)

---

## Objetivo

Llevar la app de spas de "MVP funcional" a "produccion-ready" aplicando los principios de SaaS Factory: seguridad, rendimiento, calidad de codigo y experiencia de usuario.

## Por Que

| Problema | Solucion |
|----------|----------|
| Secrets hardcodeados en codigo fuente | Variables de entorno seguras |
| Sin tests (0 tests escritos) | Test suite basico con Vitest |
| Carga todo sin paginacion (lento con muchos datos) | Paginacion + lazy loading |
| TypeScript permisivo (any implicito) | Strict mode progresivo |
| Queries N+1 (multiples llamadas innecesarias) | Joins optimizados en Supabase |
| Error handling inconsistente | Patron estandar con toast |
| Sin audit log (no sabes quien cambio que) | Tabla de auditoria |
| ESLint muy permisivo | Reglas mas estrictas |

**Valor de negocio**: App lista para clientes reales. Menos bugs, mas rapida, mas segura. Confianza para vender suscripciones.

## Que

### Criterios de Exito
- [ ] Zero secrets en codigo fuente (todo en .env)
- [ ] TypeScript strict mode activado sin errores
- [ ] Paginacion en listas de clientes, citas y reportes
- [ ] Queries optimizadas (max 1-2 llamadas por pagina)
- [ ] Error handling estandarizado (toast en todos los catch)
- [ ] Al menos 10 tests unitarios cubriendo hooks criticos
- [ ] Lazy loading en paginas no criticas
- [ ] Audit log basico funcionando
- [ ] Build exitoso sin warnings criticos

### Comportamiento Esperado
La app funciona igual que antes visualmente, pero por debajo:
- Es mas rapida (menos queries, lazy loading)
- Es mas segura (secrets protegidos, audit trail)
- Es mas mantenible (TypeScript estricto, tests)
- Escala mejor (paginacion)

---

## Contexto

### Stack Actual (respetamos lo que ya existe)
| Capa | Tecnologia |
|------|------------|
| Framework | Vite 5.4 + React 18 + TypeScript 5.8 |
| Estilos | Tailwind CSS 3.4 + shadcn/ui |
| Backend | Supabase (Auth + DB + RLS) |
| Estado | React Context + TanStack Query |
| Validacion | Zod (parcial) |
| Testing | Vitest (configurado, sin tests) |

### Archivos Clave
- `src/integrations/supabase/client.ts` - Cliente Supabase (secrets hardcodeados)
- `src/hooks/useAuth.tsx` - Autenticacion
- `src/hooks/useTenant.tsx` - Multi-tenant logic
- `src/App.tsx` - 37 rutas (sin lazy loading)
- `tsconfig.json` - TypeScript lenient
- `eslint.config.js` - Reglas muy permisivas
- `supabase/migrations/` - 18 migraciones

### Base de Datos
- 17 tablas con RLS
- Multi-tenant con tenant_id en todas las tablas
- Funciones SQL: is_super_admin, get_user_tenant_ids, etc.
- Enums: appointment_status, tenant_role, payment_method

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo FASES. Las subtareas se generan al entrar a cada fase.

### Fase 1: Seguridad - Secrets y Variables de Entorno
**Objetivo**: Eliminar todos los secrets hardcodeados del codigo fuente
**Que se hace**:
- Mover Supabase URL y API Key a `.env` con prefijo `VITE_`
- Actualizar `src/integrations/supabase/client.ts` para leer de `import.meta.env`
- Actualizar `.env.example` con las variables necesarias
- Verificar que `.env` esta en `.gitignore`
**Validacion**: `grep -r "supabase.co" src/` no encuentra URLs hardcodeadas

### Fase 2: TypeScript Strict Mode
**Objetivo**: Activar strict mode y corregir errores de tipos
**Que se hace**:
- Activar `strict: true` en `tsconfig.json` (incluye noImplicitAny, strictNullChecks)
- Corregir errores de tipo progresivamente (archivo por archivo)
- Reemplazar `any` implicitos con tipos correctos
- Agregar null checks donde falten
**Validacion**: `npx tsc --noEmit` pasa sin errores

### Fase 3: Optimizacion de Queries
**Objetivo**: Reducir llamadas a Supabase usando joins y selects optimizados
**Que se hace**:
- Identificar queries N+1 en paginas principales (Appointments, Clients, POS)
- Reemplazar con `.select("*, clients(*), services(*)")` (joined queries)
- Verificar que RLS no bloquea los joins
**Validacion**: Network tab muestra max 1-2 requests por pagina (antes: 4-5)

### Fase 4: Paginacion
**Objetivo**: Las listas grandes cargan por paginas en vez de todo de golpe
**Que se hace**:
- Agregar paginacion a: Clientes, Citas, Inventario, Ventas, Reportes
- Usar `.range(from, to)` de Supabase
- Componente reutilizable de paginacion (o infinite scroll)
- Mantener busqueda/filtros compatibles con paginacion
**Validacion**: Lista de clientes carga max 20 items, boton "cargar mas" o paginas

### Fase 5: Lazy Loading de Paginas
**Objetivo**: La app carga mas rapido al no importar todas las paginas de golpe
**Que se hace**:
- Usar `React.lazy()` + `Suspense` en `App.tsx` para paginas no criticas
- Paginas criticas (Dashboard, Auth) se mantienen eager
- Paginas lazy: Reports, SuperAdmin, Settings, Packages, Cabins, Expenses
- Loading fallback con spinner o skeleton
**Validacion**: Bundle analyzer muestra chunks separados por pagina

### Fase 6: Error Handling Estandarizado
**Objetivo**: Todos los errores se muestran al usuario de forma consistente
**Que se hace**:
- Patron: `try/catch` + `toast.error(mensaje)` en TODAS las operaciones async
- Eliminar `console.error` sueltos sin feedback al usuario
- Agregar Error Boundaries en paginas principales
- Mensajes de error en espanol y amigables
**Validacion**: Simular error de red y verificar que usuario ve toast informativo

### Fase 7: Audit Log Basico
**Objetivo**: Registrar quien hizo que y cuando en operaciones criticas
**Que se hace**:
- Crear tabla `audit_log` (user_id, action, table_name, record_id, old_data, new_data, timestamp)
- Trigger SQL en tablas criticas: clients, appointments, sales, inventory
- RLS: solo owners y super_admin pueden ver logs
- Pagina simple para ver el log (solo owners)
**Validacion**: Editar un cliente y verificar que aparece en audit_log

### Fase 8: Tests Unitarios Basicos
**Objetivo**: Cobertura minima de tests en la logica mas critica
**Que se hace**:
- Tests para `useAuth` hook (login, logout, session management)
- Tests para `useTenant` hook (multi-tenant logic, role checks)
- Tests para funciones utilitarias (formateo precios, fechas, validaciones)
- Tests para componentes criticos (POS cart calculations)
- Configurar test script en package.json
**Validacion**: `npm run test` pasa con 10+ tests verdes

### Fase 9: ESLint + Limpieza de Codigo
**Objetivo**: Reglas mas estrictas para evitar bugs comunes
**Que se hace**:
- Activar `no-unused-vars` como error
- Activar `react-refresh/only-export-components` como error
- Limpiar imports no usados
- Eliminar codigo muerto
- Estandarizar nombres (camelCase funciones, PascalCase componentes)
**Validacion**: `npm run lint` pasa sin errores

### Fase 10: Validacion Final
**Objetivo**: Sistema funcionando end-to-end, todo integrado
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] `npm run test` pasa (10+ tests)
- [ ] `npm run lint` pasa
- [ ] App funciona en navegador (login, CRUD, POS)
- [ ] Criterios de exito cumplidos
- [ ] Zero secrets en codigo

---

## Gotchas

> Cosas criticas a tener en cuenta ANTES de implementar

- [ ] Vite usa `VITE_` como prefijo para env vars (no NEXT_PUBLIC_)
- [ ] El proyecto usa React Context, NO Zustand (respetar patron existente)
- [ ] TanStack Query maneja cache - tener cuidado con invalidaciones al paginar
- [ ] RLS puede bloquear joins si las policies no permiten SELECT en tablas relacionadas
- [ ] Vitest ya esta configurado en `vitest.config.ts` (no crear nuevo)
- [ ] El proyecto mezcla npm y bun (bun.lockb existe) - usar npm por consistencia
- [ ] shadcn/ui ya tiene componentes de tabla y paginacion que podemos reutilizar
- [ ] Multi-tenant: TODAS las queries deben filtrar por tenant_id

## Anti-Patrones

- NO cambiar el stack (seguir con Vite + React 18, NO migrar a Next.js)
- NO reorganizar carpetas (respetar estructura actual src/pages + src/components)
- NO agregar dependencias nuevas si las existentes resuelven el problema
- NO romper features existentes por "mejorar" el codigo
- NO tocar RLS policies existentes sin verificar que siguen funcionando
- NO eliminar codigo sin entender por que esta ahi

---

## Orden de Prioridad Sugerido

```
CRITICO (hacer primero):
  Fase 1: Secrets          (30 min) - Seguridad basica
  Fase 6: Error Handling   (2-3 hrs) - UX inmediata

ALTO (hacer segundo):
  Fase 3: Queries          (2-3 hrs) - Performance
  Fase 4: Paginacion       (3-4 hrs) - Escalabilidad
  Fase 5: Lazy Loading     (1-2 hrs) - Performance

MEDIO (hacer tercero):
  Fase 2: TypeScript       (4-6 hrs) - Calidad codigo
  Fase 7: Audit Log        (2-3 hrs) - Compliance
  Fase 8: Tests            (3-4 hrs) - Confiabilidad

BAJO (hacer al final):
  Fase 9: ESLint           (1-2 hrs) - Mantenibilidad
  Fase 10: Validacion      (1 hr) - Cierre
```

**Total estimado: ~20-28 horas de trabajo del agente**

---

## Aprendizajes (Self-Annealing)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

*(Vacio - se llena durante la ejecucion)*

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
