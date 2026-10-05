import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of, tap } from 'rxjs';
import { AuthUser, LoginResponse } from './auth.interface';

const TOKEN_STORAGE_KEY = 'accessToken';
const USER_STORAGE_KEY = 'authUser';
const MOCK_DELAY_MS = 400;

/**
 * Autenticacion simulada: no hay backend. Cualquier codigo + PIN que pase las validaciones
 * del formulario inicia sesion. El usuario y un token falso se guardan en localStorage para
 * que la sesion sobreviva a una recarga (ver refresh()).
 *
 * Mantiene la misma interfaz publica que el AuthService original de sis-eficiencia-operativa,
 * asi el layout se puede volver a conectar a un backend real cambiando solo este archivo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = null;
  private readonly userDataSubject = new BehaviorSubject<AuthUser | null>(null);
  public readonly userData$ = this.userDataSubject.asObservable();
  private readonly authStateSubject = new BehaviorSubject<boolean>(false);
  public readonly authState$ = this.authStateSubject.asObservable();

  public login(codigo: string, _password: string): Observable<LoginResponse> {
    const response: LoginResponse = {
      token: `mock-token-${Date.now()}`,
      usuario: {
        nIdUsuario: 1,
        vCodigo: codigo.toUpperCase(),
        vNombres: codigo.charAt(0).toUpperCase() + codigo.slice(1).toLowerCase(),
        vApellidos: 'Demo',
        eRol: 'ADMIN',
      },
    };

    return of(response).pipe(
      delay(MOCK_DELAY_MS),
      tap(({ token, usuario }) => this.setSession(token, usuario)),
    );
  }

  /** Restaura la sesion guardada en localStorage al arrancar la app. */
  public refresh(): Observable<boolean> {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedToken || !storedUser) {
      this.clearSession();
      return of(false);
    }

    try {
      this.setSession(storedToken, JSON.parse(storedUser) as AuthUser);
      return of(true);
    } catch {
      this.clearSession();
      return of(false);
    }
  }

  public logout(): void {
    this.clearSession();
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUserData(): AuthUser | null {
    return this.userDataSubject.value;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  private setSession(token: string, usuario: AuthUser): void {
    this.token = token;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    this.userDataSubject.next(usuario);
    this.authStateSubject.next(true);
  }

  private clearSession(): void {
    this.token = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.userDataSubject.next(null);
    this.authStateSubject.next(false);
  }
}
