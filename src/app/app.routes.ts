import { Routes } from '@angular/router';
import { BienesComponent } from './bienes/bienes.component';
import { AgregarBienComponent } from './nuevo-bien/nuevo-bien.component';
import { DetallesComponent } from './detalles/detalles.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { UbicacionesComponent } from './ubicacion/ubicacion.component';
import { ReporteComponent } from './reporte/reporte.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard'; // Asegúrate de importar el guardia de autenticación
import { VerbienesComponent } from './verbienes/verbienes.component';
import { VerBienComponent } from './verbien/verbien.component';
import { VerReporteComponent } from './ver-reporte/ver-reporte.component';
import { RegisterComponent } from './register/register.component';
import { PerfilComponent } from './perfil/perfil.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { HistorialMovimientosComponent } from './bienes/historial-movimientos/historial-movimientos.component';
import { HistorialResponsablesComponent } from './bienes/historial-responsables/historial-responsables.component';
import { LogVisitasComponent } from './log-visitas/log-visitas.component';

export const routes: Routes = [
  { path: '', redirectTo: '/bienes', pathMatch: 'full' },
  { path: 'login', component: LoginComponent }, // Ruta de Login
  { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES), canActivate: [authGuard] },
  
  // Rutas para administradores (con data role 'admin')
  { path: 'bienes', component: BienesComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'bienes/nuevo', component: AgregarBienComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'detalles/:id', component: DetallesComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'categorias', component: CategoriasComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'ambientes', component: UbicacionesComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'reportes', component: ReporteComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'transferencia', component: TransferenciaComponent, canActivate: [authGuard], data: { role: 'admin' } },
  { path: 'register', component: RegisterComponent, canActivate: [authGuard], data: { role: 'admin' }},
  { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard], data: { role: 'admin' }},
  { path: 'log-visitas', component: LogVisitasComponent, canActivate: [authGuard], data: { role: 'admin' }},


  // Rutas para usuarios no administradores (sin necesidad de rol admin)
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard]},
  { path: 'verbienes', component: VerbienesComponent, canActivate: [authGuard] },
  { path: 'verbien/:id', component: VerBienComponent, canActivate: [authGuard] },
  { path: 'ver-reporte/:id', component: VerReporteComponent, canActivate: [authGuard] },
{ path: 'historial-movimientos/:id', component: HistorialMovimientosComponent, canActivate: [authGuard] },
{ path: 'historial-responsables/:id', component: HistorialResponsablesComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '/welcome' } // Redirige cualquier ruta desconocida a Inicio
  
];
