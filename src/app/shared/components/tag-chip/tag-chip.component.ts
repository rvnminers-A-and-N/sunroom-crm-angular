import { Component, input, output } from '@angular/core';
import { Tag } from '@core/models/tag.model';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  template: `
    <span class="tag-chip" [style.background]="tag().color + '20'" [style.color]="tag().color">
      {{ tag().name }}
      @if (removable()) {
        <button class="tag-chip__remove" (click)="remove.emit(); $event.stopPropagation()">×</button>
      }
    </span>
  `,
  styles: `
    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;

      &__remove {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 14px;
        padding: 0;
        line-height: 1;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }
    }
  `,
})
export class TagChipComponent {
  tag = input.required<Tag>();
  removable = input(false);
  remove = output<void>();
}
