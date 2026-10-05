import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownItemComponent } from '@shared/components/dropdown/dropdown-item/dropdown-item.component';
import { DropdownComponent } from '@shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent],
})
export class NotificationDropdownComponent {
  isOpen = false;
  notifying = true;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.notifying = false;
  }

  closeDropdown() {
    this.isOpen = false;
  }
}
