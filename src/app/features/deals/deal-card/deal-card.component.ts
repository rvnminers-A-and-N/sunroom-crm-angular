import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Deal } from '@core/models/deal.model';

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, MatIconModule],
  templateUrl: './deal-card.component.html',
  styleUrl: './deal-card.component.scss',
})
export class DealCardComponent {
  deal = input.required<Deal>();
}
