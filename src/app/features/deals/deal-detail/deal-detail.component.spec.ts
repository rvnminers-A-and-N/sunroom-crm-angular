import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { DealDetailComponent } from './deal-detail.component';
import { DealService } from '../services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeDealDetail, makeActivity } from '../../../../testing/fixtures';

interface DealServiceStub {
  getDeal: ReturnType<typeof vi.fn>;
  deleteDeal: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

interface DialogStub {
  open: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const dialogRef = {
    afterClosed: vi.fn().mockReturnValue(of(undefined)),
  } as unknown as MatDialogRef<unknown>;

  const dealService: DealServiceStub = {
    getDeal: vi.fn().mockReturnValue(
      of(
        makeDealDetail({
          id: 7,
          title: 'Big Deal',
          stage: 'Qualified',
          notes: 'Notes',
          activities: [makeActivity({ id: 1 })],
          insights: [
            { id: 1, insight: 'Looks promising', generatedAt: '2025-01-01T00:00:00.000Z' },
          ],
          expectedCloseDate: '2025-12-31T00:00:00.000Z',
          closedAt: '2025-12-15T00:00:00.000Z',
        }),
      ),
    ),
    deleteDeal: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { dealService, notification, dialog, dialogRef };
}

async function renderDetail(overrides?: { id?: string; dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }
  const id = overrides?.id ?? '7';

  const result = await renderWithProviders(DealDetailComponent, {
    routes: [{ path: 'deals', children: [] }],
    providers: [
      { provide: DealService, useValue: stubs.dealService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (_: string) => id } } },
      },
    ],
  });

  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { ...result, ...stubs, navigate };
}

describe('DealDetailComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('loads and renders the deal', async () => {
    const { dealService } = await renderDetail();
    expect(dealService.getDeal).toHaveBeenCalledWith(7);
    expect(await screen.findByRole('heading', { name: 'Big Deal' })).toBeInTheDocument();
  });

  it('navigates to /deals and clears loading when the load fails', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeal.mockImplementation(() => throwError(() => new Error('nope')));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'deals', children: [] }]),
        provideHttpClient(),
        provideAnimationsAsync('noop'),
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '7' } } },
        },
      ],
    });

    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(DealDetailComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/deals']);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.deal()).toBeNull();
  });

  it('currentStageIndex returns the index of the deal stage', async () => {
    const { fixture } = await renderDetail();
    // Default fixture stage is 'Qualified' = index 1
    expect(fixture.componentInstance.currentStageIndex).toBe(1);
  });

  it('currentStageIndex returns 0 when there is no deal', async () => {
    const { fixture } = await renderDetail();
    fixture.componentInstance.deal.set(null);
    expect(fixture.componentInstance.currentStageIndex).toBe(0);
  });

  it('currentStageIndex returns 0 for an unknown stage', async () => {
    const { fixture } = await renderDetail();
    fixture.componentInstance.deal.set(
      makeDealDetail({ id: 1, stage: 'Bogus' as never }),
    );
    expect(fixture.componentInstance.currentStageIndex).toBe(0);
  });

  it('getStageClass returns the lower-cased stage modifier', async () => {
    const { fixture } = await renderDetail();
    expect(fixture.componentInstance.getStageClass('Won')).toBe('stage-badge stage-badge--won');
  });

  it('openEditDialog does nothing when there is no deal', async () => {
    const { fixture, dialog } = await renderDetail();
    fixture.componentInstance.deal.set(null);
    fixture.componentInstance.openEditDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('openEditDialog opens the dialog and reloads when it returns truthy', async () => {
    const { fixture, dialog, dealService } = await renderDetail({ dialogResult: true });
    dealService.getDeal.mockClear();

    fixture.componentInstance.openEditDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getDeal).toHaveBeenCalledWith(7);
  });

  it('openEditDialog does not reload when dismissed without saving', async () => {
    const { fixture, dialog, dealService } = await renderDetail({ dialogResult: undefined });
    dealService.getDeal.mockClear();

    fixture.componentInstance.openEditDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getDeal).not.toHaveBeenCalled();
  });

  it('confirmDelete does nothing when there is no deal', async () => {
    const { fixture, dialog } = await renderDetail();
    fixture.componentInstance.deal.set(null);
    fixture.componentInstance.confirmDelete();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('confirmDelete deletes and navigates when confirmed', async () => {
    const { fixture, dialog, dealService, notification, navigate } = await renderDetail({
      dialogResult: true,
    });

    fixture.componentInstance.confirmDelete();

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.deleteDeal).toHaveBeenCalledWith(7);
    expect(notification.success).toHaveBeenCalledWith('Deal deleted');
    expect(navigate).toHaveBeenCalledWith(['/deals']);
  });

  it('confirmDelete does nothing when cancelled', async () => {
    const { fixture, dealService, notification, navigate } = await renderDetail({
      dialogResult: false,
    });

    fixture.componentInstance.confirmDelete();

    expect(dealService.deleteDeal).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clicks the edit button via DOM', async () => {
    const { dialog } = await renderDetail({ dialogResult: false });
    const editBtn = screen.getByRole('button', { name: /Edit/i });
    await userEvent.click(editBtn);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('clicks the delete button via DOM', async () => {
    const { dialog } = await renderDetail({ dialogResult: false });
    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    await userEvent.click(deleteBtn);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('renders the loading state when deal is null and loading is true', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeal.mockReturnValue(NEVER);

    await renderWithProviders(DealDetailComponent, {
      routes: [{ path: 'deals', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '7' } } },
        },
      ],
    });

    expect(screen.getByText('Loading deal...')).toBeInTheDocument();
  });

  it('renders the empty activities placeholder when there are none', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeal.mockReturnValue(
      of(
        makeDealDetail({
          id: 8,
          activities: [],
          insights: [],
          notes: null,
          companyName: null,
          companyId: null,
          expectedCloseDate: null,
          closedAt: null,
        }),
      ),
    );

    await renderWithProviders(DealDetailComponent, {
      routes: [{ path: 'deals', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '8' } } },
        },
      ],
    });

    expect(await screen.findByText('No activities recorded')).toBeInTheDocument();
  });

  it('renders the AI insights panel when insights are present', async () => {
    await renderDetail();
    expect(await screen.findByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Looks promising')).toBeInTheDocument();
  });

  it('renders activity bodies when present', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeal.mockReturnValue(
      of(
        makeDealDetail({
          id: 9,
          activities: [makeActivity({ id: 1, body: 'Activity body content' })],
          insights: [],
        }),
      ),
    );

    await renderWithProviders(DealDetailComponent, {
      routes: [{ path: 'deals', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '9' } } },
        },
      ],
    });

    expect(await screen.findByText('Activity body content')).toBeInTheDocument();
  });

  it('hides activity body when missing', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeal.mockReturnValue(
      of(
        makeDealDetail({
          id: 10,
          activities: [makeActivity({ id: 1, body: null })],
          insights: [],
        }),
      ),
    );

    const { fixture } = await renderWithProviders(DealDetailComponent, {
      routes: [{ path: 'deals', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '10' } } },
        },
      ],
    });

    expect(fixture.nativeElement.querySelector('.activity-item__body')).toBeNull();
  });
});
