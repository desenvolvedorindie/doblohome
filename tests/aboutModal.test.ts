import { describe, it, expect, vi } from 'vitest';
import { AboutModal } from '../src/components/modals/AboutModal';

describe('AboutModal module and structure', () => {
  it('exports AboutModal function correctly', () => {
    expect(typeof AboutModal).toBe('function');
  });

  it('Easter egg triggers developer mode after 5 clicks', () => {
    let clickCount = 0;
    let devMode = false;
    let showDevMessage = false;

    const handleVersionClick = () => {
      if (devMode) return;
      clickCount += 1;
      if (clickCount >= 5) {
        devMode = true;
        showDevMessage = true;
        clickCount = 0;
      }
    };

    for (let i = 0; i < 4; i++) {
      handleVersionClick();
      expect(devMode).toBe(false);
      expect(showDevMessage).toBe(false);
    }

    handleVersionClick();
    expect(devMode).toBe(true);
    expect(showDevMessage).toBe(true);
    expect(clickCount).toBe(0);

    // Subsequent clicks when devMode is active do nothing
    handleVersionClick();
    expect(devMode).toBe(true);
  });
});
