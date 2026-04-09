import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AiService } from '../services/ai.service';
import { SmartSearchResponse } from '@core/models/ai.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ActivityIconComponent } from '@shared/components/activity-icon/activity-icon.component';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    PageHeaderComponent,
    ActivityIconComponent,
  ],
  templateUrl: './ai-panel.component.html',
  styleUrl: './ai-panel.component.scss',
})
export class AiPanelComponent {
  private aiService = inject(AiService);

  // Smart Search
  searchQuery = '';
  searching = signal(false);
  searchResult = signal<SmartSearchResponse | null>(null);

  // Summarize
  summarizeText = '';
  summarizing = signal(false);
  summaryResult = signal<string | null>(null);

  onSearch(): void {
    if (!this.searchQuery.trim()) return;
    this.searching.set(true);
    this.searchResult.set(null);
    this.aiService.smartSearch(this.searchQuery).subscribe({
      next: (result) => {
        this.searchResult.set(result);
        this.searching.set(false);
      },
      error: () => this.searching.set(false),
    });
  }

  onSummarize(): void {
    if (!this.summarizeText.trim()) return;
    this.summarizing.set(true);
    this.summaryResult.set(null);
    this.aiService.summarize(this.summarizeText).subscribe({
      next: (result) => {
        this.summaryResult.set(result.summary);
        this.summarizing.set(false);
      },
      error: () => this.summarizing.set(false),
    });
  }
}
