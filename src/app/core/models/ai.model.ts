import { Contact } from './contact.model';
import { Activity } from './activity.model';

export interface SummarizeRequest {
  text: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface SmartSearchRequest {
  query: string;
}

export interface SmartSearchResponse {
  interpretation: string;
  contacts: Contact[];
  activities: Activity[];
}
