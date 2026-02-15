# Nexus - Panel de Gestion para Negocios de Bienestar y Belleza

Panel administrativo multi-tenant (SaaS) para centros de bienestar, spas, clinicas esteticas y salones de belleza. Permite gestionar citas, clientes, inventario, punto de venta, reportes financieros y mas desde una sola plataforma.

Mercado objetivo: Guatemala y Latinoamerica.

---

## Descripcion

Nexus centraliza las operaciones diarias de un negocio de bienestar:

- **Dashboard** con metricas del dia (ingresos, citas, clientes activos) y citas de hoy
- **Citas** con calendario visual, asignacion de especialista y cabina
- **Clientes** con historial, evaluaciones clinicas (facial, corporal), fotos y paquetes asignados
- **Punto de Venta (POS)** con escaneo QR para cobros rapidos
- **Servicios** con catalogo configurable e importacion masiva desde Excel/CSV
- **Inventario** con codigos QR, importacion desde archivos y Google Sheets
- **Reportes financieros** (ingresos, servicios populares, metodos de pago, gastos)
- **Paquetes** (bundles de servicios con sesiones)
- **Equipo** (gestion de especialistas y personal)
- **Cabinas/salas** con disponibilidad en tiempo real
- **Reservas online** via link publico para clientes (`/book/:slug`)
- **WhatsApp** para recordatorios de citas
- **Comprobantes con IA** (extraccion de datos con Gemini Vision)
- **Notificaciones en tiempo real** para reservas online (Supabase Realtime)
- **Multi-tenant** con roles (owner, staff, super_admin)
- **PWA** instalable en dispositivos moviles
- **Modo oscuro/claro**
- **Sistema de prueba** con periodo trial y membresia Pro

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|------------|---------|
| Build tool | Vite | 5.x |
| Frontend | React + TypeScript | 18.3 |
| Estilos | Tailwind CSS + Shadcn UI (Radix) | 3.4 |
| Backend | Supabase (Auth + PostgreSQL + Storage + Realtime) | 2.x |
| Data fetching | TanStack React Query | 5.x |
| Routing | React Router | 6.x |
| Formularios | React Hook Form + Zod | 7.x / 3.x |
| Graficas | Recharts | 2.x |
| QR | html5-qrcode | 2.x |
| Tema | next-themes | 0.3 |
| Testing | Vitest + Testing Library | 3.x |

---

## Estructura del Proyecto

```
src/
├── app.tsx                      # Router principal, providers, lazy loading
├── main.tsx                     # Entry point
├── index.css                    # Estilos globales + Tailwind
│
├── pages/                       # Paginas de la aplicacion
│   ├── Index.tsx                # Landing / redirect
│   ├── Auth.tsx                 # Login / Registro
│   ├── Onboarding.tsx           # Setup inicial del negocio
│   ├── Dashboard.tsx            # Panel principal con metricas
│   ├── Appointments.tsx         # Gestion de citas
│   ├── Clients.tsx              # Gestion de clientes
│   ├── Services.tsx             # Catalogo de servicios
│   ├── Inventory.tsx            # Control de inventario
│   ├── POS.tsx                  # Punto de venta
│   ├── Reports.tsx              # Reportes financieros
│   ├── Expenses.tsx             # Control de gastos
│   ├── Packages.tsx             # Paquetes de servicios
│   ├── Team.tsx                 # Equipo / especialistas
│   ├── Cabins.tsx               # Cabinas / salas
│   ├── Settings.tsx             # Configuracion del negocio
│   ├── Membership.tsx           # Membresia Pro / pagos
│   ├── UserManagement.tsx       # Gestion de usuarios (owner)
│   ├── Admin.tsx                # Panel admin
│   ├── PublicBooking.tsx        # Reserva publica (sin auth)
│   ├── ConfirmAppointment.tsx   # Confirmacion de cita
│   ├── AcceptInvite.tsx         # Aceptar invitacion de equipo
│   └── super-admin/            # Panel super-administrador
│       ├── SuperAdminDashboard.tsx
│       ├── SuperAdminTenants.tsx
│       ├── SuperAdminTenantDetail.tsx
│       └── SuperAdminRevenue.tsx
│
├── components/                  # Componentes organizados por feature
│   ├── auth/                    # RequireAuth, RequireOwner, RequireSubscription, RequireSuperAdmin, RoleSetup
│   ├── cabins/                  # CabinList, CabinFormDialog
│   ├── clients/                 # EditClientDialog, FacialEvaluationForm, ClientPackages, AssignPackageDialog, EvaluationHistoryList
│   ├── dashboard/               # InactiveClients
│   ├── inventory/               # InventoryImportModal, FileUploadTab, GoogleSheetsTab, ColumnMappingStep, ImportPreviewStep
│   ├── layout/                  # MainLayout (sidebar + header)
│   ├── membership/              # MembershipCard, MembershipModal
│   ├── packages/                # PackageFormDialog
│   ├── pos/                     # QRScanner
│   ├── services/                # ServicesImportModal, ServiceColumnMappingStep, ServiceImportPreviewStep
│   ├── settings/                # BusinessHoursCard
│   ├── shared/                  # TablePagination
│   ├── super-admin/             # SuperAdminLayout
│   ├── team/                    # TeamMemberList, TeamMemberFormDialog
│   ├── ui/                      # Shadcn UI (button, dialog, form, table, etc.)
│   ├── users/                   # InviteDialog
│   └── NavLink.tsx
│
├── hooks/                       # Hooks personalizados
│   ├── useAuth.tsx              # Autenticacion (AuthProvider + useAuth)
│   ├── useTenant.tsx            # Multi-tenant (TenantProvider + useTenant)
│   ├── useUserRole.tsx          # Rol del usuario actual
│   ├── usePremiumGate.tsx       # Verificar acceso premium
│   ├── use-mobile.tsx           # Detectar dispositivo movil
│   └── use-toast.ts             # Sistema de notificaciones toast
│
├── integrations/
│   └── supabase/
│       └── client.ts            # Cliente Supabase configurado
│
├── lib/                         # Utilidades
│   ├── audit.ts                 # Registro de auditoria
│   └── evaluation-forms.ts      # Definicion de formularios de evaluacion
│
└── test/                        # Tests
    ├── example.test.ts
    ├── business-logic.test.ts
    └── table-pagination.test.tsx
```

