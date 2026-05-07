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
          this.logVisitaService.registrarVisita(event.urlAfterRedirects).subscribe();
        }
      });
  }
  gestionarSesion() {
    if (this.isLoggedIn) {
      this.logVisitaService.registrarVisita(this.router.url, 'logout').subscribe();
      this.authService.logout();
      this.router.navigate(['/login']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}

