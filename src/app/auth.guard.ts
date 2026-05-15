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
    if (typeof window === 'undefined') {
      return false;
    }

    const token = localStorage.getItem('token');
    const userRole = this.authService.getStoredRole();

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = route.data['roles'] as number[] | undefined;
    if (allowedRoles?.length && (!userRole || !allowedRoles.includes(userRole))) {
      this.router.navigate([this.authService.canManageInventory(userRole) ? '/bienes' : '/verbienes']);
      return false;
    }

    return true;
  }
}