---

## Instalacion

### Requisitos previos

- Node.js 18 o superior
- npm (incluido con Node.js)
- Un proyecto en [Supabase](https://supabase.com) con las tablas configuradas

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/empresa-EnovaGroup-vibecoding/glow-subs-revisarcolores.git
cd glow-subs-revisarcolores

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
```

Editar el archivo `.env` con los datos de tu proyecto Supabase:

```env
VITE_SUPABASE_PROJECT_ID="tu_project_id_aqui"
VITE_SUPABASE_PUBLISHABLE_KEY="tu_publishable_key_aqui"
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
```

```bash
# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicacion estara disponible en `http://localhost:8080`.

---

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (puerto 8080) |
| `npm run build` | Build de produccion |
| `npm run build:dev` | Build en modo development |
| `npm run preview` | Preview del build de produccion |
| `npm run lint` | Ejecutar ESLint |
| `npm run test` | Ejecutar tests (Vitest, una sola vez) |
| `npm run test:watch` | Ejecutar tests en modo watch |

---

## Roles y Permisos

| Rol | Acceso |
|-----|--------|
| `super_admin` | Panel `/super-admin` - gestion de todos los tenants e ingresos de la plataforma |
| `owner` | Todo el panel del negocio, incluyendo: usuarios, equipo, cabinas, paquetes, configuracion |
| `staff` | Dashboard, citas, clientes, servicios, inventario, POS, reportes, gastos |

---

## Rutas Publicas

Estas rutas no requieren autenticacion:

| Ruta | Descripcion |
|------|-------------|
| `/auth` | Login y registro |
| `/book/:slug` | Reserva online para clientes del negocio |
| `/confirm/:token` | Confirmacion de cita |
| `/invite/:token` | Aceptar invitacion al equipo |

---

## Base de Datos

La base de datos usa PostgreSQL via Supabase con:

- 22+ tablas con Row Level Security (RLS) habilitado
- Aislamiento multi-tenant mediante `tenant_id` en todas las tablas de negocio
- Storage para comprobantes de pago y fotos de evaluaciones
- Realtime para notificaciones de reservas online
- Edge Functions para extraccion de comprobantes con IA (Gemini Vision)

---

## Notas de Desarrollo

- El proyecto usa **path aliases**: `@/` apunta a `src/`
- Las paginas usan **lazy loading** con `React.lazy()` para optimizar la carga inicial
- El build de produccion divide el codigo en chunks: `vendor-react`, `vendor-supabase`, `vendor-query`, `vendor-ui`, `vendor-utils`
- El proyecto fue creado con [Lovable](https://lovable.dev) y se puede editar tanto desde Lovable como desde un IDE local
- Los cambios pusheados al repositorio se reflejan automaticamente en Lovable y viceversa
