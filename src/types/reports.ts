export type ComponentType =
  | 'Text'
  | 'Image'
  | 'Table'
  | 'KPICard'
  | 'Chart'
  | 'Pivot'
  | 'GroupHeader'
  | 'GroupFooter'
  | 'Summary'
  | 'Spacer'
  | 'PageBreak';

export type ChartType = 'Bar' | 'Column' | 'Line' | 'Area' | 'Pie' | 'Donut';

export type ColumnFormatType = 'Text' | 'Number' | 'Currency' | 'Percentage' | 'Date' | 'DateTime';

export type AggregationType = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';

export interface TableColumnConfig {
  id: string;
  sourceField: string;
  displayName: string;
  width?: string;
  alignment: 'Left' | 'Center' | 'Right';
  format: ColumnFormatType;
  currencySymbol?: string; // "₹", "$", "€"
  useIndianFormat?: boolean;
  visible: boolean;
  sortable: boolean;
  sortDirection?: 'ASC' | 'DESC';
  aggregate?: AggregationType;
  groupHeader?: boolean;
}

export interface KPIConfig {
  title: string;
  valueField: string;
  aggregation: AggregationType;
  currencySymbol: string;
  useIndianFormat: boolean;
  comparisonPeriod?: 'PreviousMonth' | 'PreviousYear' | 'Custom';
  comparisonValue?: number;
  percentageChange?: number;
  subtitle?: string;
}

export interface ChartConfig {
  chartType: ChartType;
  categoryField: string;
  valueField: string;
  aggregation: AggregationType;
  seriesField?: string;
  limit: number; // Top N (default 20)
  title: string;
  showLegend: boolean;
  showLabels: boolean;
}

export interface PivotConfig {
  rows: string[];
  columns: string[];
  values: {
    field: string;
    aggregation: AggregationType;
    displayName: string;
  }[];
  filters?: string[];
}

export interface CalculatedField {
  id: string;
  name: string;
  expression: string; // "Sales - Cost"
  dataType: 'Decimal' | 'Integer' | 'Text';
  format: ColumnFormatType;
  currencySymbol?: string;
}

export interface ConditionalFormatRule {
  id: string;
  field: string;
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  value: string | number;
  backgroundColor?: string;
  textColor?: string;
  label?: string;
}

export interface ReportComponent {
  id: string;
  type: ComponentType;
  title?: string;
  x: number; // Grid placement X
  y: number; // Grid placement Y
  w: number; // Width cols
  h: number; // Height rows
  tableColumns?: TableColumnConfig[];
  kpiConfig?: KPIConfig;
  chartConfig?: ChartConfig;
  pivotConfig?: PivotConfig;
  textContent?: string;
  fontSize?: number;
  isBold?: boolean;
  alignment?: 'Left' | 'Center' | 'Right';
  conditionalRules?: ConditionalFormatRule[];
}

export interface ReportParameter {
  id: string;
  name: string;
  displayName: string;
  dataType: 'Date' | 'Text' | 'Number' | 'Dropdown';
  defaultValue?: any;
  options?: string[];
  required: boolean;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: '=' | '!=' | '<' | '>' | '<=' | '>=' | 'CONTAINS' | 'BETWEEN' | 'IN' | 'IS_NULL';
  value: any;
  secondValue?: any;
}

export interface ReportTheme {
  id: string;
  name: string;
  primaryFont: string;
  headingFont: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderStyle: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  mappingId: string;
  mappingName?: string;
  components: ReportComponent[];
  calculatedFields: CalculatedField[];
  parameters: ReportParameter[];
  filters: ReportFilter[];
  theme: ReportTheme;
  pageSettings: {
    paperSize: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation: 'Portrait' | 'Landscape';
    margins: 'Normal' | 'Narrow' | 'Custom';
  };
  isFavorite?: boolean;
}

export interface ReportValidationResult {
  isValid: boolean;
  mappingCompatible: boolean;
  messages: {
    level: 'Error' | 'Warning' | 'Info';
    componentId?: string;
    message: string;
  }[];
}
