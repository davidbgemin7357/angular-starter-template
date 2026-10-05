/** Opción de los selects de la barra (encabezado, fuente y tamaño). */
export interface DbHtmlEditorSelectOption {
  label: string;
  value: string | number | false;
}

/** Evento emitido al ganar/perder el foco. */
export interface DbHtmlEditorFocusEvent {
  value: string;
  text: string;
}

/** Evento emitido cuando Quill terminó de inicializarse. */
export interface DbHtmlEditorInitializedEvent {
  /** Instancia de Quill, por si el consumidor necesita su API completa. */
  editor: unknown;
}
