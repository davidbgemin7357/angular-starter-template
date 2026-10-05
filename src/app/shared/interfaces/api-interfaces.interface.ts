export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  code?: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiEnvelopeSuccess<T> {
  success: true;
  data: T;
  error: null;
  meta: ApiMeta;
}

export interface ApiEnvelopeError {
  success: false;
  data: null;
  error: ApiError;
  meta: ApiMeta;
}

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeError;

export interface UserModuleSection {
  sectionName: string;
  userModule: UserModule[];
}

export interface UserModule {
  id: number;
  name: string;
  description: string;
  icon: string;
  children: UserModuleChild[];
  path?: string;
  new?: boolean;
}

export interface UserModuleChild {
  id: number;
  name: string;
  description: string;
  icon: string;
  path?: string;
  pro?: boolean;
  new?: boolean;
}
