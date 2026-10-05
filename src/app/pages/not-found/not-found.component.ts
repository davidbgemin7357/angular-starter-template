import { Component } from '@angular/core';
import { Location } from '@angular/common';


@Component({
  selector: 'app-not-found',
  templateUrl: 'not-found.component.html'
})

export class NotFoundComponent {
  public currentYear: number = new Date().getFullYear();

  constructor(private location: Location) {}

  public return() {
    this.location.back();
  }
}
