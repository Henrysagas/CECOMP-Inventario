import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterLink, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from './auth.service'; // Asegúrate de importar tu servicio de autenticación
import { Router } from '@angular/router'; // Importa Router
import { filter } from 'rxjs/operators';
import { LogVisitaService } from './services/log-visita.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isCollapsed = false;
  isLoggedIn = false; // Estado inicial de inicio de sesión
  isAdmin: boolean = false; // Estado inicial para el rol de administrador
  constructor(
    private authService: AuthService,
    private router: Router,
    private logVisitaService: LogVisitaService
  ) {
    // Suscribirse a los cambios en el estado de autenticación
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    // Suscribirse al estado del rol del usuario
    this.authService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin; // Actualiza el estado de isAdmin
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (this.isLoggedIn) {
          const accion = this.obtenerAccionNavegacion(event.urlAfterRedirects);
          if (accion) {
            this.logVisitaService.registrarVisita(event.urlAfterRedirects, accion).subscribe();
          }
        }
      });
  }
  gestionarSesion() {
    if (this.isLoggedIn) {
      this.logVisitaService.registrarVisita(this.router.url, 'cerrar sesion').subscribe();
      this.authService.logout();
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private obtenerAccionNavegacion(url: string): string | null {
    const ruta = url.split('?')[0];

    if (ruta.startsWith('/log-visitas')) {
      return 'consultar log de visitas';
    }

    if (ruta.startsWith('/reportes')) {
      return 'consultar modulo de reportes';
    }

    if (ruta.startsWith('/ver-reporte')) {
      return 'consultar reporte de transferencia';
    }

    if (ruta.startsWith('/nuevo-bien')) {
      return 'abrir formulario de agregar bien';
    }

    if (ruta.startsWith('/detalles') || ruta.startsWith('/bienes/')) {
      return 'consultar detalle de bien';
    }

    if (ruta.startsWith('/bienes')) {
      return 'consultar bienes';
    }

    if (ruta.startsWith('/usuarios')) {
      return 'consultar usuarios';
    }

    if (ruta.startsWith('/register')) {
      return 'abrir formulario de agregar usuario';
    }

    if (ruta.startsWith('/transferencia')) {
      return 'abrir formulario de transferencia';
    }

    if (ruta.startsWith('/categorias')) {
      return 'consultar categorias';
    }

    if (ruta.startsWith('/ubicacion')) {
      return 'consultar ubicaciones';
    }

    if (ruta.startsWith('/perfil')) {
      return 'consultar perfil';
    }

    if (ruta.startsWith('/login')) {
      return null;
    }

    return 'navegar en el sistema';
  }
}

