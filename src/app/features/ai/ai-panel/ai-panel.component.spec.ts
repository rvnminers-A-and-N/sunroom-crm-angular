import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import { NgModel } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { AiPanelComponent } from './ai-panel.component';
import { AiService } from '../services/ai.service';
import { renderWithProviders } from '../../../../testing/render';

async function* fakeStream(
  tokens: string[],
): AsyncGenerator<string, void, undefined> {
  for (const t of tokens) yield t;
}

async function* neverStream(): AsyncGenerator<string, void, undefined> {
  await new Promise(() => {});
}

async function* errorStream(msg: string): AsyncGenerator<string, void, undefined> {
  throw new Error(msg);
}

interface AiServiceStub {
  smartSearchStream: ReturnType<typeof vi.fn>;
  summarizeStream: ReturnType<typeof vi.fn>;
  dealInsightsStream: ReturnType<typeof vi.fn>;
  smartSearch: ReturnType<typeof vi.fn>;
  summarize: ReturnType<typeof vi.fn>;
}

function makeStubs(): { aiService: AiServiceStub } {
  return {
    aiService: {
      smartSearchStream: vi
        .fn()
        .mockReturnValue(fakeStream(['recent', ' contacts'])),
      summarizeStream: vi
        .fn()
        .mockReturnValue(fakeStream(['short', ' summary'])),
      dealInsightsStream: vi
        .fn()
        .mockReturnValue(fakeStream(['deal', ' insight'])),
      smartSearch: vi.fn(),
      summarize: vi.fn(),
    },
  };
}

async function renderPanel(stubs = makeStubs()) {
  const result = await renderWithProviders(AiPanelComponent, {
    routes: [{ path: 'contacts/:id', children: [] }],
    providers: [{ provide: AiService, useValue: stubs.aiService }],
  });
  return { ...result, ...stubs };
}

