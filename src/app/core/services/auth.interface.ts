export type UserRole = 'ADMIN' | 'OPERARIO';

export interface AuthUser {
  nIdUsuario: number;
  vCodigo: string;
  vNombres: string;
  vApellidos: string;
  eRol: UserRole;
}

export interface LoginResponse {
  token: string;
  usuario: AuthUser;
}
