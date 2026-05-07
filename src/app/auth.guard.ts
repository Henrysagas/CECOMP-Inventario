import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class authGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verificar si estamos en el entorno del navegador
    if (typeof window === 'undefined') {
      return false; // Bloquear acceso si estamos en el lado del servidor
    }

    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('ID_ROL'); // Obtener el rol almacenado

    // Verificar si hay un token almacenado, lo que indica que el usuario está autenticado
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si la ruta es de administrador y si el usuario tiene ID_ROL igual a 1
    const isAdminRoute = route.data['role'] === 'admin';
    if (isAdminRoute && userRole !== '1') {
      this.router.navigate(['/login']);
      return false;
    }

    // Permitir acceso si cumple con las condiciones
    return true;
  }
}
