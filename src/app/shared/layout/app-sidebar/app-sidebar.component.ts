import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { UserModuleSection } from '@shared/interfaces/api-interfaces.interface';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnChanges {
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;
  @Input() userModules: UserModuleSection[] = [];
  public openSubmenu: string | null | number = null;
  public subMenuHeights: { [key: string]: number } = {};

  public readonly isExpanded$;
  public readonly isMobileOpen$;
  public readonly isHovered$;

  private subscription: Subscription = new Subscription();

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      }),
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        },
      ),
    );

    this.setActiveMenuFromRoute(this.router.url);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userModules']) {
      this.setActiveMenuFromRoute(this.router.url);
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  isActive(path: string): boolean {
    const currentUrl = this.router.url;

    if (!path || path === '/') {
      return currentUrl === '/';
    }

    const fullPath = `/${path}`;
    return currentUrl === fullPath || currentUrl.startsWith(fullPath + '/');
  }

  hasActiveChild(nav: { children?: { path?: string }[] }): boolean {
    return !!nav.children?.some((child) => this.isActive(child.path!));
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$
      .subscribe((expanded) => {
        if (!expanded) {
          this.sidebarService.setHovered(true);
        }
      })
      .unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    this.userModules.forEach((section) => {
      section.userModule.forEach((nav, i) => {
        if (nav.children && nav.children.length > 0) {
          if (this.hasActiveChild(nav)) {
            const key = `main-${i}`;
            this.openSubmenu = key;

            setTimeout(() => {
              const el = document.getElementById(key);
              if (el) {
                this.subMenuHeights[key] = el.scrollHeight;
                this.cdr.detectChanges();
              }
            });
          }
        }
      });
    });
  }

  public onSubmenuClick(): void {
    this.isMobileOpen$
      .subscribe((isMobile) => {
        if (isMobile) {
          this.sidebarService.setMobileOpen(false);
        }
      })
      .unsubscribe();
  }
}
