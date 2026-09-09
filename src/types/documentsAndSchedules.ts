export interface DocumentPrintSettings {
  paperSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'Portrait' | 'Landscape';
  marginPreset: 'Normal' | 'Narrow' | 'Wide';
  showHeader: boolean;
  showFooter: boolean;
  headerText: string;
  footerText: string;
  includePageNumbers: boolean;
  companyLogoUrl?: string;
  watermarkText?: string;
  primaryColorHex: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  reportOrPackageId: string;
  isPackage: boolean;
  targetName: string;
  scheduleType: 'Daily' | 'Weekly' | 'Monthly' | 'Cron';
  cronExpression: string;
  timeOfDay: string;
  daysOfWeek: string[];
  dayOfMonth: number;
  enabled: boolean;
  recipientEmails: string[];
  exportFormat: 'PDF' | 'Excel' | 'CSV' | 'PackageBundle';
  emailSubject: string;
  emailBody: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus: 'Success' | 'Failed' | 'Pending' | 'Running';
}

export interface ScheduleDeliveryLog {
  id: string;
  scheduleId: string;
  scheduleName: string;
  executedAt: string;
  status: 'Success' | 'Failed' | 'Retrying';
  recipientCount: number;
  attachmentFormat: string;
  details: string;
  executionTimeMs: number;
}

export interface ReportPackageSection {
  id: string;
  reportId: string;
  reportTitle: string;
  customTitle?: string;
  executiveNotes?: string;
  order: number;
  includeCoverPageBreak: boolean;
}

export interface ReportPackageDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  companyName: string;
  preparedBy: string;
  periodLabel: string;
  createdAt: string;
  updatedAt: string;
  coverLogoUrl?: string;
  printSettings: DocumentPrintSettings;
  sections: ReportPackageSection[];
}
