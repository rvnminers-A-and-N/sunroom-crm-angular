import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AiService } from '../services/ai.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  templateUrl: './ai-panel.component.html',
  styleUrl: './ai-panel.component.scss',
})
export class AiPanelComponent {
  private aiService = inject(AiService);

  // Smart Search
  searchQuery = '';
  searching = signal(false);
  searchResult = signal<string | null>(null);

  // Summarize
  summarizeText = '';
  summarizing = signal(false);
  summaryResult = signal<string | null>(null);

  // Deal Insights
  dealIdInput = '';
  generatingInsights = signal(false);
  insightsResult = signal<string | null>(null);

  private searchAbortController: AbortController | null = null;

  async onSearch(): Promise<void> {
    if (!this.searchQuery.trim()) return;
    this.searchAbortController?.abort();
    this.searchAbortController = new AbortController();

    this.searching.set(true);
    this.searchResult.set('');

    try {
      for await (const chunk of this.aiService.smartSearchStream(
        this.searchQuery,
        this.searchAbortController.signal,
      )) {
        this.searchResult.update((prev) => (prev ?? '') + chunk);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.searchResult.set(`Error: ${(e as Error).message}`);
      }
    } finally {
      this.searching.set(false);
    }
  }

  private insightsAbortController: AbortController | null = null;
  private abortController: AbortController | null = null;

  async onGenerateInsights(): Promise<void> {
    const dealId = parseInt(this.dealIdInput, 10);
    if (isNaN(dealId) || dealId <= 0) return;
    this.insightsAbortController?.abort();
    this.insightsAbortController = new AbortController();

    this.generatingInsights.set(true);
    this.insightsResult.set('');

    try {
      for await (const chunk of this.aiService.dealInsightsStream(
        dealId,
        this.insightsAbortController.signal,
      )) {
        this.insightsResult.update((prev) => (prev ?? '') + chunk);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.insightsResult.set(`Error: ${(e as Error).message}`);
      }
    } finally {
      this.generatingInsights.set(false);
    }
  }

  async onSummarize(): Promise<void> {
    if (!this.summarizeText.trim()) return;
    this.abortController?.abort();
    this.abortController = new AbortController();

    this.summarizing.set(true);
    this.summaryResult.set('');

    try {
      for await (const chunk of this.aiService.summarizeStream(
        this.summarizeText,
        this.abortController.signal,
      )) {
        this.summaryResult.update((prev) => (prev ?? '') + chunk);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.summaryResult.set(`Error: ${(e as Error).message}`);
      }
    } finally {
      this.summarizing.set(false);
    }
  }
}
