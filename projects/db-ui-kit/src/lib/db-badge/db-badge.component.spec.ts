import { TestBed } from '@angular/core/testing';
import { DbBadgeComponent } from './db-badge.component';

describe('DbBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbBadgeComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should apply the default light/primary color classes', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    expect(span.classList.contains('bg-brand-50')).toBe(true);
    expect(span.classList.contains('text-brand-500')).toBe(true);
    expect(span.classList.contains('text-sm')).toBe(true);
  });

  it('should apply the solid/error color classes and the sm text size', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    fixture.componentInstance.variant = 'solid';
    fixture.componentInstance.color = 'error';
    fixture.componentInstance.size = 'sm';
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    expect(span.classList.contains('bg-error-500')).toBe(true);
    expect(span.classList.contains('text-theme-xs')).toBe(true);
    expect(fixture.componentInstance.iconFontSize).toBe(16);
  });

  it('should render startIcon and endIcon text', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    fixture.componentInstance.startIcon = 'star';
    fixture.componentInstance.endIcon = 'arrow_forward';
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('.material-symbols-outlined');
    expect(icons.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('star');
    expect(fixture.nativeElement.textContent).toContain('arrow_forward');
  });

  it('should emit iconClick with "start" when the start icon is clicked', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    fixture.componentInstance.startIcon = 'star';
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.iconClick.subscribe(spy);
    const icon = fixture.nativeElement.querySelector('.material-symbols-outlined') as HTMLSpanElement;
    icon.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('start');
  });

  it('should emit iconClick with "end" when the end icon is clicked', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    fixture.componentInstance.endIcon = 'arrow_forward';
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.iconClick.subscribe(spy);
    const icon = fixture.nativeElement.querySelector('.material-symbols-outlined') as HTMLSpanElement;
    icon.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('end');
  });

  it('should emit contentClick when the projected content is clicked', () => {
    const fixture = TestBed.createComponent(DbBadgeComponent);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.contentClick.subscribe(spy);
    const contentSpan = fixture.nativeElement.querySelectorAll('span')[1] as HTMLSpanElement;
    contentSpan.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
