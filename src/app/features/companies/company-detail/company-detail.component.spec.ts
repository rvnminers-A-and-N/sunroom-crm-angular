import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { CompanyDetailComponent } from './company-detail.component';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeCompanyDetail, makeContact, makeDeal } from '../../../../testing/fixtures';

interface CompanyServiceStub {
  getCompany: ReturnType<typeof vi.fn>;
  deleteCompany: ReturnType<typeof vi.fn>;
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

  const companyService: CompanyServiceStub = {
    getCompany: vi.fn().mockReturnValue(
      of(
        makeCompanyDetail({
          id: 7,
          name: 'Acme Inc',
          industry: 'Tech',
          website: 'https://acme.example',
          phone: '555-0200',
          address: '1 Acme Way',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          notes: 'Notes',
          contacts: [makeContact({ id: 1 })],
          deals: [makeDeal({ id: 1 })],
        }),
      ),
    ),
    deleteCompany: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { companyService, notification, dialog, dialogRef };
}

async function renderDetail(overrides?: { id?: string; dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }
  const id = overrides?.id ?? '7';

  const result = await renderWithProviders(CompanyDetailComponent, {
    routes: [{ path: 'companies', children: [] }],
    providers: [
      { provide: CompanyService, useValue: stubs.companyService },
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

describe('CompanyDetailComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('loads and renders the company', async () => {
    const { companyService } = await renderDetail();
    expect(companyService.getCompany).toHaveBeenCalledWith(7);
    expect(await screen.findByRole('heading', { name: 'Acme Inc' })).toBeInTheDocument();
  });

  it('navigates to /companies and clears loading when the load fails', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompany.mockImplementation(() => throwError(() => new Error('nope')));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'companies', children: [] }]),
        provideHttpClient(),
        provideAnimationsAsync('noop'),
        { provide: CompanyService, useValue: stubs.companyService },
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

    const fixture = TestBed.createComponent(CompanyDetailComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/companies']);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.company()).toBeNull();
  });

  it('openEditDialog does nothing when there is no company', async () => {
    const { fixture, dialog } = await renderDetail();
    fixture.componentInstance.company.set(null);
    fixture.componentInstance.openEditDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('openEditDialog opens the dialog and reloads when it returns truthy', async () => {
    const { fixture, dialog, companyService } = await renderDetail({ dialogResult: true });
    companyService.getCompany.mockClear();

    fixture.componentInstance.openEditDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.getCompany).toHaveBeenCalledWith(7);
  });

  it('openEditDialog does not reload when dismissed without saving', async () => {
    const { fixture, dialog, companyService } = await renderDetail({ dialogResult: undefined });
    companyService.getCompany.mockClear();

    fixture.componentInstance.openEditDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.getCompany).not.toHaveBeenCalled();
  });

  it('confirmDelete does nothing when there is no company', async () => {
    const { fixture, dialog } = await renderDetail();
    fixture.componentInstance.company.set(null);
    fixture.componentInstance.confirmDelete();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('confirmDelete deletes and navigates when confirmed', async () => {
    const { fixture, dialog, companyService, notification, navigate } = await renderDetail({
      dialogResult: true,
    });

    fixture.componentInstance.confirmDelete();

    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.deleteCompany).toHaveBeenCalledWith(7);
    expect(notification.success).toHaveBeenCalledWith('Company deleted');
    expect(navigate).toHaveBeenCalledWith(['/companies']);
  });

  it('confirmDelete does nothing when cancelled', async () => {
    const { fixture, companyService, notification, navigate } = await renderDetail({
      dialogResult: false,
    });

    fixture.componentInstance.confirmDelete();

    expect(companyService.deleteCompany).not.toHaveBeenCalled();
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

  it('renders the loading state when company is null and loading is true', async () => {
    const stubs = makeStubs();
    // Return a never-completing observable so loading stays true and company stays null.
    stubs.companyService.getCompany.mockReturnValue(NEVER);

    await renderWithProviders(CompanyDetailComponent, {
      routes: [{ path: 'companies', children: [] }],
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '7' } } },
        },
      ],
    });

    expect(screen.getByText('Loading company...')).toBeInTheDocument();
  });

  it('renders empty contacts and deals tables when there are none', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompany.mockReturnValue(
      of(
        makeCompanyDetail({
          id: 8,
          contacts: [],
          deals: [],
          industry: null,
          website: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          notes: null,
        }),
      ),
    );

    await renderWithProviders(CompanyDetailComponent, {
      routes: [{ path: 'companies', children: [] }],
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '8' } } },
        },
      ],
    });

    expect(await screen.findByText('No contacts at this company')).toBeInTheDocument();
    expect(screen.getByText('No deals with this company')).toBeInTheDocument();
  });

  it('renders the location block without an address line when address is missing', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompany.mockReturnValue(
      of(
        makeCompanyDetail({
          id: 11,
          address: null,
          city: 'Springfield',
          state: 'IL',
          contacts: [],
          deals: [],
        }),
      ),
    );

    await renderWithProviders(CompanyDetailComponent, {
      routes: [{ path: 'companies', children: [] }],
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '11' } } },
        },
      ],
    });

    expect(await screen.findByText(/Springfield, IL/)).toBeInTheDocument();
  });

  it('renders contact rows with email and title fallbacks', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompany.mockReturnValue(
      of(
        makeCompanyDetail({
          id: 9,
          contacts: [
            makeContact({
              id: 1,
              firstName: 'No',
              lastName: 'Email',
              email: null,
              title: null,
            }),
          ],
          deals: [],
        }),
      ),
    );

    await renderWithProviders(CompanyDetailComponent, {
      routes: [{ path: 'companies', children: [] }],
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '9' } } },
        },
      ],
    });

    expect(await screen.findByText('No Email')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
