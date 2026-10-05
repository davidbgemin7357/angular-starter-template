import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { DemoPageComponent } from './pages/demo/demo-page.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AuthGuard } from './core/guards/auth.guard';
import { COMPONENT_DEMO_ROUTES } from './pages/components-demo/components-demo.routes';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      // Vitrinas de cada componente de db-ui-kit (ver ModuleService, menu "Componentes").
      ...COMPONENT_DEMO_ROUTES,
      // Pagina generica para las opciones del menu demo (ver ModuleService).
      {
        path: 'demo/:slug',
        component: DemoPageComponent,
      },
    ],
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
