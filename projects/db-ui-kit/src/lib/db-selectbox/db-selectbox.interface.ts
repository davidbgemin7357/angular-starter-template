export type OptionColor = 'success' | 'warning' | 'danger';

export interface Option {
  code: number | string;
  name: string;
  externalId?: string | null;
  active?: boolean;
  description?: string;
  color?: OptionColor;
  icon?: string;
}
