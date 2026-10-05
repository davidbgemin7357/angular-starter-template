import { TestBed } from '@angular/core/testing';
import { DbButtonComponent } from './db-button.component';
import { ButtonClickEvent, ButtonDropdownItem } from './db-button.interface';

describe('DbButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbButtonComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should apply the default size/variant/type classes', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.classList.contains('px-[0.8rem]')).toBe(true);
    expect(button.classList.contains('bg-brand-500')).toBe(true);
  });

  it('should switch to the outline error variant classes when inputs change', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    fixture.componentInstance.variant = 'error';
    fixture.componentInstance.type = 'outline';
    fixture.componentInstance.size = 'sm';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.classList.contains('text-red-600')).toBe(true);
    expect(button.classList.contains('ring-red-500')).toBe(true);
    expect(button.classList.contains('px-[0.6rem]')).toBe(true);
  });

  it('should render startIcon and endIcon text', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    fixture.componentInstance.startIcon = 'check';
    fixture.componentInstance.endIcon = 'close';
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('.material-symbols-outlined');
    expect(icons.length).toBeGreaterThanOrEqual(2);
    expect(fixture.nativeElement.textContent).toContain('check');
    expect(fixture.nativeElement.textContent).toContain('close');
  });

  it('should emit btnClick with the click event and disabled flag when clicked', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    fixture.detectChanges();
    let received: ButtonClickEvent | undefined;
    fixture.componentInstance.btnClick.subscribe((value: ButtonClickEvent) => {
      received = value;
    });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(received).toBeDefined();
    expect(received?.disabled).toBe(false);
  });

  it('should not emit btnClick when disabled', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.btnClick.subscribe(spy);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
    expect(button.classList.contains('cursor-not-allowed')).toBe(true);
  });

  /** El atributo nativo, y no solo las clases: es lo que impide que el usuario dispare dos veces
   * una accion que ya esta en curso (exportar un archivo, enviar un formulario). Sin el, el boton
   * se ve gris pero sigue recibiendo clics, foco y Enter. */
  describe('atributo disabled nativo', () => {
    it('debe marcar el <button> como deshabilitado cuando el input es true', () => {
      const fixture = TestBed.createComponent(DbButtonComponent);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('no debe marcarlo cuando el input es false', () => {
      const fixture = TestBed.createComponent(DbButtonComponent);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('no debe emitir dropdownItemClick estando deshabilitado', () => {
      const fixture = TestBed.createComponent(DbButtonComponent);
      fixture.componentInstance.dropdownItems = [{ text: 'Excel', code: 'excel' }];
      fixture.detectChanges();

      // Se abre el desplegable con el boton todavia operativo y recien despues se bloquea, que es
      // justo la secuencia de "el usuario disparo la accion y quiere repetirla".
      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();

      const spy = vi.fn();
      fixture.componentInstance.dropdownItemClick.subscribe(spy);

      fixture.componentInstance.disabled = true;
      fixture.componentInstance.onDropdownItemClick({ text: 'Excel', code: 'excel' });

      expect(spy).not.toHaveBeenCalled();
    });

    it('debe cerrar el desplegable abierto cuando el boton pasa a deshabilitado', () => {
      const fixture = TestBed.createComponent(DbButtonComponent);
      fixture.componentInstance.dropdownItems = [{ text: 'Excel', code: 'excel' }];
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.isDropdownOpen).toBe(true);

      // setInput y no asignacion directa: es lo que dispara ngOnChanges, igual que un binding.
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(fixture.componentInstance.isDropdownOpen).toBe(false);
      expect(fixture.nativeElement.querySelector('ul')).toBeNull();
    });
  });

  it('should toggle the dropdown and emit dropdownItemClick with the selected code', () => {
    const fixture = TestBed.createComponent(DbButtonComponent);
    const items: ButtonDropdownItem[] = [
      { text: 'Opcion 1', code: 'OPT1' },
      { text: 'Opcion 2', code: 'OPT2' },
    ];
    fixture.componentInstance.dropdownItems = items;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isDropdownOpen).toBe(true);

    let emitted: string | undefined;
    fixture.componentInstance.dropdownItemClick.subscribe((code: string) => {
      emitted = code;
    });
    const firstItem = fixture.nativeElement.querySelector('li') as HTMLLIElement;
    firstItem.click();
    fixture.detectChanges();

    expect(emitted).toBe('OPT1');
    expect(fixture.componentInstance.isDropdownOpen).toBe(false);
  });

  describe('closing the dropdown', () => {
    /** Renders the button with items and leaves the dropdown open. */
    function openDropdown() {
      const fixture = TestBed.createComponent(DbButtonComponent);
      fixture.componentInstance.dropdownItems = [
        { text: 'Opcion 1', code: 'OPT1' },
        { text: 'Opcion 2', code: 'OPT2' },
      ];
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.isDropdownOpen).toBe(true);

      return fixture;
    }

    it('should close when focus leaves the component', () => {
      const fixture = openDropdown();
      const outside = document.createElement('input');
      document.body.appendChild(outside);

      fixture.nativeElement.dispatchEvent(
        new FocusEvent('focusout', { relatedTarget: outside, bubbles: true }),
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.isDropdownOpen).toBe(false);
      outside.remove();
    });

    it('should close when focus is lost with no relatedTarget', () => {
      const fixture = openDropdown();

      fixture.nativeElement.dispatchEvent(
        new FocusEvent('focusout', { relatedTarget: null, bubbles: true }),
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.isDropdownOpen).toBe(false);
    });

    it('should stay open when focus moves to an element inside the component', () => {
      const fixture = openDropdown();
      const insideItem = fixture.nativeElement.querySelector('li') as HTMLLIElement;

      fixture.nativeElement.dispatchEvent(
        new FocusEvent('focusout', { relatedTarget: insideItem, bubbles: true }),
      );
      fixture.detectChanges();

      expect(fixture.componentInstance.isDropdownOpen).toBe(true);
    });

    it('should close on a click outside and stay open on a click inside', () => {
      const fixture = openDropdown();

      // Click en la lista pero fuera de un <li>: queda dentro del componente, no debe cerrar.
      const list = fixture.nativeElement.querySelector('ul') as HTMLUListElement;
      list.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(fixture.componentInstance.isDropdownOpen).toBe(true);

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(fixture.componentInstance.isDropdownOpen).toBe(false);
    });

    it('should close on Escape', () => {
      const fixture = openDropdown();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.componentInstance.isDropdownOpen).toBe(false);
    });
  });
});
