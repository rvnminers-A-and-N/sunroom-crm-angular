import { Contact, ContactDetail } from '../app/core/models/contact.model';
import { Company, CompanyDetail } from '../app/core/models/company.model';
import { Deal, DealDetail, Pipeline, PipelineStage } from '../app/core/models/deal.model';
import { Activity } from '../app/core/models/activity.model';
import { Tag } from '../app/core/models/tag.model';
import { AuthResponse, User } from '../app/core/models/user.model';
import { DashboardData } from '../app/core/models/dashboard.model';
import { PaginatedResponse } from '../app/core/models/pagination.model';

const ISO = '2025-01-01T00:00:00.000Z';

/**
 * Test fixture builders. Each builder returns a fully-typed object that
 * matches the production model and accepts a partial override so individual
 * tests can mutate only the fields they care about.
 */

export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 1,
    name: 'VIP',
    color: '#02795f',
    createdAt: ISO,
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'User',
    avatarUrl: null,
    createdAt: ISO,
    ...overrides,
  };
}

export function makeAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    token: 'test-token',
    user: makeUser(),
    ...overrides,
  };
}

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '555-0100',
    title: 'Engineer',
    companyName: 'Acme Inc',
    companyId: 1,
    lastContactedAt: ISO,
    tags: [makeTag()],
    createdAt: ISO,
    ...overrides,
  };
}

export function makeContactDetail(overrides: Partial<ContactDetail> = {}): ContactDetail {
  return {
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '555-0100',
    title: 'Engineer',
    notes: 'Notes',
    lastContactedAt: ISO,
    createdAt: ISO,
    updatedAt: ISO,
    company: makeCompany(),
    tags: [makeTag()],
    deals: [makeDeal()],
    activities: [makeActivity()],
    ...overrides,
  };
}

export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: 1,
    name: 'Acme Inc',
    industry: 'Tech',
    website: 'https://acme.example',
    phone: '555-0200',
    city: 'Springfield',
    state: 'IL',
    contactCount: 5,
    dealCount: 3,
    createdAt: ISO,
    ...overrides,
  };
}

export function makeCompanyDetail(overrides: Partial<CompanyDetail> = {}): CompanyDetail {
  return {
    id: 1,
    name: 'Acme Inc',
    industry: 'Tech',
    website: 'https://acme.example',
    phone: '555-0200',
    address: '1 Acme Way',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    notes: 'Notes',
    createdAt: ISO,
    updatedAt: ISO,
    contacts: [makeContact()],
    deals: [makeDeal()],
    ...overrides,
  };
}

export function makeDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 1,
    title: 'Big Deal',
    value: 10_000,
    stage: 'Lead',
    contactName: 'Ada Lovelace',
    contactId: 1,
    companyName: 'Acme Inc',
    companyId: 1,
    expectedCloseDate: ISO,
    closedAt: null,
    createdAt: ISO,
    ...overrides,
  };
}

export function makeDealDetail(overrides: Partial<DealDetail> = {}): DealDetail {
  return {
    id: 1,
    title: 'Big Deal',
    value: 10_000,
    stage: 'Lead',
    contactName: 'Ada Lovelace',
    contactId: 1,
    companyName: 'Acme Inc',
    companyId: 1,
    expectedCloseDate: ISO,
    closedAt: null,
    notes: 'Notes',
    createdAt: ISO,
    updatedAt: ISO,
    activities: [makeActivity()],
    insights: [],
    ...overrides,
  };
}

export function makePipelineStage(overrides: Partial<PipelineStage> = {}): PipelineStage {
  return {
    stage: 'Lead',
    count: 1,
    totalValue: 10_000,
    deals: [makeDeal()],
    ...overrides,
  };
}

export function makePipeline(overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    stages: [
      makePipelineStage({ stage: 'Lead' }),
      makePipelineStage({ stage: 'Qualified', deals: [makeDeal({ id: 2, stage: 'Qualified' })] }),
      makePipelineStage({ stage: 'Proposal', deals: [] }),
      makePipelineStage({ stage: 'Negotiation', deals: [] }),
      makePipelineStage({ stage: 'Won', deals: [] }),
      makePipelineStage({ stage: 'Lost', deals: [] }),
    ],
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 1,
    type: 'Note',
    subject: 'Followed up',
    body: 'Sent a follow-up email.',
    aiSummary: null,
    contactId: 1,
    contactName: 'Ada Lovelace',
    dealId: 1,
    dealTitle: 'Big Deal',
    userName: 'Test User',
    occurredAt: ISO,
    createdAt: ISO,
    ...overrides,
  };
}

export function makeDashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    totalContacts: 12,
    totalCompanies: 4,
    totalDeals: 7,
    totalPipelineValue: 250_000,
    wonRevenue: 75_000,
    dealsByStage: [
      { stage: 'Lead', count: 2, totalValue: 10_000 },
      { stage: 'Qualified', count: 1, totalValue: 5_000 },
      { stage: 'Won', count: 1, totalValue: 75_000 },
    ],
    recentActivities: [
      {
        id: 1,
        type: 'Note',
        subject: 'Recent note',
        contactName: 'Ada Lovelace',
        userName: 'Test User',
        occurredAt: ISO,
      },
    ],
    ...overrides,
  };
}

export function makePaginated<T>(data: T[], overrides: Partial<PaginatedResponse<T>> = {}): PaginatedResponse<T> {
  return {
    data,
    meta: {
      currentPage: 1,
      perPage: 10,
      total: data.length,
      lastPage: 1,
    },
    ...overrides,
  };
}
