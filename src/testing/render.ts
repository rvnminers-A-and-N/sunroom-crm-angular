import { Type } from '@angular/core';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { render, RenderComponentOptions, RenderResult } from '@testing-library/angular';

interface RenderWithProvidersOptions<T> extends RenderComponentOptions<T> {
  routes?: Routes;
  interceptors?: HttpInterceptorFn[];
}

/**
 * Wrapper around `@testing-library/angular`'s `render` that wires the
 * standard application providers (router, http client, animations) by default
 * and lets individual tests append more providers, imports, or routes.
 */
export async function renderWithProviders<T>(
  component: Type<T>,
  options: RenderWithProvidersOptions<T> = {},
): Promise<RenderResult<T>> {
  const { routes = [], interceptors = [], providers = [], ...rest } = options;

  return render(component, {
    ...rest,
    providers: [
      provideRouter(routes),
      provideHttpClient(withInterceptors(interceptors)),
      provideAnimationsAsync('noop'),
      ...providers,
    ],
  });
}
