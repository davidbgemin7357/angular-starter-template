import { Component, OnDestroy, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DropdownComponent } from '@shared/components/dropdown/dropdown.component';
import { DropdownItemTwoComponent } from '@shared/components/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from 'src/app/core/services/auth.service';
import { AuthUser } from 'src/app/core/services/auth.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [
    CommonModule,
    RouterModule,
    DropdownComponent,
    // DropdownItemTwoComponent
  ],
})
export class UserDropdownComponent implements OnInit, OnDestroy {
  public isOpen: boolean = false;
  public userData?: AuthUser | null;
  private userDataSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userDataSubscription = this.authService.userData$.subscribe((userData) => {
      this.userData = userData;
    });
  }

  ngOnDestroy(): void {
    this.userDataSubscription.unsubscribe();
  }

  public toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  public closeDropdown(): void {
    this.isOpen = false;
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
