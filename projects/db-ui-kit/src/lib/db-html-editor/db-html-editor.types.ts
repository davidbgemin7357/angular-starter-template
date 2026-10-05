/** Elementos disponibles en la barra de herramientas de db-html-editor
 * (equivalentes a los "toolbar items" de dxHtmlEditor). */
export type DbHtmlEditorToolbarItem =
  | 'undo'
  | 'redo'
  | 'header'
  | 'font'
  | 'size'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'color'
  | 'background'
  | 'subscript'
  | 'superscript'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'orderedList'
  | 'bulletList'
  | 'checkList'
  | 'indent'
  | 'outdent'
  | 'blockquote'
  | 'codeBlock'
  | 'link'
  | 'image'
  | 'insertTable'
  | 'insertRowAbove'
  | 'insertRowBelow'
  | 'insertColumnLeft'
  | 'insertColumnRight'
  | 'deleteRow'
  | 'deleteColumn'
  | 'deleteTable'
  | 'clear'
  | 'separator';

/** Popovers internos que puede abrir la barra de herramientas. */
export type DbHtmlEditorPopover = 'color' | 'background' | 'link' | 'image' | 'table' | null;

/** Pestañas del diálogo de imagen. */
export type DbHtmlEditorImageSource = 'url' | 'file';
