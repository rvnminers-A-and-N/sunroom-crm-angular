import { describe, it, expect } from 'vitest';
import { App } from './app';
import { renderWithProviders } from '../testing/render';

describe('App', () => {
  it('creates the root component', async () => {
    const { fixture } = await renderWithProviders(App);
    expect(fixture.componentInstance).toBeInstanceOf(App);
  });

  it('renders a router-outlet in its template', async () => {
    const { fixture } = await renderWithProviders(App);
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
