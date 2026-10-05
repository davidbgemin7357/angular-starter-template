import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isAuthRoute = route.routeConfig?.path === 'login';

    if (isAuthRoute) {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/'], { replaceUrl: true });
        return false;
      }
      return true;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    return true;
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): boolean {
    return this.canActivate(childRoute);
  }
}
