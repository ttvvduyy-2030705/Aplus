export type SupportTicketType = 'technical' | 'warranty' | 'maintenance' | 'diagnostic';
export type SupportTicketSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'cancelled';
export type WarrantyStatus = 'active' | 'expiring' | 'expired' | 'unknown';
export type MaintenanceTaskType = 'battery' | 'gateway' | 'firmware' | 'mechanical' | 'inspection';
export type MaintenanceTaskStatus = 'scheduled' | 'in_progress' | 'done' | 'overdue';
export type DiagnosticPackageStatus = 'draft' | 'generated' | 'redacted';

export type SupportTicket = {
  id: string;
  type: SupportTicketType;
  lockId: string;
  lockName: string;
  roomName: string;
  title: string;
  description: string;
  severity: SupportTicketSeverity;
  status: SupportTicketStatus;
  contactName: string;
  contactPhone: string;
  attachmentNames: string[];
  relatedAlertId?: string;
  relatedIncidentTicketId?: string;
  diagnosticPackageId?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolutionNote?: string;
};

export type WarrantyInfo = {
  id: string;
  lockId: string;
  lockName: string;
  serial: string;
  model: string;
  purchaseDate: number;
  installedAt: number;
  expiresAt: number;
  status: WarrantyStatus;
  provider: string;
  policyNote: string;
};

export type MaintenanceTask = {
  id: string;
  lockId: string;
  lockName: string;
  roomName: string;
  type: MaintenanceTaskType;
  title: string;
  status: MaintenanceTaskStatus;
  assignee: string;
  dueAt: number;
  checklist: string[];
  relatedTicketId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  note?: string;
};

export type DiagnosticPackage = {
  id: string;
  lockId: string;
  lockName: string;
  roomName: string;
  status: DiagnosticPackageStatus;
  fileName: string;
  createdAt: number;
  recordCount: number;
  alertCount: number;
  commandCount: number;
  redactedFields: string[];
  content: string;
  summary: string;
};

export type CreateSupportTicketInput = {
  lockId: string;
  type: SupportTicketType;
  title: string;
  description: string;
  severity: SupportTicketSeverity;
  contactName: string;
  contactPhone: string;
  attachmentNames?: string[];
  relatedAlertId?: string;
  relatedIncidentTicketId?: string;
};

export type CreateMaintenanceTaskInput = {
  lockId: string;
  type: MaintenanceTaskType;
  title: string;
  assignee: string;
  dueAt: number;
  checklist?: string[];
  relatedTicketId?: string;
};

export type SupportSummary = {
  openTickets: number;
  warrantyActive: number;
  maintenanceDue: number;
  packagesGenerated: number;
};
