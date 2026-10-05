import { Component, signal } from '@angular/core';
import { DbComponentCardComponent, DbFileInputComponent, FileInputResult } from 'db-ui-kit';

/** Vitrina de db-file-input: simple, extensiones permitidas, tamaño máximo, múltiple con
 * mínimo/máximo, error externo, obligatorio y deshabilitado. */
@Component({
  selector: 'app-file-input-demo',
  imports: [DbComponentCardComponent, DbFileInputComponent],
  templateUrl: './file-input-demo.component.html',
  styles: ``,
})
export class FileInputDemoComponent {
  public lastEvent = signal('Ninguno');
  public selectedNames = signal<string[]>([]);
  public lastError = signal<string | null>(null);

  public readonly imageExtensions: string[] = ['.jpg', '.jpeg', '.png'];
  public readonly externalError: string = 'El documento fue rechazado por el servidor';

  public onValueChange(source: string, result: FileInputResult): void {
    const names = result.file.map((file) => file.name);
    this.selectedNames.set(names);
    this.lastError.set(result.error);
    this.lastEvent.set(
      `${source} → ${names.length} archivo(s)${result.error ? `, error: "${result.error}"` : ''}`,
    );
  }
}
