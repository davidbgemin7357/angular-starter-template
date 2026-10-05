
import { Component, Input } from '@angular/core';

@Component({
  selector: 'db-card',
  imports: [],
  templateUrl: './db-card.component.html',
  styles: ``
})
export class DbComponentCardComponent {

  @Input() title!: string;
  @Input() desc: string = '';
  @Input() className: string = '';
}
