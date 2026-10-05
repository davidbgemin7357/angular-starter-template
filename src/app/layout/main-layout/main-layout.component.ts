import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserModuleSection } from '@shared/interfaces/api-interfaces.interface';
import { AppHeaderComponent } from '@shared/layout/app-header/app-header.component';
import { AppSidebarComponent } from '@shared/layout/app-sidebar/app-sidebar.component';
import { BackdropComponent } from '@shared/layout/backdrop/backdrop.component';
import { ModuleService } from '@shared/services/module.service';
import { SidebarService } from '@shared/services/sidebar.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  imports: [CommonModule, RouterModule, AppHeaderComponent, AppSidebarComponent, BackdropComponent],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authSubscription: Subscription = Subscription.EMPTY;
  public userModules: UserModuleSection[] = [];
  readonly isExpanded$;
  readonly isHovered$;
  readonly isMobileOpen$;

  constructor(
    private authService: AuthService,
    private router: Router,
    private moduleService: ModuleService,
    private cdr: ChangeDetectorRef,
    public sidebarService: SidebarService,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.authState$.subscribe((isAuth) => {
      if (!isAuth) {
        this.router.navigate(['/login'], { replaceUrl: true });
      } else {
        this.getUserModules();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
  }

  public getUserModules(): void {
    const userData = this.authService.getUserData();
    if (!userData) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.moduleService.getUserModules().subscribe({
      next: (sections) => {
        this.userModules = sections;
        this.cdr.detectChanges();
      },
      error: () => {
        this.authService.logout();
        this.router.navigate(['/login'], { replaceUrl: true });
      },
    });
  }
}
