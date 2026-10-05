import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';
import type TableModule from 'quill/modules/table';
import {
  DbHtmlEditorFocusEvent,
  DbHtmlEditorInitializedEvent,
  DbHtmlEditorSelectOption,
} from './db-html-editor.interface';
import {
  DbHtmlEditorImageSource,
  DbHtmlEditorPopover,
  DbHtmlEditorToolbarItem,
} from './db-html-editor.types';

type QuillRange = { index: number; length: number };
type QuillFormats = Record<string, unknown>;
type TableAction =
  | 'insertRowAbove'
  | 'insertRowBelow'
  | 'insertColumnLeft'
  | 'insertColumnRight'
  | 'deleteRow'
  | 'deleteColumn'
  | 'deleteTable';

/** Barra completa: todas las opciones habilitadas (igual que el demo "full" de dxHtmlEditor). */
export const DB_HTML_EDITOR_FULL_TOOLBAR: DbHtmlEditorToolbarItem[] = [
  'undo', 'redo', 'separator',
  'header', 'font', 'size', 'separator',
  'bold', 'italic', 'underline', 'strike', 'separator',
  'color', 'background', 'separator',
  'subscript', 'superscript', 'separator',
  'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'separator',
  'orderedList', 'bulletList', 'checkList', 'outdent', 'indent', 'separator',
  'blockquote', 'codeBlock', 'separator',
  'link', 'image', 'separator',
  'insertTable', 'insertRowAbove', 'insertRowBelow', 'insertColumnLeft', 'insertColumnRight',
  'deleteRow', 'deleteColumn', 'deleteTable', 'separator',
  'clear',
];

const FONT_WHITELIST = ['Outfit', 'Arial', 'Georgia', 'Tahoma', 'Verdana', 'monospace'];
const SIZE_WHITELIST = ['10px', '12px', '14px', '16px', '18px', '24px', '32px'];
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const TABLE_ACTIONS: TableAction[] = [
  'insertRowAbove', 'insertRowBelow', 'insertColumnLeft', 'insertColumnRight',
  'deleteRow', 'deleteColumn', 'deleteTable',
];

/** Ancho aproximado de cada popover, para que no se salga del editor. */
const POPOVER_WIDTH: Record<Exclude<DbHtmlEditorPopover, null>, number> = {
  color: 232,
  background: 232,
  table: 232,
  link: 320,
  image: 320,
};

let quillFormatsRegistered = false;

/** Registra alineación, fuente y tamaño como estilos en línea (en vez de clases ql-*),
 * para que el HTML generado se vea igual fuera del editor. Se hace una sola vez. */
function registerQuillFormats(): void {
  if (quillFormatsRegistered) {
    return;
  }

  const align = Quill.import('attributors/style/align') as { whitelist?: string[] };
  const font = Quill.import('attributors/style/font') as { whitelist?: string[] };
  const size = Quill.import('attributors/style/size') as { whitelist?: string[] };
  font.whitelist = FONT_WHITELIST;
  size.whitelist = SIZE_WHITELIST;

  Quill.register(align as never, true);
  Quill.register(font as never, true);
  Quill.register(size as never, true);
  quillFormatsRegistered = true;
}

