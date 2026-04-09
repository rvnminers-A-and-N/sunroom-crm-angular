import { Tag } from './tag.model';
import { Company } from './company.model';
import { Deal } from './deal.model';
import { Activity } from './activity.model';

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyName: string | null;
  companyId: number | null;
  lastContactedAt: string | null;
  tags: Tag[];
  createdAt: string;
}

export interface ContactDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: Company | null;
  tags: Tag[];
  deals: Deal[];
  activities: Activity[];
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
  companyId?: number;
  tagIds?: number[];
}

export interface UpdateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  notes?: string;
  companyId?: number;
}

export interface ContactFilterParams {
  page: number;
  perPage: number;
  search?: string;
  companyId?: number;
  tagId?: number;
  sort?: string;
  direction?: string;
}
