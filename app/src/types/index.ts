// ============================================================
// User & Auth Types
// ============================================================

export type UserRole =
  | 'ADMIN'
  | 'MANAGING_PARTNER'
  | 'ATTORNEY'
  | 'PARALEGAL'
  | 'LEGAL_ASSISTANT'
  | 'CLIENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  firmId: string;
  firm?: Firm;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Firm {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  settings?: Record<string, unknown>;
}

export interface AuthState {
  user: User | null;
  firm: Firm | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  firmName: string;
}

// ============================================================
// Case Types
// ============================================================

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'CLOSED' | 'ARCHIVED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: CaseStatus;
  priority: CasePriority;
  practiceArea?: string;
  courtName?: string;
  courtCaseNo?: string;
  filingDate?: string;
  nextHearingDate?: string;
  closedDate?: string;
  firmId: string;
  clientId?: string;
  client?: Client;
  assignments?: CaseAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseAssignment {
  id: string;
  caseId: string;
  userId: string;
  role: string;
  isLead: boolean;
  user?: User;
}

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  userId?: string;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  user?: User;
  createdAt: string;
}

// ============================================================
// Client Types
// ============================================================

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

export interface Client {
  id: string;
  type: ClientType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  firmId: string;
  cases?: Case[];
  _count?: { cases: number };
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Document Types
// ============================================================

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'ERROR';

export interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: DocumentStatus;
  tags: string[];
  aiSummary?: string;
  aiEntities?: Record<string, unknown>;
  firmId: string;
  caseId?: string;
  clientId?: string;
  uploadedById?: string;
  case?: Case;
  client?: Client;
  uploadedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Task Types
// ============================================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  caseId?: string;
  assigneeId?: string;
  firmId: string;
  case?: Case;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Billing Types
// ============================================================

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface TimeEntry {
  id: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  date: string;
  billable: boolean;
  caseId?: string;
  userId: string;
  invoiceId?: string;
  firmId: string;
  case?: Case;
  user?: User;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  caseId?: string;
  clientId?: string;
  firmId: string;
  case?: Case;
  client?: Client;
  timeEntries?: TimeEntry[];
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  receipt?: string;
  invoiceId?: string;
  caseId?: string;
  firmId: string;
  createdAt: string;
}

// ============================================================
// Calendar Types
// ============================================================

export type EventType = 'HEARING' | 'MEETING' | 'DEADLINE' | 'TASK' | 'COURT_DATE' | 'REMINDER' | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startTime: string;
  endTime?: string;
  allDay: boolean;
  location?: string;
  caseId?: string;
  createdById?: string;
  firmId: string;
  case?: Case;
  createdBy?: User;
  createdAt: string;
}

// ============================================================
// Compliance Types
// ============================================================

export type ComplianceStatus = 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'OVERDUE';

export interface ComplianceItem {
  id: string;
  title: string;
  description?: string;
  status: ComplianceStatus;
  category?: string;
  dueDate?: string;
  completedAt?: string;
  riskLevel?: string;
  firmId: string;
  caseId?: string;
  createdAt: string;
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardMetrics {
  activeCases: number;
  openTasks: number;
  upcomingDeadlines: number;
  totalClients: number;
  unpaidInvoices: number;
  totalRevenue: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: User;
}

// ============================================================
// API Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

// ============================================================
// Note Types
// ============================================================

export interface Note {
  id: string;
  content: string;
  caseId?: string;
  authorId?: string;
  firmId: string;
  author?: User;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Audit Log Types
// ============================================================

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userId?: string;
  firmId: string;
  user?: User;
  createdAt: string;
}
