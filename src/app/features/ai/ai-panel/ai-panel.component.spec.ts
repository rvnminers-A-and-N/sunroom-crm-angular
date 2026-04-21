import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/angular';
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
});
