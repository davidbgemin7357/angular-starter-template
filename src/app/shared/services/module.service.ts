import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserModuleSection } from '@shared/interfaces/api-interfaces.interface';

/** Menu estatico de demostracion. En sis-eficiencia-operativa este menu venia del backend
 * (GET /usuario/modulos); aqui se define a mano para probar el sidebar sin backend.
 * Los `path` no llevan "/" inicial: el sidebar los compara contra `/${path}`. */
const MENU_DEMO: UserModuleSection[] = [
  {
    sectionName: 'MENU',
    userModule: [
      { id: 1, name: 'Inicio', description: 'Pagina de inicio', icon: 'home', path: '', children: [] },
      {
        id: 2,
        name: 'Componentes',
        description: 'Componentes de db-ui-kit',
        icon: 'widgets',
        children: [
          { id: 21, name: 'Button', description: 'DbButton', icon: 'smart_button', path: 'demo/button' },
          { id: 22, name: 'Badge', description: 'DbBadge', icon: 'label', path: 'demo/badge' },
          { id: 23, name: 'Card', description: 'DbComponentCard', icon: 'dashboard', path: 'demo/card' },
          { id: 24, name: 'Text Box', description: 'DbTextBox', icon: 'text_fields', path: 'demo/text-box' },
          { id: 25, name: 'Number Box', description: 'DbNumberBox', icon: 'pin', path: 'demo/number-box' },
          { id: 26, name: 'Text Area', description: 'DbTextArea', icon: 'notes', path: 'demo/text-area' },
          { id: 27, name: 'Select Box', description: 'DbSelectBox', icon: 'arrow_drop_down_circle', path: 'demo/select-box' },
          { id: 28, name: 'Multi Select', description: 'DbMultiSelect', icon: 'checklist', path: 'demo/multi-select' },
          { id: 29, name: 'Checkbox', description: 'DbCheckbox', icon: 'check_box', path: 'demo/checkbox' },
          { id: 30, name: 'Radio', description: 'DbRadio', icon: 'radio_button_checked', path: 'demo/radio' },
          { id: 31, name: 'Switch', description: 'DbSwitch', icon: 'toggle_on', path: 'demo/switch' },
          { id: 32, name: 'Date Picker', description: 'DbDatePicker', icon: 'calendar_month', path: 'demo/date-picker' },
          { id: 33, name: 'File Input', description: 'DbFileInput', icon: 'upload_file', path: 'demo/file-input' },
          { id: 34, name: 'Data Table', description: 'DbDataTable', icon: 'table', path: 'demo/data-table' },
          { id: 35, name: 'Modal', description: 'DbModal', icon: 'web_asset', path: 'demo/modal' },
          { id: 36, name: 'Alert Modal', description: 'DbAlertModal', icon: 'warning', path: 'demo/alert-modal' },
          { id: 37, name: 'Confirm Modal', description: 'DbConfirmModal', icon: 'help', path: 'demo/confirm-modal' },
          { id: 38, name: 'Toast', description: 'DbToast', icon: 'notifications', path: 'demo/toast' },
          { id: 39, name: 'Loader', description: 'DbLoader', icon: 'progress_activity', path: 'demo/loader' },
          { id: 40, name: 'Gallery', description: 'DbGallery', icon: 'photo_library', path: 'demo/gallery' },
          { id: 41, name: 'Tooltip', description: 'DbTooltip', icon: 'tooltip', path: 'demo/tooltip' },
          { id: 42, name: 'HTML Editor', description: 'DbHtmlEditor', icon: 'edit_note', path: 'demo/html-editor' },
          { id: 43, name: 'Liquid Glass', description: 'Tema Liquid Glass', icon: 'blur_on', path: 'demo/glass' },
        ],
      },
      { id: 3, name: 'Reportes', description: 'Reportes', icon: 'bar_chart', path: 'demo/reportes', children: [] },
    ],
  },
  {
    sectionName: 'OTROS',
    userModule: [
      { id: 4, name: 'Configuracion', description: 'Configuracion', icon: 'settings', path: 'demo/configuracion', children: [] },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class ModuleService {
  getUserModules(): Observable<UserModuleSection[]> {
    return of(MENU_DEMO);
  }
}