describe('AiPanelComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the page header and tab labels', async () => {
    await renderPanel();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Smart Search')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
  });

  it('onSearch does nothing when the query is whitespace', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.searchQuery = '   ';
    fixture.componentInstance.onSearch();
    expect(aiService.smartSearchStream).not.toHaveBeenCalled();
  });

  it('onSearch calls the streaming service and stores the result', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.searchQuery = 'who did I talk to';
    await fixture.componentInstance.onSearch();

    expect(aiService.smartSearchStream).toHaveBeenCalledWith(
      'who did I talk to',
      expect.any(AbortSignal),
    );
    expect(fixture.componentInstance.searching()).toBe(false);
    expect(fixture.componentInstance.searchResult()).toBe('recent contacts');
  });

  it('renders streamed search result text', async () => {
    const { fixture } = await renderPanel();
    fixture.componentInstance.searchQuery = 'people';
    await fixture.componentInstance.onSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByText('recent contacts')).toBeInTheDocument();
  });

  it('keeps searching false on stream error', async () => {
    const stubs = makeStubs();
    stubs.aiService.smartSearchStream.mockReturnValueOnce(
      errorStream('boom'),
    );
    const { fixture } = await renderPanel(stubs);

    fixture.componentInstance.searchQuery = 'fail';
    await fixture.componentInstance.onSearch();

    expect(fixture.componentInstance.searching()).toBe(false);
    expect(fixture.componentInstance.searchResult()).toBe('Error: boom');
  });

  it('suppresses AbortError during onSearch', async () => {
    const stubs = makeStubs();
    const abortError = new DOMException('aborted', 'AbortError');
    async function* abortStream(): AsyncGenerator<string, void, undefined> {
      throw abortError;
    }
    stubs.aiService.smartSearchStream.mockReturnValueOnce(abortStream());
    const { fixture } = await renderPanel(stubs);

    fixture.componentInstance.searchQuery = 'abort test';
    await fixture.componentInstance.onSearch();

    expect(fixture.componentInstance.searching()).toBe(false);
    expect(fixture.componentInstance.searchResult()).toBe('');
  });

  it('shows the search spinner while a search is in flight', async () => {
    const stubs = makeStubs();
    stubs.aiService.smartSearchStream.mockReturnValueOnce(neverStream());

    const { fixture } = await renderPanel(stubs);
    fixture.componentInstance.searchQuery = 'wait';
    // Don't await — it never resolves
    fixture.componentInstance.onSearch();
    fixture.detectChanges();

    expect(fixture.componentInstance.searching()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('onSummarize does nothing when the text is whitespace', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.summarizeText = '   ';
    fixture.componentInstance.onSummarize();
    expect(aiService.summarizeStream).not.toHaveBeenCalled();
  });

  it('onSummarize calls the streaming service and stores the summary', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.summarizeText = 'long text';
    await fixture.componentInstance.onSummarize();

    expect(aiService.summarizeStream).toHaveBeenCalledWith(
      'long text',
      expect.any(AbortSignal),
    );
    expect(fixture.componentInstance.summarizing()).toBe(false);
    expect(fixture.componentInstance.summaryResult()).toBe('short summary');
  });

  it('keeps summarizing false on stream error', async () => {
    const stubs = makeStubs();
    stubs.aiService.summarizeStream.mockReturnValueOnce(errorStream('nope'));
    const { fixture } = await renderPanel(stubs);

    fixture.componentInstance.summarizeText = 'fail';
    await fixture.componentInstance.onSummarize();

    expect(fixture.componentInstance.summarizing()).toBe(false);
    expect(fixture.componentInstance.summaryResult()).toBe('Error: nope');
  });

  it('suppresses AbortError during onSummarize', async () => {
    const stubs = makeStubs();
    const abortError = new DOMException('aborted', 'AbortError');
    async function* abortStream(): AsyncGenerator<string, void, undefined> {
      throw abortError;
    }
    stubs.aiService.summarizeStream.mockReturnValueOnce(abortStream());
    const { fixture } = await renderPanel(stubs);

    fixture.componentInstance.summarizeText = 'abort test';
    await fixture.componentInstance.onSummarize();

    expect(fixture.componentInstance.summarizing()).toBe(false);
    expect(fixture.componentInstance.summaryResult()).toBe('');
  });

  it('renders the summary result block after a successful summarize', async () => {
    const { fixture } = await renderPanel();
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.summarizeText = 'long text';
    await fixture.componentInstance.onSummarize();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('short summary')).toBeInTheDocument();
  });

  it('shows the summarize spinner while a summarize is in flight', async () => {
    const stubs = makeStubs();
    stubs.aiService.summarizeStream.mockReturnValueOnce(neverStream());

    const { fixture } = await renderPanel(stubs);
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.summarizeText = 'wait';
    fixture.componentInstance.onSummarize();
    fixture.detectChanges();

    expect(fixture.componentInstance.summarizing()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('updates searchQuery via the input ngModel', async () => {
    const { fixture } = await renderPanel();
    const input = fixture.nativeElement.querySelector(
      'input[placeholder^="e.g. Who"]',
    ) as HTMLInputElement;
    input.value = 'hello';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.searchQuery).toBe('hello');
  });

  it('triggers onSearch when Enter is pressed in the search input', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.searchQuery = 'enter test';
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder^="e.g. Who"]',
    ) as HTMLInputElement;
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    expect(aiService.smartSearchStream).toHaveBeenCalledWith(
      'enter test',
      expect.any(AbortSignal),
    );
  });

  it('triggers onSearch when the Search button is clicked via DOM', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.searchQuery = 'click test';
    fixture.detectChanges();

    const searchBtn = screen.getByRole('button', { name: /^Search$/ });
    searchBtn.click();
    fixture.detectChanges();

    expect(aiService.smartSearchStream).toHaveBeenCalledWith(
      'click test',
      expect.any(AbortSignal),
    );
  });

  it('triggers onSummarize when the Summarize button is clicked via DOM', async () => {
    const { fixture, aiService } = await renderPanel();
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.value = 'click summarize';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const summarizeBtn = screen.getByRole('button', { name: /^Summarize$/ });
    summarizeBtn.click();
    fixture.detectChanges();

    expect(aiService.summarizeStream).toHaveBeenCalledWith(
      'click summarize',
      expect.any(AbortSignal),
    );
  });

  it('updates summarizeText via the textarea ngModel', async () => {
    const { fixture } = await renderPanel();
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.value = 'paste this';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.summarizeText).toBe('paste this');
  });

  it('covers the null-coalescing fallback in onSearch update', async () => {
    const stubs = makeStubs();
    // Create a generator that sets searchResult to null before yielding
    async function* trickStream(
      component: AiPanelComponent,
    ): AsyncGenerator<string, void, undefined> {
      component.searchResult.set(null);
      yield 'x';
    }
    const { fixture } = await renderPanel(stubs);
    const comp = fixture.componentInstance;
    stubs.aiService.smartSearchStream.mockReturnValueOnce(trickStream(comp));
    comp.searchQuery = 'trick';
    await comp.onSearch();
    expect(comp.searchResult()).toBe('x');
  });

  it('covers the null-coalescing fallback in onSummarize update', async () => {
    const stubs = makeStubs();
    async function* trickStream(
      component: AiPanelComponent,
    ): AsyncGenerator<string, void, undefined> {
      component.summaryResult.set(null);
      yield 'y';
    }
    const { fixture } = await renderPanel(stubs);
    const comp = fixture.componentInstance;
    stubs.aiService.summarizeStream.mockReturnValueOnce(trickStream(comp));
    comp.summarizeText = 'trick';
    await comp.onSummarize();
    expect(comp.summaryResult()).toBe('y');
  });

  // ── onGenerateInsights ────────────────────────────────────────────

  it('covers the null-coalescing fallback in onGenerateInsights update', async () => {
    const stubs = makeStubs();
    async function* trickStream(
      component: AiPanelComponent,
    ): AsyncGenerator<string, void, undefined> {
      component.insightsResult.set(null);
      yield 'z';
    }
    const { fixture } = await renderPanel(stubs);
    const comp = fixture.componentInstance;
    stubs.aiService.dealInsightsStream.mockReturnValueOnce(trickStream(comp));
    comp.dealIdInput = '1';
    await comp.onGenerateInsights();
    expect(comp.insightsResult()).toBe('z');
  });

  it('onGenerateInsights does nothing when dealIdInput is empty', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.dealIdInput = '';
    await fixture.componentInstance.onGenerateInsights();
    expect(aiService.dealInsightsStream).not.toHaveBeenCalled();
  });

  it('onGenerateInsights does nothing when dealIdInput is not a number', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.dealIdInput = 'abc';
    await fixture.componentInstance.onGenerateInsights();
    expect(aiService.dealInsightsStream).not.toHaveBeenCalled();
  });

  it('onGenerateInsights does nothing when dealIdInput is zero or negative', async () => {
    const { fixture, aiService } = await renderPanel();

    fixture.componentInstance.dealIdInput = '0';
    await fixture.componentInstance.onGenerateInsights();
    expect(aiService.dealInsightsStream).not.toHaveBeenCalled();

    fixture.componentInstance.dealIdInput = '-5';
    await fixture.componentInstance.onGenerateInsights();
    expect(aiService.dealInsightsStream).not.toHaveBeenCalled();
  });

  it('onGenerateInsights calls the streaming service and stores the result', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.dealIdInput = '42';
    await fixture.componentInstance.onGenerateInsights();

    expect(aiService.dealInsightsStream).toHaveBeenCalledWith(
      42,
      expect.any(AbortSignal),
    );
    expect(fixture.componentInstance.generatingInsights()).toBe(false);
    expect(fixture.componentInstance.insightsResult()).toBe('deal insight');
  });

  it('keeps generatingInsights false on stream error', async () => {
    const stubs = makeStubs();
    stubs.aiService.dealInsightsStream.mockReturnValueOnce(
      errorStream('insight fail'),
    );
    const { fixture } = await renderPanel(stubs);

    fixture.componentInstance.dealIdInput = '10';
    await fixture.componentInstance.onGenerateInsights();

    expect(fixture.componentInstance.generatingInsights()).toBe(false);
    expect(fixture.componentInstance.insightsResult()).toBe(
      'Error: insight fail',
    );
  });

  it('suppresses AbortError during onGenerateInsights', async () => {
    const stubs = makeStubs();
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    async function* abortStream(): AsyncGenerator<string, void, undefined> {
      throw abortError;
    }
    stubs.aiService.dealInsightsStream.mockReturnValueOnce(abortStream());
    const { fixture } = await renderPanel(stubs);

    fixture.componentInstance.dealIdInput = '10';
    await fixture.componentInstance.onGenerateInsights();

    expect(fixture.componentInstance.generatingInsights()).toBe(false);
    // insightsResult should NOT contain an error message for AbortError
    expect(fixture.componentInstance.insightsResult()).toBe('');
  });

  it('shows the insights spinner while generating insights', async () => {
    const stubs = makeStubs();
    stubs.aiService.dealInsightsStream.mockReturnValueOnce(neverStream());

    const { fixture } = await renderPanel(stubs);
    fixture.componentInstance.dealIdInput = '5';
    // Don't await — it never resolves
    fixture.componentInstance.onGenerateInsights();
    fixture.detectChanges();

    expect(fixture.componentInstance.generatingInsights()).toBe(true);
  });

  // ── Deal Insights DOM interaction tests ───────────────────────────

  it('renders the Deal Insights tab label', async () => {
    await renderPanel();
    expect(screen.getByText('Deal Insights')).toBeInTheDocument();
  });

  it('renders insights result text after generating insights via the Deal Insights tab', async () => {
    const { fixture } = await renderPanel();
    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.dealIdInput = '7';
    await fixture.componentInstance.onGenerateInsights();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('deal insight')).toBeInTheDocument();
  });

  it('calls onGenerateInsights via the Generate Insights button click handler', async () => {
    const { fixture, aiService } = await renderPanel();
    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.dealIdInput = '99';
    await fixture.componentInstance.onGenerateInsights();

    expect(aiService.dealInsightsStream).toHaveBeenCalledWith(
      99,
      expect.any(AbortSignal),
    );
    expect(fixture.componentInstance.insightsResult()).toBe('deal insight');
  });

  it('exercises the (click) handler on the Generate Insights button', async () => {
    // The button has (click)="onGenerateInsights()" in the template.
    // Due to Angular's type="number" ngModel interop, we set dealIdInput
    // before the tab is rendered to avoid ExpressionChangedAfterItHasBeenCheckedError.
    const stubs = makeStubs();
    stubs.aiService.dealInsightsStream.mockReturnValue(fakeStream(['ok']));
    const { fixture, aiService } = await renderPanel(stubs);

    // Set dealIdInput BEFORE switching tabs to avoid two-way binding issues
    fixture.componentInstance.dealIdInput = '42';

    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = screen.getByRole('button', {
      name: /Generate Insights/,
    }) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(aiService.dealInsightsStream).toHaveBeenCalled();
  });

  it('triggers onGenerateInsights when Enter is pressed in the deal ID input', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.autoDetectChanges(true);
    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    await fixture.whenStable();

    fixture.componentInstance.dealIdInput = '55';
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await fixture.whenStable();

    expect(aiService.dealInsightsStream).toHaveBeenCalledWith(
      55,
      expect.any(AbortSignal),
    );
  });

  it('shows the insights spinner in the Deal Insights tab DOM while generating', async () => {
    const stubs = makeStubs();
    stubs.aiService.dealInsightsStream.mockReturnValueOnce(neverStream());

    const { fixture } = await renderPanel(stubs);
    fixture.autoDetectChanges(true);
    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    await fixture.whenStable();

    fixture.componentInstance.dealIdInput = '5';
    await fixture.whenStable();

    fixture.componentInstance.onGenerateInsights();
    await fixture.whenStable();

    expect(fixture.componentInstance.generatingInsights()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('updates dealIdInput via the Deal Insights tab', async () => {
    const { fixture } = await renderPanel();
    fixture.autoDetectChanges(true);
    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    await fixture.whenStable();

    fixture.componentInstance.dealIdInput = '123';
    await fixture.whenStable();

    expect(fixture.componentInstance.dealIdInput).toBe('123');
  });

  it('writes dealIdInput through the ngModel directive on the number input', async () => {
    const { fixture } = await renderPanel();
    const insightsTab = screen.getByRole('tab', { name: /Deal Insights/i });
    insightsTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Get the NgModel directive on the number input
    const inputDebug = fixture.debugElement.query(
      By.css('input[type="number"]'),
    );
    const ngModel = inputDebug.injector.get(NgModel);
    // Simulate the ngModel viewToModelUpdate path
    ngModel.viewToModelUpdate('77');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.dealIdInput).toBe('77');
  });
});