@Component({
  selector: 'db-html-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './db-html-editor.component.html',
  styleUrl: './db-html-editor.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbHtmlEditorComponent),
      multi: true,
    },
  ],
})
export class DbHtmlEditorComponent implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('editorRef', { static: true }) editorRef!: ElementRef<HTMLDivElement>;
  @ViewChild('rootRef', { static: true }) rootRef!: ElementRef<HTMLDivElement>;
  @ViewChild('surfaceRef', { static: true }) surfaceRef!: ElementRef<HTMLDivElement>;

  @Input() label?: string;
  @Input() required: boolean = false;
  @Input() placeholder: string = 'Escribe aquí...';
  @Input() hint: string = '';
  @Input() error: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() className: string = '';
  /** Alto del área de edición (el contenido hace scroll). */
  @Input() height: string = '300px';
  @Input() minHeight?: string;
  /** Elementos de la barra, en orden. Por defecto todos. Un arreglo vacío oculta la barra. */
  @Input() toolbar: DbHtmlEditorToolbarItem[] = DB_HTML_EDITOR_FULL_TOOLBAR;
  /** true: la barra se parte en varias líneas; false: una sola línea con scroll horizontal. */
  @Input() toolbarMultiline: boolean = true;
  /** Máximo de caracteres de texto (sin contar etiquetas). Muestra un contador. */
  @Input() maxLength?: number;
  /** Permite subir imágenes desde archivo, pegarlas o arrastrarlas (se guardan en base64). */
  @Input() allowImageUpload: boolean = true;
  /** Tamaño máximo por imagen subida, en KB. */
  @Input() imageMaxSizeKb: number = 2048;

  /** HTML del contenido. */
  @Output() valueChange = new EventEmitter<string>();
  /** Texto plano del contenido. */
  @Output() textChange = new EventEmitter<string>();
  @Output() focusIn = new EventEmitter<DbHtmlEditorFocusEvent>();
  @Output() focusOut = new EventEmitter<DbHtmlEditorFocusEvent>();
  @Output() initialized = new EventEmitter<DbHtmlEditorInitializedEvent>();

  value: string = '';
  textLength: number = 0;
  focused: boolean = false;
  formats: QuillFormats = {};
  inTable: boolean = false;
  canUndo: boolean = false;
  canRedo: boolean = false;

  openPopover: DbHtmlEditorPopover = null;
  popoverLeft: number = 0;
  popoverTop: number = 0;

  readonly tableGrid: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
  tableHoverRows: number = 0;
  tableHoverCols: number = 0;

  linkUrl: string = '';
  linkText: string = '';

  imageSource: DbHtmlEditorImageSource = 'url';
  imageUrl: string = '';
  imageAlt: string = '';
  imageWidth: string = '';
  imageError: string = '';

  selectedImage: HTMLImageElement | null = null;
  imageBarTop: number = 0;
  imageBarLeft: number = 0;

  readonly headerOptions: DbHtmlEditorSelectOption[] = [
    { label: 'Normal', value: false },
    { label: 'Título 1', value: 1 },
    { label: 'Título 2', value: 2 },
    { label: 'Título 3', value: 3 },
    { label: 'Título 4', value: 4 },
    { label: 'Título 5', value: 5 },
    { label: 'Título 6', value: 6 },
  ];
  readonly fontOptions: DbHtmlEditorSelectOption[] = [
    { label: 'Fuente', value: false },
    ...FONT_WHITELIST.map((font) => ({ label: font, value: font })),
  ];
  readonly sizeOptions: DbHtmlEditorSelectOption[] = [
    { label: 'Tamaño', value: false },
    ...SIZE_WHITELIST.map((size) => ({ label: size, value: size })),
  ];
  /** Paleta basada en los tokens del tema (brand, gray, success, error, warning...). */
  readonly palette: string[] = [
    '#000000', '#344054', '#667085', '#98a2b3', '#d0d5dd', '#f2f4f7', '#ffffff',
    '#465fff', '#0ba5ec', '#12b76a', '#f79009', '#fb6514', '#f04438', '#9e77ed',
    '#252dae', '#026aa2', '#027a48', '#b54708', '#c4320a', '#b42318', '#6941c6',
    '#dde9ff', '#e0f2fe', '#d1fadf', '#fef0c7', '#ffead5', '#fee4e2', '#ebe9fe',
  ];

  readonly buttonConfig: Partial<Record<DbHtmlEditorToolbarItem, { icon: string; title: string }>> = {
    undo: { icon: 'undo', title: 'Deshacer' },
    redo: { icon: 'redo', title: 'Rehacer' },
    bold: { icon: 'format_bold', title: 'Negrita' },
    italic: { icon: 'format_italic', title: 'Cursiva' },
    underline: { icon: 'format_underlined', title: 'Subrayado' },
    strike: { icon: 'strikethrough_s', title: 'Tachado' },
    color: { icon: 'format_color_text', title: 'Color de texto' },
    background: { icon: 'format_ink_highlighter', title: 'Color de fondo' },
    subscript: { icon: 'subscript', title: 'Subíndice' },
    superscript: { icon: 'superscript', title: 'Superíndice' },
    alignLeft: { icon: 'format_align_left', title: 'Alinear a la izquierda' },
    alignCenter: { icon: 'format_align_center', title: 'Centrar' },
    alignRight: { icon: 'format_align_right', title: 'Alinear a la derecha' },
    alignJustify: { icon: 'format_align_justify', title: 'Justificar' },
    orderedList: { icon: 'format_list_numbered', title: 'Lista numerada' },
    bulletList: { icon: 'format_list_bulleted', title: 'Lista con viñetas' },
    checkList: { icon: 'checklist', title: 'Lista de tareas' },
    indent: { icon: 'format_indent_increase', title: 'Aumentar sangría' },
    outdent: { icon: 'format_indent_decrease', title: 'Disminuir sangría' },
    blockquote: { icon: 'format_quote', title: 'Cita' },
    codeBlock: { icon: 'code_blocks', title: 'Bloque de código' },
    link: { icon: 'link', title: 'Insertar enlace' },
    image: { icon: 'image', title: 'Insertar imagen' },
    insertTable: { icon: 'table', title: 'Insertar tabla' },
    insertRowAbove: { icon: 'add_row_above', title: 'Insertar fila arriba' },
    insertRowBelow: { icon: 'add_row_below', title: 'Insertar fila abajo' },
    insertColumnLeft: { icon: 'add_column_left', title: 'Insertar columna a la izquierda' },
    insertColumnRight: { icon: 'add_column_right', title: 'Insertar columna a la derecha' },
    deleteRow: { icon: 'playlist_remove', title: 'Eliminar fila' },
    deleteColumn: { icon: 'view_column', title: 'Eliminar columna' },
    deleteTable: { icon: 'grid_off', title: 'Eliminar tabla' },
    clear: { icon: 'format_clear', title: 'Limpiar formato' },
  };

  private quill: Quill | null = null;
  private savedRange: QuillRange | null = null;
  private lastEmitted: string | null = null;
  private pendingValue: string | null = null;

  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  private readonly handleTextChange = (_delta: unknown, _old: unknown, source: string): void => {
    this.enforceMaxLength(source);
    this.emitValue();
    this.refreshState();
  };

  private readonly handleSelectionChange = (range: QuillRange | null, oldRange: QuillRange | null): void => {
    if (range) {
      this.savedRange = range;
      if (!this.focused) {
        this.focused = true;
        this.focusIn.emit(this.buildFocusEvent());
      }
    } else if (oldRange && this.focused) {
      this.focused = false;
      this.onTouchedFn();
      this.focusOut.emit(this.buildFocusEvent());
    }
    this.refreshState();
  };

  private readonly handleRootClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLImageElement && this.editable) {
      this.selectedImage = target;
      this.updateImageBarPosition();
    } else {
      this.selectedImage = null;
    }
    this.cdr.markForCheck();
  };

  private readonly handleRootScroll = (): void => {
    if (this.selectedImage) {
      this.updateImageBarPosition();
      this.cdr.markForCheck();
    }
  };

  get editable(): boolean {
    return !this.disabled && !this.readOnly;
  }

  get hasToolbar(): boolean {
    return this.toolbar.length > 0;
  }

  // ---------------------------------------------------------------- ciclo de vida

  ngAfterViewInit(): void {
    this.initQuill();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.quill) {
      return;
    }
    if (changes['disabled'] || changes['readOnly']) {
      this.applyEnabledState();
    }
    if (changes['placeholder']) {
      this.quill.root.setAttribute('data-placeholder', this.placeholder ?? '');
    }
  }

  ngOnDestroy(): void {
    if (!this.quill) {
      return;
    }
    this.quill.off('text-change', this.handleTextChange);
    this.quill.off('selection-change', this.handleSelectionChange);
    this.quill.root.removeEventListener('click', this.handleRootClick);
    this.quill.root.removeEventListener('scroll', this.handleRootScroll);
    this.quill = null;
  }

  // ---------------------------------------------------------------- ControlValueAccessor

  writeValue(value: string): void {
    const html = value ?? '';
    this.value = html;

    if (!this.quill) {
      this.pendingValue = html;
      return;
    }

    // Evita reescribir el contenido (y mover el cursor) con el mismo valor que acabamos de emitir.
    if (html === this.lastEmitted) {
      return;
    }
    this.setHtml(html);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.applyEnabledState();
  }

  // ---------------------------------------------------------------- API pública

  /** Instancia de Quill, para usos avanzados. */
  public getEditor(): Quill | null {
    return this.quill;
  }

  public focus(): void {
    this.quill?.focus();
  }

  public getHtml(): string {
    return this.readHtml();
  }

  public getText(): string {
    return this.readText();
  }

  /** Borra todo el contenido (se puede deshacer). */
  public clear(): void {
    if (!this.quill || !this.editable) {
      return;
    }
    this.quill.setText('', 'user');
  }

  /** Inserta HTML en la posición del cursor (o al final si el editor no tiene selección). */
  public insertHtml(html: string): void {
    if (!this.quill || !this.editable) {
      return;
    }
    const index = this.currentRange()?.index ?? this.quill.getLength() - 1;
    this.quill.clipboard.dangerouslyPasteHTML(index, html, 'user');
  }

  // ---------------------------------------------------------------- barra de herramientas

  isButton(item: DbHtmlEditorToolbarItem): boolean {
    return item in this.buttonConfig && !this.isPopoverItem(item);
  }

  isPopoverItem(item: DbHtmlEditorToolbarItem): boolean {
    return item === 'color' || item === 'background' || item === 'link' || item === 'image' || item === 'insertTable';
  }

  isActive(item: DbHtmlEditorToolbarItem): boolean {
    const f = this.formats;
    switch (item) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'blockquote':
      case 'link':
      case 'color':
      case 'background':
        return !!f[item];
      case 'codeBlock':
        return !!f['code-block'];
      case 'subscript':
        return f['script'] === 'sub';
      case 'superscript':
        return f['script'] === 'super';
      case 'alignCenter':
        return f['align'] === 'center';
      case 'alignRight':
        return f['align'] === 'right';
      case 'alignJustify':
        return f['align'] === 'justify';
      case 'orderedList':
        return f['list'] === 'ordered';
      case 'bulletList':
        return f['list'] === 'bullet';
      case 'checkList':
        return f['list'] === 'checked' || f['list'] === 'unchecked';
      default:
        return this.openPopover !== null && this.popoverFor(item) === this.openPopover;
    }
  }

  isItemDisabled(item: DbHtmlEditorToolbarItem): boolean {
    if (!this.editable) {
      return true;
    }
    if (item === 'undo') {
      return !this.canUndo;
    }
    if (item === 'redo') {
      return !this.canRedo;
    }
    if (item === 'insertTable') {
      return this.inTable;
    }
    if ((TABLE_ACTIONS as string[]).includes(item)) {
      return !this.inTable;
    }
    return false;
  }

  buttonClasses(item: DbHtmlEditorToolbarItem): string {
    const base =
      'inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md px-1 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-40 ';

    if (this.isActive(item)) {
      return base + 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400';
    }
    return (
      base +
      'text-gray-600 enabled:hover:bg-gray-100 enabled:hover:text-gray-900 dark:text-gray-400 dark:enabled:hover:bg-white/5 dark:enabled:hover:text-white/90'
    );
  }

  get rootClasses(): string {
    let base = `relative w-full rounded-lg border shadow-theme-xs transition-[border-color,box-shadow] ${this.className} `;

    if (this.disabled) {
      base += 'bg-gray-100 opacity-50 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700';
    } else if (this.error) {
      base += 'bg-transparent border-error-500 dark:border-error-500 dark:bg-gray-900';
      if (this.focused) {
        base += ' border-error-300 ring-3 ring-error-500/10 dark:border-error-800';
      }
    } else {
      base += 'bg-transparent border-gray-300 dark:border-gray-700 dark:bg-gray-900';
      if (this.focused) {
        base += ' border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800';
      }
    }
    return base;
  }

  get selectClasses(): string {
    return 'h-8 shrink-0 cursor-pointer rounded-md border border-gray-200 bg-transparent px-2 text-xs text-gray-700 focus:border-brand-300 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-brand-800';
  }

  get currentHeader(): string {
    const header = this.formats['header'];
    return typeof header === 'number' ? String(header) : '';
  }

  get currentFont(): string {
    return typeof this.formats['font'] === 'string' ? (this.formats['font'] as string) : '';
  }

  get currentSize(): string {
    return typeof this.formats['size'] === 'string' ? (this.formats['size'] as string) : '';
  }

  optionValue(option: DbHtmlEditorSelectOption): string {
    return option.value === false ? '' : String(option.value);
  }

  /** Ejecuta un botón simple de la barra. */
  exec(item: DbHtmlEditorToolbarItem): void {
    const quill = this.quill;
    if (!quill || this.isItemDisabled(item)) {
      return;
    }

    this.closePopover();
    const f = this.formats;
    const range = this.restoreSelection();

    switch (item) {
      case 'undo':
        quill.history.undo();
        break;
      case 'redo':
        quill.history.redo();
        break;
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'blockquote':
        quill.format(item, !f[item], 'user');
        break;
      case 'codeBlock':
        quill.format('code-block', !f['code-block'], 'user');
        break;
      case 'subscript':
        quill.format('script', f['script'] === 'sub' ? false : 'sub', 'user');
        break;
      case 'superscript':
        quill.format('script', f['script'] === 'super' ? false : 'super', 'user');
        break;
      case 'alignLeft':
        quill.format('align', false, 'user');
        break;
      case 'alignCenter':
        quill.format('align', 'center', 'user');
        break;
      case 'alignRight':
        quill.format('align', 'right', 'user');
        break;
      case 'alignJustify':
        quill.format('align', 'justify', 'user');
        break;
      case 'orderedList':
        quill.format('list', f['list'] === 'ordered' ? false : 'ordered', 'user');
        break;
      case 'bulletList':
        quill.format('list', f['list'] === 'bullet' ? false : 'bullet', 'user');
        break;
      case 'checkList':
        quill.format('list', this.isActive('checkList') ? false : 'unchecked', 'user');
        break;
      case 'indent':
        quill.format('indent', '+1', 'user');
        break;
      case 'outdent':
        quill.format('indent', '-1', 'user');
        break;
      case 'clear':
        this.clearFormat(range);
        break;
      default:
        if ((TABLE_ACTIONS as string[]).includes(item)) {
          this.tableModule()?.[item as TableAction]();
        }
        break;
    }
    this.refreshState();
  }

  onSelectChange(format: 'header' | 'font' | 'size', event: Event): void {
    const quill = this.quill;
    if (!quill || !this.editable) {
      return;
    }
    const raw = (event.target as HTMLSelectElement).value;
    this.restoreSelection();

    if (format === 'header') {
      quill.format('header', raw ? Number(raw) : false, 'user');
    } else {
      quill.format(format, raw || false, 'user');
    }
    this.refreshState();
  }

  // ---------------------------------------------------------------- popovers

  togglePopover(item: DbHtmlEditorToolbarItem, event: MouseEvent): void {
    const popover = this.popoverFor(item);
    if (!popover || this.isItemDisabled(item)) {
      return;
    }
    if (this.openPopover === popover) {
      this.closePopover();
      return;
    }

    this.savedRange = this.quill?.getSelection() ?? this.savedRange;
    this.selectedImage = null;
    this.positionPopover(popover, event.currentTarget as HTMLElement);
    this.openPopover = popover;

    if (popover === 'link' || popover === 'image') {
      if (popover === 'link') {
        this.prepareLinkDialog();
      } else {
        this.imageSource = 'url';
        this.imageUrl = '';
        this.imageAlt = '';
        this.imageWidth = '';
        this.imageError = '';
      }
      // Enfoca el primer campo del diálogo cuando ya se renderizó.
      setTimeout(() =>
        this.rootRef.nativeElement.querySelector<HTMLInputElement>('.db-html-editor__popover input')?.focus(),
      );
    } else if (popover === 'table') {
      this.tableHoverRows = 0;
      this.tableHoverCols = 0;
    }
  }

  closePopover(): void {
    this.openPopover = null;
  }

  applyColor(kind: 'color' | 'background', color: string | false): void {
    if (!this.quill || !this.editable) {
      return;
    }
    this.restoreSelection();
    this.quill.format(kind, color, 'user');
    this.closePopover();
    this.refreshState();
  }

  onCustomColor(kind: 'color' | 'background', event: Event): void {
    this.applyColor(kind, (event.target as HTMLInputElement).value);
  }

  hoverTable(rows: number, cols: number): void {
    this.tableHoverRows = rows;
    this.tableHoverCols = cols;
  }

  insertTable(rows: number, cols: number): void {
    if (!this.quill || !this.editable) {
      return;
    }
    this.restoreSelection();
    this.tableModule()?.insertTable(rows, cols);
    this.closePopover();
    this.refreshState();
  }

  applyLink(): void {
    const quill = this.quill;
    const url = this.linkUrl.trim();
    if (!quill || !this.editable || !url) {
      return;
    }

    const range = this.restoreSelection() ?? { index: quill.getLength() - 1, length: 0 };
    const existing = this.findLink(range.index);
    const target = range.length === 0 && existing ? existing : range;
    const currentText = quill.getText(target.index, target.length);
    const text = this.linkText.trim() || currentText || url;

    if (target.length > 0 && text === currentText) {
      quill.formatText(target.index, target.length, 'link', url, 'user');
    } else {
      if (target.length > 0) {
        quill.deleteText(target.index, target.length, 'user');
      }
      quill.insertText(target.index, text, 'link', url, 'user');
    }
    quill.setSelection(target.index + text.length, 0, 'user');
    this.closePopover();
    this.refreshState();
  }

  removeLink(): void {
    const quill = this.quill;
    if (!quill || !this.editable) {
      return;
    }
    const range = this.restoreSelection();
    if (range) {
      const target = range.length === 0 ? this.findLink(range.index) : range;
      if (target) {
        quill.formatText(target.index, target.length, 'link', false, 'user');
      }
    }
    this.closePopover();
    this.refreshState();
  }

  setImageSource(source: DbHtmlEditorImageSource): void {
    this.imageSource = source;
    this.imageError = '';
    this.imageUrl = '';
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.imageError = this.validateImageFile(file);
    if (this.imageError) {
      this.imageUrl = '';
      return;
    }
    this.readFileAsDataUrl(file).then((dataUrl) => {
      this.imageUrl = dataUrl;
      if (!this.imageAlt) {
        this.imageAlt = file.name.replace(/\.[^.]+$/, '');
      }
      this.cdr.markForCheck();
    });
  }

  applyImage(): void {
    const quill = this.quill;
    const url = this.imageUrl.trim();
    if (!quill || !this.editable || !url) {
      return;
    }

    const range = this.restoreSelection() ?? { index: quill.getLength() - 1, length: 0 };
    if (range.length > 0) {
      quill.deleteText(range.index, range.length, 'user');
    }
    quill.insertEmbed(range.index, 'image', url, 'user');

    const attributes: Record<string, string> = {};
    if (this.imageAlt.trim()) {
      attributes['alt'] = this.imageAlt.trim();
    }
    const width = this.normalizeSize(this.imageWidth);
    if (width) {
      attributes['width'] = width;
    }
    if (Object.keys(attributes).length) {
      quill.formatText(range.index, 1, attributes, 'user');
    }
    quill.setSelection(range.index + 1, 0, 'user');
    this.closePopover();
    this.refreshState();
  }

  // ---------------------------------------------------------------- imagen seleccionada

  setSelectedImageWidth(percent: number | null): void {
    const index = this.selectedImageIndex();
    if (index === null || !this.quill) {
      return;
    }
    this.quill.formatText(index, 1, 'width', percent ? `${percent}%` : false, 'user');
    this.updateImageBarPosition();
  }

  setSelectedImageAlign(align: 'center' | 'right' | false): void {
    const index = this.selectedImageIndex();
    if (index === null || !this.quill) {
      return;
    }
    this.quill.formatLine(index, 1, 'align', align, 'user');
    this.updateImageBarPosition();
  }

  deleteSelectedImage(): void {
    const index = this.selectedImageIndex();
    if (index === null || !this.quill) {
      return;
    }
    this.quill.deleteText(index, 1, 'user');
    this.selectedImage = null;
  }

  // ---------------------------------------------------------------- eventos globales

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.openPopover = null;
      this.selectedImage = null;
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.openPopover || this.selectedImage) {
      this.openPopover = null;
      this.selectedImage = null;
      this.quill?.focus();
    }
  }

  // ---------------------------------------------------------------- internos

  private initQuill(): void {
    registerQuillFormats();

    this.quill = new Quill(this.editorRef.nativeElement, {
      placeholder: this.placeholder,
      readOnly: !this.editable,
      modules: {
        toolbar: false,
        table: true,
        history: { delay: 500, maxStack: 100, userOnly: true },
        uploader: {
          mimetypes: this.allowImageUpload ? IMAGE_MIME_TYPES : [],
          handler: (range: QuillRange, files: File[]) => this.insertImageFiles(range, files),
        },
      },
    });

    if (this.pendingValue) {
      this.setHtml(this.pendingValue);
    }
    this.pendingValue = null;

    this.quill.on('text-change', this.handleTextChange);
    this.quill.on('selection-change', this.handleSelectionChange);
    this.quill.root.addEventListener('click', this.handleRootClick);
    this.quill.root.addEventListener('scroll', this.handleRootScroll);

    this.refreshState();
    this.initialized.emit({ editor: this.quill });
  }

  private setHtml(html: string): void {
    const quill = this.quill;
    if (!quill) {
      return;
    }
    const delta = quill.clipboard.convert({ html });
    quill.setContents(delta, 'silent');
    quill.history.clear();
    this.lastEmitted = html;
    this.selectedImage = null;
    this.refreshState();
  }

  private emitValue(): void {
    const html = this.readHtml();
    const text = this.readText();
    this.value = html;
    this.lastEmitted = html;
    this.onChangeFn(html);
    this.valueChange.emit(html);
    this.textChange.emit(text);
  }

  private readHtml(): string {
    if (!this.quill || this.quill.getLength() <= 1) {
      return '';
    }
    return this.normalizeSpaces(this.quill.getSemanticHTML());
  }

  private readText(): string {
    return this.quill ? this.quill.getText().replace(/\n$/, '') : '';
  }

  /** Quill 2 convierte cada espacio en &nbsp;; se dejan espacios normales salvo en secuencias
   * (para que el texto pueda partirse en líneas fuera del editor). */
  private normalizeSpaces(html: string): string {
    return html.replace(/(?:&nbsp;)+/g, (match) => {
      const count = match.length / 6;
      return count === 1 ? ' ' : ' ' + '&nbsp;'.repeat(count - 1);
    });
  }

  private enforceMaxLength(source: string): void {
    const quill = this.quill;
    if (!quill || !this.maxLength || source !== 'user') {
      return;
    }
    const length = quill.getLength() - 1;
    if (length > this.maxLength) {
      quill.deleteText(this.maxLength, length - this.maxLength, 'silent');
    }
  }

  private refreshState(): void {
    const quill = this.quill;
    if (!quill) {
      return;
    }
    const range = quill.getSelection();
    this.formats = range ? (quill.getFormat(range) as QuillFormats) : {};
    this.inTable = !!range && this.tableModule()?.getTable(range)[0] != null;
    this.canUndo = quill.history.stack.undo.length > 0;
    this.canRedo = quill.history.stack.redo.length > 0;
    this.textLength = quill.getLength() - 1;

    if (this.selectedImage && !quill.root.contains(this.selectedImage)) {
      this.selectedImage = null;
    }
    this.cdr.markForCheck();
  }

  private applyEnabledState(): void {
    this.quill?.enable(this.editable);
    if (!this.editable) {
      this.openPopover = null;
      this.selectedImage = null;
    }
  }

  private tableModule(): TableModule | null {
    return (this.quill?.getModule('table') as TableModule | undefined) ?? null;
  }

  /** Recupera el foco y la última selección (se pierde al usar selects o inputs de la barra). */
  private restoreSelection(): QuillRange | null {
    const quill = this.quill;
    if (!quill) {
      return null;
    }
    const current = quill.getSelection();
    if (current) {
      return current;
    }
    const range = this.savedRange ?? { index: quill.getLength() - 1, length: 0 };
    quill.setSelection(range.index, range.length, 'silent');
    return range;
  }

  private currentRange(): QuillRange | null {
    return this.quill?.getSelection() ?? this.savedRange;
  }

  private clearFormat(range: QuillRange | null): void {
    const quill = this.quill;
    if (!quill || !range) {
      return;
    }
    if (range.length > 0) {
      quill.removeFormat(range.index, range.length, 'user');
      return;
    }
    // Sin selección: se limpia la línea completa donde está el cursor.
    const [line, offset] = quill.getLine(range.index);
    if (line) {
      quill.removeFormat(range.index - offset, line.length(), 'user');
    }
  }

  private findLink(index: number): QuillRange | null {
    const quill = this.quill;
    if (!quill) {
      return null;
    }
    const LinkBlot = Quill.import('formats/link') as never;
    const [blot, offset] = quill.scroll.descendant(LinkBlot, index) as [
      { length(): number } | null,
      number,
    ];
    if (!blot) {
      return null;
    }
    return { index: index - offset, length: blot.length() };
  }

  private prepareLinkDialog(): void {
    const quill = this.quill;
    const range = this.savedRange;
    this.linkUrl = typeof this.formats['link'] === 'string' ? (this.formats['link'] as string) : '';
    this.linkText = '';

    if (!quill || !range) {
      return;
    }
    const target = range.length === 0 ? this.findLink(range.index) : range;
    if (target) {
      this.linkText = quill.getText(target.index, target.length);
    }
  }

  private popoverFor(item: DbHtmlEditorToolbarItem): DbHtmlEditorPopover {
    switch (item) {
      case 'color':
        return 'color';
      case 'background':
        return 'background';
      case 'link':
        return 'link';
      case 'image':
        return 'image';
      case 'insertTable':
        return 'table';
      default:
        return null;
    }
  }

  /** Los popovers se posicionan respecto del contenedor (no del botón) para que el scroll
   * horizontal de la barra en modo de una sola línea no los recorte. */
  private positionPopover(popover: Exclude<DbHtmlEditorPopover, null>, button: HTMLElement): void {
    const root = this.rootRef.nativeElement.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    const width = POPOVER_WIDTH[popover];
    const maxLeft = Math.max(0, root.width - width - 4);

    this.popoverLeft = Math.min(Math.max(0, rect.left - root.left), maxLeft);
    this.popoverTop = rect.bottom - root.top + 4;
  }

  private selectedImageIndex(): number | null {
    const quill = this.quill;
    if (!quill || !this.selectedImage || !this.editable) {
      return null;
    }
    const blot = Quill.find(this.selectedImage);
    if (!blot || blot instanceof Quill) {
      return null;
    }
    return quill.getIndex(blot as never);
  }

  private updateImageBarPosition(): void {
    const image = this.selectedImage;
    if (!image) {
      return;
    }
    const surface = this.surfaceRef.nativeElement.getBoundingClientRect();
    const rect = image.getBoundingClientRect();
    this.imageBarTop = Math.max(4, rect.top - surface.top + 4);
    this.imageBarLeft = Math.max(4, rect.left - surface.left + 4);
  }

  private insertImageFiles(range: QuillRange, files: File[]): void {
    const quill = this.quill;
    if (!quill || !this.allowImageUpload || !this.editable) {
      return;
    }
    const valid = files.filter((file) => !this.validateImageFile(file));
    Promise.all(valid.map((file) => this.readFileAsDataUrl(file))).then((urls) => {
      urls.forEach((url, i) => quill.insertEmbed(range.index + i, 'image', url, 'user'));
      quill.setSelection(range.index + urls.length, 0, 'user');
    });
  }

  private validateImageFile(file: File): string {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      return 'Formato no soportado. Usa PNG, JPG, GIF, WEBP o SVG.';
    }
    if (file.size > this.imageMaxSizeKb * 1024) {
      return `La imagen supera el máximo de ${this.imageMaxSizeKb} KB.`;
    }
    return '';
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /** "300" → "300px"; deja tal cual valores con unidad ("50%", "20rem"). */
  private normalizeSize(size: string): string {
    const value = size.trim();
    return /^\d+$/.test(value) ? `${value}px` : value;
  }

  private buildFocusEvent(): DbHtmlEditorFocusEvent {
    return { value: this.readHtml(), text: this.readText() };
  }
}
