export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertType = 'battery_low' | 'door_left_open' | 'tamper' | 'offline' | 'failed_attempts';
export type AlertStatus = 'unread' | 'read' | 'resolved' | 'ignored';
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export type AlertDedupeKey = `${AlertType}:${string}`;

export type Alert = {
  id: string;
  lockId: string;
  lockName: string;
  roomName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  dedupeKey: AlertDedupeKey;
  eventCount: number;
  relatedRecordIds: string[];
  ticketId?: string;
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  lastEventAt: number;
  lastNotificationAt?: number;
  note?: string;
};

export type AlertFilter = {
  status?: AlertStatus | 'all';
  severity?: AlertSeverity | 'all';
  lockId?: string;
  query?: string;
};

export type IncidentTicket = {
  id: string;
  alertId: string;
  lockId: string;
  lockName: string;
  roomName: string;
  title: string;
  description: string;
  assignee: string;
  priority: TicketPriority;
  dueAt: number;
  status: TicketStatus;
  attachmentNames: string[];
  createdAt: number;
  updatedAt: number;
  resolutionNote?: string;
};

export type CreateTicketInput = {
  alertId: string;
  title: string;
  description: string;
  assignee: string;
  priority: TicketPriority;
  dueHours: number;
  attachmentNames?: string[];
};

export type NotificationPolicy = {
  enabled: boolean;
  severityThreshold: AlertSeverity;
  cooldownMinutes: number;
  dedupeWindowMinutes: number;
  pushCriticalOnly: boolean;
  mutedTypes: AlertType[];
};

export type AlertSummary = {
  total: number;
  unread: number;
  critical: number;
  high: number;
  ticketsOpen: number;
  resolved: number;
};
