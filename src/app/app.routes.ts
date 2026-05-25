import { Routes } from '@angular/router';
import { BienesComponent } from './bienes/bienes.component';
import { AgregarBienComponent } from './nuevo-bien/nuevo-bien.component';
import { DetallesComponent } from './detalles/detalles.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { UbicacionesComponent } from './ubicacion/ubicacion.component';
import { ReporteComponent } from './reporte/reporte.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { VerbienesComponent } from './verbienes/verbienes.component';
import { VerBienComponent } from './verbien/verbien.component';
import { VerReporteComponent } from './ver-reporte/ver-reporte.component';
import { RegisterComponent } from './register/register.component';
import { PerfilComponent } from './perfil/perfil.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { HistorialMovimientosComponent } from './bienes/historial-movimientos/historial-movimientos.component';
import { HistorialResponsablesComponent } from './bienes/historial-responsables/historial-responsables.component';
import { LogVisitasComponent } from './log-visitas/log-visitas.component';
import { ObservacionesBienComponent } from './observaciones-bien/observaciones-bien.component';

const INVENTORY_ROLES = [AuthService.ROLE_ADMIN, AuthService.ROLE_SUPER_ADMIN];
const SUPER_ADMIN_ROLES = [AuthService.ROLE_SUPER_ADMIN];

export const routes: Routes = [
  { path: '', redirectTo: '/verbienes', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES), canActivate: [authGuard] },

  { path: 'bienes', component: BienesComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'bienes/nuevo', component: AgregarBienComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'detalles/:id', component: DetallesComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'categorias', component: CategoriasComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'ambientes', component: UbicacionesComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'transferencia', component: TransferenciaComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'observaciones', component: ObservacionesBienComponent, canActivate: [authGuard], data: { roles: INVENTORY_ROLES } },
  { path: 'log-visitas', component: LogVisitasComponent, canActivate: [authGuard], data: { roles: SUPER_ADMIN_ROLES }},

  { path: 'register', component: RegisterComponent, canActivate: [authGuard], data: { roles: SUPER_ADMIN_ROLES }},
  { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard], data: { roles: SUPER_ADMIN_ROLES }},

  { path: 'reportes', component: ReporteComponent, canActivate: [authGuard] },
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard]},
  { path: 'verbienes', component: VerbienesComponent, canActivate: [authGuard] },
  { path: 'verbien/:id', component: VerBienComponent, canActivate: [authGuard] },
  { path: 'ver-reporte/:id', component: VerReporteComponent, canActivate: [authGuard] },
  { path: 'historial-movimientos/:id', component: HistorialMovimientosComponent, canActivate: [authGuard] },
  { path: 'historial-responsables/:id', component: HistorialResponsablesComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '/verbienes' }
];
