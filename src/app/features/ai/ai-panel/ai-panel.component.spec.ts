import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NEVER, of, throwError } from 'rxjs';
import { screen } from '@testing-library/angular';
import { AiPanelComponent } from './ai-panel.component';
import { AiService } from '../services/ai.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeContact, makeActivity } from '../../../../testing/fixtures';
import type { SmartSearchResponse } from '@core/models/ai.model';

interface AiServiceStub {
  smartSearch: ReturnType<typeof vi.fn>;
  summarize: ReturnType<typeof vi.fn>;
}

function makeStubs(): { aiService: AiServiceStub } {
  return {
    aiService: {
      smartSearch: vi.fn().mockReturnValue(
        of<SmartSearchResponse>({
          interpretation: 'recent contacts',
          contacts: [makeContact({ id: 1 })],
          activities: [makeActivity({ id: 1 })],
        }),
      ),
      summarize: vi.fn().mockReturnValue(of({ summary: 'short summary' })),
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
    expect(aiService.smartSearch).not.toHaveBeenCalled();
    expect(fixture.componentInstance.searching()).toBe(false);
  });

  it('onSearch sets searching, calls the service and stores the result', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.searchQuery = 'who did I talk to';
    fixture.componentInstance.onSearch();

    expect(aiService.smartSearch).toHaveBeenCalledWith('who did I talk to');
    expect(fixture.componentInstance.searching()).toBe(false);
    expect(fixture.componentInstance.searchResult()?.interpretation).toBe('recent contacts');
  });

  it('renders contacts and activities sections after a successful search', async () => {
    const { fixture } = await renderPanel();
    fixture.componentInstance.searchQuery = 'people';
    fixture.componentInstance.onSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByText(/Contacts \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/Activities \(1\)/)).toBeInTheDocument();
  });

  it('renders the empty results message when there are no contacts and activities', async () => {
    const stubs = makeStubs();
    stubs.aiService.smartSearch.mockReturnValueOnce(
      of<SmartSearchResponse>({ interpretation: '', contacts: [], activities: [] }),
    );

    const { fixture } = await renderPanel(stubs);
    fixture.componentInstance.searchQuery = 'nope';
    fixture.componentInstance.onSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });

  it('renders the contact company meta only when present', async () => {
    const stubs = makeStubs();
    stubs.aiService.smartSearch.mockReturnValueOnce(
      of<SmartSearchResponse>({
        interpretation: '',
        contacts: [
          makeContact({ id: 1, companyName: 'Acme Inc' }),
          makeContact({ id: 2, firstName: 'Grace', lastName: 'Hopper', companyName: null }),
        ],
        activities: [],
      }),
    );

    const { fixture } = await renderPanel(stubs);
    fixture.componentInstance.searchQuery = 'people';
    fixture.componentInstance.onSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    // Only the first contact has a company shown.
    expect(screen.getAllByText('Acme Inc')).toHaveLength(1);
  });

  it('keeps searching false on smartSearch error', async () => {
    const { fixture, aiService } = await renderPanel();
    aiService.smartSearch.mockReturnValueOnce(throwError(() => new Error('boom')));

    fixture.componentInstance.searchQuery = 'fail';
    fixture.componentInstance.onSearch();

    expect(fixture.componentInstance.searching()).toBe(false);
  });

  it('shows the search spinner while a search is in flight', async () => {
    const { fixture, aiService } = await renderPanel();
    aiService.smartSearch.mockReturnValueOnce(NEVER);

    fixture.componentInstance.searchQuery = 'wait';
    fixture.componentInstance.onSearch();
    fixture.detectChanges();

    expect(fixture.componentInstance.searching()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('onSummarize does nothing when the text is whitespace', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.summarizeText = '   ';
    fixture.componentInstance.onSummarize();
    expect(aiService.summarize).not.toHaveBeenCalled();
    expect(fixture.componentInstance.summarizing()).toBe(false);
  });

  it('onSummarize calls the service and stores the summary', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.summarizeText = 'long text';
    fixture.componentInstance.onSummarize();

    expect(aiService.summarize).toHaveBeenCalledWith('long text');
    expect(fixture.componentInstance.summarizing()).toBe(false);
    expect(fixture.componentInstance.summaryResult()).toBe('short summary');
  });

  it('keeps summarizing false on summarize error', async () => {
    const { fixture, aiService } = await renderPanel();
    aiService.summarize.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.summarizeText = 'fail';
    fixture.componentInstance.onSummarize();

    expect(fixture.componentInstance.summarizing()).toBe(false);
  });

  it('renders the summary result block after a successful summarize', async () => {
    const { fixture } = await renderPanel();
    // Activate the Summarize tab so its @if branches are exercised by the template.
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.summarizeText = 'long text';
    fixture.componentInstance.onSummarize();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('short summary')).toBeInTheDocument();
  });

  it('shows the summarize spinner while a summarize is in flight', async () => {
    const { fixture, aiService } = await renderPanel();
    aiService.summarize.mockReturnValueOnce(NEVER);

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
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(aiService.smartSearch).toHaveBeenCalledWith('enter test');
  });

  it('triggers onSearch when the Search button is clicked via DOM', async () => {
    const { fixture, aiService } = await renderPanel();
    fixture.componentInstance.searchQuery = 'click test';
    fixture.detectChanges();

    const searchBtn = screen.getByRole('button', { name: /^Search$/ });
    searchBtn.click();
    fixture.detectChanges();

    expect(aiService.smartSearch).toHaveBeenCalledWith('click test');
  });

  it('triggers onSummarize when the Summarize button is clicked via DOM', async () => {
    const { fixture, aiService } = await renderPanel();
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'click summarize';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const summarizeBtn = screen.getByRole('button', { name: /^Summarize$/ });
    summarizeBtn.click();
    fixture.detectChanges();

    expect(aiService.summarize).toHaveBeenCalledWith('click summarize');
  });

  it('updates summarizeText via the textarea ngModel', async () => {
    const { fixture } = await renderPanel();
    const summarizeTab = screen.getByRole('tab', { name: /Summarize/i });
    summarizeTab.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'paste this';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.summarizeText).toBe('paste this');
  });
});
