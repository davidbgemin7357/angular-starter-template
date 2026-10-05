import { ChangeDetectorRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DbHtmlEditorComponent } from './db-html-editor.component';

describe('DbHtmlEditorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbHtmlEditorComponent],
    }).compileComponents();
  });

  function createComponent(): DbHtmlEditorComponent {
    const fixture = TestBed.createComponent(DbHtmlEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  it('debería crearse e inicializar Quill', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.getEditor()).not.toBeNull();
  });

  it('writeValue carga el HTML en el editor sin emitir valueChange', () => {
    const component = createComponent();
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.writeValue('<p>Hola <strong>mundo</strong></p>');

    expect(component.getText()).toBe('Hola mundo');
    expect(component.getHtml()).toContain('<strong>mundo</strong>');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('writeValue usa cadena vacía cuando recibe null/undefined', () => {
    const component = createComponent();
    component.writeValue(null as unknown as string);
    expect(component.value).toBe('');
    expect(component.getHtml()).toBe('');
  });

  it('los cambios del usuario emiten valueChange, textChange y registerOnChange', () => {
    const component = createComponent();
    const onChangeSpy = vi.fn();
    const valueSpy = vi.spyOn(component.valueChange, 'emit');
    const textSpy = vi.spyOn(component.textChange, 'emit');
    component.registerOnChange(onChangeSpy);

    component.getEditor()!.setText('nuevo texto', 'user');

    expect(valueSpy).toHaveBeenCalledWith('<p>nuevo texto</p>');
    expect(textSpy).toHaveBeenCalledWith('nuevo texto');
    expect(onChangeSpy).toHaveBeenCalledWith('<p>nuevo texto</p>');
  });

  it('maxLength recorta el texto que excede el límite', () => {
    const component = createComponent();
    component.maxLength = 5;

    component.getEditor()!.setText('123456789', 'user');

    expect(component.getText()).toBe('12345');
  });

  it('setDisabledState deshabilita la edición', () => {
    const component = createComponent();
    component.setDisabledState(true);

    expect(component.disabled).toBe(true);
    expect(component.getEditor()!.isEnabled()).toBe(false);

    component.setDisabledState(false);
    expect(component.getEditor()!.isEnabled()).toBe(true);
  });

  it('clear() vacía el contenido y emite cadena vacía', () => {
    const component = createComponent();
    component.writeValue('<p>algo</p>');
    const emitSpy = vi.spyOn(component.valueChange, 'emit');

    component.clear();

    expect(component.getHtml()).toBe('');
    expect(emitSpy).toHaveBeenCalledWith('');
  });
});

@Component({
  imports: [ReactiveFormsModule, DbHtmlEditorComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted = true">
      <db-html-editor formControlName="body"></db-html-editor>
    </form>
  `,
})
class HtmlEditorFormHostComponent {
  submitted = false;
  form = new FormGroup({ body: new FormControl('') });
}

describe('DbHtmlEditorComponent dentro de un <form> reactivo', () => {
  beforeEach(async () => {
    // jsdom no implementa la geometría de Range que Quill usa en setSelection().
    const proto = Range.prototype as unknown as Record<string, unknown>;
    proto['getBoundingClientRect'] ??= () => new DOMRect();
    proto['getClientRects'] ??= () => [];
    await TestBed.configureTestingModule({
      imports: [HtmlEditorFormHostComponent],
    }).compileComponents();
  });

  function setup(popover: 'link' | 'image') {
    const fixture = TestBed.createComponent(HtmlEditorFormHostComponent);
    fixture.detectChanges();
    const editorDe = fixture.debugElement.query(By.directive(DbHtmlEditorComponent));
    const editor = editorDe.componentInstance as DbHtmlEditorComponent;
    const refresh = () => {
      editorDe.injector.get(ChangeDetectorRef).markForCheck();
      fixture.detectChanges();
    };
    editor.openPopover = popover;
    if (popover === 'link') {
      editor.linkUrl = 'https://example.com';
      editor.linkText = 'Ejemplo';
    } else {
      editor.imageUrl = 'https://example.com/img.png';
    }
    refresh();
    const popoverEl = fixture.nativeElement.querySelector('.db-html-editor__popover') as HTMLElement;
    return { fixture, editor, popoverEl, refresh };
  }

  it('los popovers no contienen elementos <form> anidados', () => {
    const { popoverEl } = setup('link');
    expect(popoverEl.querySelector('form')).toBeNull();
    expect(popoverEl.querySelector('[role="group"]')).not.toBeNull();
  });

  it('aplicar enlace con el botón no dispara ngSubmit del formulario padre', () => {
    const { fixture, editor, popoverEl } = setup('link');
    const applySpy = vi.spyOn(editor, 'applyLink');
    const applyBtn = popoverEl.querySelector('.db-html-editor__btn--primary') as HTMLButtonElement;

    expect(applyBtn.type).toBe('button');
    applyBtn.click();
    fixture.detectChanges();

    expect(applySpy).toHaveBeenCalled();
    expect(fixture.componentInstance.submitted).toBe(false);
  });

  it('aplicar enlace con Enter no dispara ngSubmit del formulario padre', () => {
    const { fixture, editor } = setup('link');
    const applySpy = vi.spyOn(editor, 'applyLink');
    const input = fixture.nativeElement.querySelector('#db-html-editor-link-url') as HTMLInputElement;

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    fixture.detectChanges();

    expect(applySpy).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.submitted).toBe(false);
  });

  it('insertar imagen con el botón o Enter no dispara ngSubmit del formulario padre', () => {
    const { fixture, editor, popoverEl, refresh } = setup('image');
    const applySpy = vi.spyOn(editor, 'applyImage');

    const input = popoverEl.querySelector('#db-html-editor-image-url') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(applySpy).toHaveBeenCalledTimes(1);

    editor.openPopover = 'image';
    editor.imageUrl = 'https://example.com/img.png';
    refresh();
    const btn = fixture.nativeElement.querySelector('.db-html-editor__popover .db-html-editor__btn--primary') as HTMLButtonElement;
    expect(btn.type).toBe('button');
    btn.click();
    fixture.detectChanges();

    expect(applySpy).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.submitted).toBe(false);
  });

  it('todos los <button> del editor son type="button"', () => {
    const { fixture } = setup('link');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('db-html-editor button')) as HTMLButtonElement[];
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((b) => expect(b.getAttribute('type')).toBe('button'));
  });
});
