import { Routes } from '@angular/router';

/** Rutas lazy de las vitrinas de db-ui-kit. Deben ir antes de `demo/:slug` en app.routes. */
export const COMPONENT_DEMO_ROUTES: Routes = [
  { path: 'demo/button', loadComponent: () => import('./button/button-demo.component').then((m) => m.ButtonDemoComponent) },
  { path: 'demo/badge', loadComponent: () => import('./badge/badge-demo.component').then((m) => m.BadgeDemoComponent) },
  { path: 'demo/card', loadComponent: () => import('./card/card-demo.component').then((m) => m.CardDemoComponent) },
  { path: 'demo/text-box', loadComponent: () => import('./text-box/text-box-demo.component').then((m) => m.TextBoxDemoComponent) },
  { path: 'demo/number-box', loadComponent: () => import('./number-box/number-box-demo.component').then((m) => m.NumberBoxDemoComponent) },
  { path: 'demo/text-area', loadComponent: () => import('./text-area/text-area-demo.component').then((m) => m.TextAreaDemoComponent) },
  { path: 'demo/select-box', loadComponent: () => import('./select-box/select-box-demo.component').then((m) => m.SelectBoxDemoComponent) },
  { path: 'demo/multi-select', loadComponent: () => import('./multi-select/multi-select-demo.component').then((m) => m.MultiSelectDemoComponent) },
  { path: 'demo/checkbox', loadComponent: () => import('./checkbox/checkbox-demo.component').then((m) => m.CheckboxDemoComponent) },
  { path: 'demo/radio', loadComponent: () => import('./radio/radio-demo.component').then((m) => m.RadioDemoComponent) },
  { path: 'demo/switch', loadComponent: () => import('./switch/switch-demo.component').then((m) => m.SwitchDemoComponent) },
  { path: 'demo/date-picker', loadComponent: () => import('./date-picker/date-picker-demo.component').then((m) => m.DatePickerDemoComponent) },
  { path: 'demo/file-input', loadComponent: () => import('./file-input/file-input-demo.component').then((m) => m.FileInputDemoComponent) },
  { path: 'demo/data-table', loadComponent: () => import('./data-table/data-table-demo.component').then((m) => m.DataTableDemoComponent) },
  { path: 'demo/modal', loadComponent: () => import('./modal/modal-demo.component').then((m) => m.ModalDemoComponent) },
  { path: 'demo/alert-modal', loadComponent: () => import('./alert-modal/alert-modal-demo.component').then((m) => m.AlertModalDemoComponent) },
  { path: 'demo/confirm-modal', loadComponent: () => import('./confirm-modal/confirm-modal-demo.component').then((m) => m.ConfirmModalDemoComponent) },
  { path: 'demo/toast', loadComponent: () => import('./toast/toast-demo.component').then((m) => m.ToastDemoComponent) },
  { path: 'demo/loader', loadComponent: () => import('./loader/loader-demo.component').then((m) => m.LoaderDemoComponent) },
  { path: 'demo/gallery', loadComponent: () => import('./gallery/gallery-demo.component').then((m) => m.GalleryDemoComponent) },
  { path: 'demo/tooltip', loadComponent: () => import('./tooltip/tooltip-demo.component').then((m) => m.TooltipDemoComponent) },
  { path: 'demo/html-editor', loadComponent: () => import('./html-editor/html-editor-demo.component').then((m) => m.HtmlEditorDemoComponent) },
  { path: 'demo/glass', loadComponent: () => import('./glass/glass-demo.component').then((m) => m.GlassDemoComponent) },
];
