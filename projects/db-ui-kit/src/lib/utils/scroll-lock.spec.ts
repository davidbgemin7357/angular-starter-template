import { lockBodyScroll, resetBodyScrollLock, unlockBodyScroll } from './scroll-lock';

describe('scroll-lock', () => {
  afterEach(() => resetBodyScrollLock());

  it('bloquea el scroll del body al primer lock y lo libera al último unlock', () => {
    lockBodyScroll();
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('');
  });

  it('ignora unlocks sin lock previo', () => {
    unlockBodyScroll();
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
  });
});
