import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DB_HTML_EDITOR_FULL_TOOLBAR,
  DbButtonComponent,
  DbComponentCardComponent,
  DbHtmlEditorComponent,
  DbHtmlEditorFocusEvent,
  DbHtmlEditorToolbarItem,
} from 'db-ui-kit';

const INITIAL_CONTENT = `
<h2>Editor HTML de db-ui-kit</h2>
<p>Este editor admite <strong>negrita</strong>, <em>cursiva</em>, <u>subrayado</u>, <s>tachado</s>,
<span style="color: #465fff;">color de texto</span>, <span style="background-color: #fef0c7;">resaltado</span>,
x<sub>2</sub>, x<sup>2</sup> y <a href="https://quilljs.com" target="_blank">enlaces</a>.</p>
<p style="text-align: center;"><span style="font-family: Georgia; font-size: 18px;">Párrafo centrado con otra fuente y tamaño</span></p>
<h3>Listas</h3>
<ol><li>Primer paso</li><li>Segundo paso</li></ol>
<ul><li>Viñeta</li><li>Otra viñeta</li></ul>
<ul><li data-list="checked">Tarea completada</li><li data-list="unchecked">Tarea pendiente</li></ul>
<blockquote>Las citas resaltan un texto importante.</blockquote>
<pre>const saludo = 'Hola mundo';
console.log(saludo);</pre>
<h3>Tabla</h3>
<table><tbody>
<tr><td>Producto</td><td>Cantidad</td><td>Precio</td></tr>
<tr><td>Teclado</td><td>2</td><td>S/ 120.00</td></tr>
<tr><td>Mouse</td><td>5</td><td>S/ 45.00</td></tr>
</tbody></table>
<h3>Imagen</h3>
<p><img src="assets/images/logo/logo-icon.svg" alt="Logo" width="64"></p>
<p>Haz clic en la imagen para cambiar su tamaño o alineación.</p>
`;

/** Vitrina de db-html-editor: editor completo con todas las opciones (texto, listas, tablas,
 * imágenes, enlaces...), formulario reactivo con validación, barra personalizada y estados. */
@Component({
  selector: 'app-html-editor-demo',
  imports: [DbHtmlEditorComponent, DbComponentCardComponent, DbButtonComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './html-editor-demo.component.html',
  styles: `
    .html-preview h2 { font-size: 1.5em; font-weight: 700; margin: 0.4em 0; }
    .html-preview h3 { font-size: 1.25em; font-weight: 600; margin: 0.4em 0; }
    .html-preview p { margin: 0.25em 0; }
    .html-preview a { color: var(--color-brand-500); text-decoration: underline; }
    .html-preview ol { list-style: decimal; padding-left: 1.5em; }
    .html-preview ul { list-style: disc; padding-left: 1.5em; }
    .html-preview li[data-list='checked'] { list-style: '☑ '; }
    .html-preview li[data-list='unchecked'] { list-style: '☐ '; }
    .html-preview blockquote { border-left: 4px solid var(--color-brand-300); padding-left: 1em; color: var(--color-gray-500); }
    .html-preview pre { background: var(--color-gray-900); color: var(--color-gray-100); padding: 0.75em 1em; border-radius: 0.5rem; white-space: pre-wrap; }
    .html-preview table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
    .html-preview td { border: 1px solid var(--color-gray-300); padding: 0.375rem 0.5rem; }
    .html-preview img { display: inline-block; max-width: 100%; }
  `,
})
export class HtmlEditorDemoComponent {
  private readonly sanitizer = inject(DomSanitizer);

  public readonly fullToolbar: DbHtmlEditorToolbarItem[] = DB_HTML_EDITOR_FULL_TOOLBAR;
  public readonly basicToolbar: DbHtmlEditorToolbarItem[] = [
    'bold', 'italic', 'underline', 'separator',
    'orderedList', 'bulletList', 'separator',
    'link', 'separator', 'clear',
  ];
  public readonly maxLength: number = 150;

  public lastEvent = signal('ninguno');
  public fullHtml = signal(INITIAL_CONTENT.trim());
  public previewMode = signal<'render' | 'html'>('render');
  /** Solo para la vista previa del demo: el HTML lo escribe el propio usuario en el editor y
   * Quill ya sanea los enlaces. Sin esto Angular quitaría los atributos style (colores, alineación). */
  public previewHtml = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.fullHtml()));
  public basicHtml: string = '<p>Solo formato <strong>básico</strong>.</p>';
  public readOnlyHtml: string =
    '<p>Contenido de <strong>solo lectura</strong>: se puede seleccionar y copiar, pero no editar.</p>';
  public disabledHtml: string = '<p>Editor <em>deshabilitado</em>.</p>';

  public readonly form = new FormGroup({
    asunto: new FormControl('', { nonNullable: true }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  public submitted = signal(false);

  public handleFullChange(value: string): void {
    this.fullHtml.set(value);
    this.lastEvent.set(`valueChange (${value.length} caracteres de HTML)`);
  }

  public handleFocus(kind: 'focusIn' | 'focusOut', event: DbHtmlEditorFocusEvent): void {
    this.lastEvent.set(`${kind} → "${event.text.slice(0, 40)}${event.text.length > 40 ? '…' : ''}"`);
  }

  public resetFull(): void {
    this.fullHtml.set(INITIAL_CONTENT.trim());
    this.lastEvent.set('contenido restaurado');
  }

  public submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
  }

  get descripcionError(): boolean {
    const control = this.form.controls.descripcion;
    return control.invalid && (control.touched || this.submitted());
  }
}
