import { TestBed } from '@angular/core/testing';
import { DbLoaderComponent } from './db-loader.component';

describe('DbLoaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbLoaderComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(DbLoaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not render the loader box when isVisible is false by default', () => {
    const fixture = TestBed.createComponent(DbLoaderComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.box')).toBeNull();
  });

  it('should render the loader box when isVisible becomes true', () => {
    const fixture = TestBed.createComponent(DbLoaderComponent);
    fixture.componentInstance.isVisible = true;
    fixture.componentInstance.ngOnChanges({
      isVisible: { previousValue: false, currentValue: true, firstChange: true, isFirstChange: () => true },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.box')).not.toBeNull();
    expect(fixture.componentInstance.shouldRender).toBe(true);
    expect(fixture.componentInstance.isClosing).toBe(false);
  });

  it('should add the box-contained class only when contained is true', () => {
    const fixture = TestBed.createComponent(DbLoaderComponent);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.box').classList.contains('box-contained')).toBe(false);

    fixture.componentRef.setInput('contained', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.box').classList.contains('box-contained')).toBe(true);
  });

  it('should mark the box as closing and eventually stop rendering it after isVisible turns false', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(DbLoaderComponent);
    fixture.componentInstance.isVisible = true;
    fixture.componentInstance.ngOnChanges({
      isVisible: { previousValue: false, currentValue: true, firstChange: true, isFirstChange: () => true },
    });

    fixture.componentInstance.isVisible = false;
    fixture.componentInstance.ngOnChanges({
      isVisible: { previousValue: true, currentValue: false, firstChange: false, isFirstChange: () => false },
    });

    expect(fixture.componentInstance.isClosing).toBe(true);
    expect(fixture.componentInstance.shouldRender).toBe(true);

    vi.advanceTimersByTime(250);
    expect(fixture.componentInstance.shouldRender).toBe(false);
    expect(fixture.componentInstance.isClosing).toBe(false);

    vi.useRealTimers();
  });

  it('should ignore ngOnChanges calls that do not include the isVisible input', () => {
    const fixture = TestBed.createComponent(DbLoaderComponent);
    fixture.componentInstance.ngOnChanges({});
    fixture.detectChanges();
    expect(fixture.componentInstance.shouldRender).toBe(false);
  });

  it('should clear the pending hide timeout on destroy without throwing', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(DbLoaderComponent);
    fixture.componentInstance.isVisible = true;
    fixture.componentInstance.ngOnChanges({
      isVisible: { previousValue: false, currentValue: true, firstChange: true, isFirstChange: () => true },
    });
    fixture.componentInstance.isVisible = false;
    fixture.componentInstance.ngOnChanges({
      isVisible: { previousValue: true, currentValue: false, firstChange: false, isFirstChange: () => false },
    });

    expect(() => fixture.destroy()).not.toThrow();
    vi.useRealTimers();
  });
});
