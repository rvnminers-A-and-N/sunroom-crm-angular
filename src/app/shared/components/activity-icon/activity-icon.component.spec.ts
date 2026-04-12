import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../../testing/render';
import { ActivityIconComponent } from './activity-icon.component';

describe('ActivityIconComponent', () => {
  async function renderType(type: string) {
    const result = await renderWithProviders(ActivityIconComponent, {
      inputs: { type },
    });
    const icon = result.container.querySelector('mat-icon') as HTMLElement;
    return { result, icon };
  }

  it('renders the Note icon and color', async () => {
    const { icon } = await renderType('Note');
    expect(icon.textContent?.trim()).toBe('description');
    expect(icon.style.color).toBe('rgb(107, 114, 128)');
  });

  it('renders the Call icon and color', async () => {
    const { icon } = await renderType('Call');
    expect(icon.textContent?.trim()).toBe('phone');
    expect(icon.style.color).toBe('rgb(59, 130, 246)');
  });

  it('renders the Email icon and color', async () => {
    const { icon } = await renderType('Email');
    expect(icon.textContent?.trim()).toBe('email');
    expect(icon.style.color).toBe('rgb(249, 166, 108)');
  });

  it('renders the Meeting icon and color', async () => {
    const { icon } = await renderType('Meeting');
    expect(icon.textContent?.trim()).toBe('groups');
    expect(icon.style.color).toBe('rgb(2, 121, 95)');
  });

  it('renders the Task icon and color', async () => {
    const { icon } = await renderType('Task');
    expect(icon.textContent?.trim()).toBe('check_circle');
    expect(icon.style.color).toBe('rgb(247, 108, 108)');
  });

  it('falls back to a generic event icon for unknown types', async () => {
    const { icon } = await renderType('Unknown');
    expect(icon.textContent?.trim()).toBe('event');
    expect(icon.style.color).toBe('rgb(107, 114, 128)');
  });
});
