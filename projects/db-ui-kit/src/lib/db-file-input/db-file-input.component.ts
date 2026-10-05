import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FileInputResult } from './db-file-input.interface';

@Component({
  selector: 'db-file-input',
  templateUrl: 'db-file-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbFileInputComponent),
      multi: true,
    },
  ],
})
export class DbFileInputComponent implements ControlValueAccessor {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() className: string = '';
  @Input() allowedExtensions: string[] = [];
  @Input() maxSizeMB: number | null = null;
  @Input() error: boolean = false;
  @Input() multiple: boolean = false;
  @Input() minFiles: number | null = null;
  @Input() maxFiles: number | null = null;
  @Input() externalErrorMessage: string | null = null;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() showClearButton: boolean = false;
  @Output() valueChange = new EventEmitter<FileInputResult>();
  public errorMessage: string | null = null;
  public selectedFileName: string | null = null;

  @Input() set initialFile(file: File | null) {
    this.selectedFileName = file?.name ?? null;
    this.selectedFiles = file ? [file] : [];
  }

  @Input() files: File[] | null = null;
  public selectedFiles: File[] = [];

  private onChangeFn: (value: File[] | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(files: File[] | null): void {
    this.selectedFiles = files ?? [];
    this.selectedFileName = this.selectedFiles.length
      ? this.selectedFiles[this.selectedFiles.length - 1].name
      : null;
  }

  registerOnChange(fn: (value: File[] | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get hasError(): boolean {
    return this.error || !!this.errorMessage || !!this.externalErrorMessage;
  }

  get containerClasses(): string {
    const base = `flex h-11 w-full rounded-lg border text-sm overflow-hidden shadow-theme-xs ${this.className}`;

    if (this.disabled) {
      return `${base} bg-gray-100 opacity-60 cursor-not-allowed border-gray-200 dark:bg-gray-800 dark:border-gray-700`;
    }

    return this.hasError
      ? `${base} border-red-500 bg-transparent dark:bg-gray-900`
      : `${base} border-gray-300 bg-transparent dark:border-gray-700 dark:bg-gray-900`;
  }

  get selectButtonClasses(): string {
    const base = 'shrink-0 px-3 border-r text-gray-700 dark:text-gray-300';

    return this.disabled
      ? `${base} bg-gray-100 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700`
      : `${base} bg-gray-50 border-gray-300 hover:bg-gray-100 cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700`;
  }

  /** Clases de las X (limpiar / quitar archivo): tenues y sin hover cuando está deshabilitado. */
  get iconButtonClasses(): string {
    return this.disabled
      ? 'text-gray-300 cursor-not-allowed dark:text-gray-600'
      : 'text-gray-500 hover:text-gray-700 cursor-pointer dark:text-gray-400 dark:hover:text-gray-200';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['files'] && this.files) {
      this.selectedFiles = this.files;
      this.selectedFileName = this.files.length
        ? this.files[this.files.length - 1].name
        : null;
    }
  }

  get acceptAttr(): string {
    return this.allowedExtensions.join(',');
  }

  get displayLabel(): string {
    if (this.multiple) {
      return this.selectedFiles.length
        ? `${this.selectedFiles.length} archivo(s) seleccionado(s)`
        : 'Sin archivos seleccionados';
    }

    return this.selectedFileName ?? 'Sin archivo seleccionado';
  }

  public onChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.selectedFileName = null;
      this.selectedFiles = [];
      this.emitResult([], null);
      return;
    }

    let files = Array.from(input.files);
    this.errorMessage = null;

    if (!this.multiple) files = [files[0]];

    if (this.multiple) {
      const countError = this.validateFileCount(files.length);
      if (countError) return this.handleError(countError, input);
    }

    for (const file of files) {
      const extensionError = this.validateExtension(file);
      if (extensionError) return this.handleError(extensionError, input);

      const mimeError = this.validateMimeType(file);
      if (mimeError) return this.handleError(mimeError, input);
    }

    if (this.multiple) {
      return this.handleMultipleSizeValidation(files, input);
    }

    const sizeError = this.validateSize(files[0]);
    if (sizeError) return this.handleError(sizeError, input);

    this.selectedFiles = files;
    this.selectedFileName = files[0].name;
    this.emitResult(files, null);
  }

  private handleMultipleSizeValidation(files: File[], input: HTMLInputElement): void {
    const validFiles: File[] = [];
    const oversizedFiles: File[] = [];

    for (const file of files) {
      if (this.validateSize(file)) {
        oversizedFiles.push(file);
      } else {
        validFiles.push(file);
      }
    }

    this.errorMessage = oversizedFiles.length
      ? `Los siguientes archivos exceden el tamaño máximo de ${this.maxSizeMB}MB: ${oversizedFiles.map((file) => file.name).join(', ')}`
      : null;

    this.selectedFiles = validFiles;
    this.selectedFileName = validFiles.length ? validFiles[validFiles.length - 1].name : null;

    if (!validFiles.length) input.value = '';

    this.emitResult(validFiles, this.errorMessage);
  }

  private validateFileCount(count: number): string | null {
    if (this.minFiles !== null && count < this.minFiles) {
      return `Debes seleccionar al menos ${this.minFiles} archivo(s)`;
    }

    if (this.maxFiles !== null && count > this.maxFiles) {
      return `Puedes seleccionar máximo ${this.maxFiles} archivo(s)`;
    }

    return null;
  }

  private emitResult(file: File[], error: string | null) {
    this.onChangeFn(file.length ? file : null);
    this.onTouchedFn();
    this.valueChange.emit({ file, error });
  }

  private handleError(message: string, input: HTMLInputElement) {
    this.errorMessage = message;
    this.selectedFileName = null;
    this.selectedFiles = [];
    input.value = '';
    this.emitResult([], message);
  }

  private validateExtension(file: File): string | null {
    if (!this.allowedExtensions.length) return null;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValid = this.allowedExtensions.map((e) => e.toLowerCase()).includes(ext);
    return isValid ? null : `Extensión no permitida. Usa: ${this.allowedExtensions.join(', ')}`;
  }

  private validateSize(file: File): string | null {
    if (!this.maxSizeMB) return null;
    const maxBytes = this.maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes
      ? null
      : `El archivo excede el tamaño máximo de ${this.maxSizeMB}MB`;
  }

  private validateMimeType(file: File): string | null {
    const allowedMimeMap: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.pdf': ['application/pdf'],
    };

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedMimeMap[ext]) return null;

    const isValid = allowedMimeMap[ext].includes(file.type);

    return isValid ? null : 'Tipo de archivo inválido';
  }

  public reset(): void {
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    this.selectedFileName = null;
    this.selectedFiles = [];
    this.errorMessage = null;
  }

  public clearValue(): void {
    if (this.disabled) {
      return;
    }

    this.reset();
    this.emitResult([], null);
  }

  public setFile(file: File | null): void {
    this.selectedFileName = file?.name ?? null;
    this.selectedFiles = file ? [file] : [];
  }

  public removeFile(fileToRemove: File): void {
    if (this.disabled) {
      return;
    }

    this.selectedFiles = this.selectedFiles.filter((file) => file !== fileToRemove);
    this.selectedFileName = this.selectedFiles.length
      ? this.selectedFiles[this.selectedFiles.length - 1].name
      : null;

    if (this.fileInput) this.fileInput.nativeElement.value = '';

    this.emitResult(this.selectedFiles, this.errorMessage);
  }
}
