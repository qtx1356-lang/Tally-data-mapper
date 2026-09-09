/**
 * Phase 32D - Reusable Date Dimension Generator
 * Supports company-specific financial year configuration (default India: April - March)
 */

import { DateDimensionRecord } from '../types/phase32DWarehouse';

export class WarehouseDateDimension {
  /**
   * Generates a date dimension record for a given YYYY-MM-DD string
   * @param dateString YYYY-MM-DD
   * @param fyStartMonth 1-12 (default 4 for April in India)
   */
  public static generateRecord(dateString: string, fyStartMonth: number = 4): DateDimensionRecord {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date string for Date Dimension: ${dateString}`);
    }

    const year = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth(); // 0 to 11
    const monthNumber = monthIndex + 1; // 1 to 12
    const day = d.getUTCDate();
    const dayOfWeek = d.getUTCDay(); // 0 (Sun) to 6 (Sat)

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const monthName = monthNames[monthIndex];
    const dayName = dayNames[dayOfWeek];

    // Calendar Quarter
    const quarter = Math.floor(monthIndex / 3) + 1;
    const quarterName = `Q${quarter}`;

    // Financial Year Calculation
    let fyStartYear: number;
    let fyEndYear: number;
    if (monthNumber >= fyStartMonth) {
      fyStartYear = year;
      fyEndYear = fyStartMonth === 1 ? year : year + 1;
    } else {
      fyStartYear = year - 1;
      fyEndYear = year;
    }

    const financialYear = fyStartMonth === 1 
      ? `${year}` 
      : `${fyStartYear}-${fyEndYear}`;

    const fyStartMonthPad = String(fyStartMonth).padStart(2, '0');
    const financialYearStart = `${fyStartYear}-${fyStartMonthPad}-01`;

    let fyEndMonth = fyStartMonth - 1;
    if (fyEndMonth <= 0) fyEndMonth = 12;
    const lastDayOfEndMonth = new Date(Date.UTC(fyEndYear, fyEndMonth, 0)).getUTCDate();
    const financialYearEnd = `${fyEndYear}-${String(fyEndMonth).padStart(2, '0')}-${String(lastDayOfEndMonth).padStart(2, '0')}`;

    // Financial Quarter
    const monthsIntoFy = (monthNumber - fyStartMonth + 12) % 12;
    const fqNumber = Math.floor(monthsIntoFy / 3) + 1;
    const financialQuarter = `FQ${fqNumber}`;

    // Week of Year (ISO 8601-ish UTC week calculation)
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekOfYear = Math.ceil(dayOfYear / 7);

    return {
      dateKey: dateString,
      date: dateString,
      day,
      dayOfWeek,
      dayName,
      month: monthName,
      monthNumber,
      quarter,
      quarterName,
      year,
      weekOfYear,
      financialYear,
      financialYearStart,
      financialYearEnd,
      financialQuarter,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    };
  }

  /**
   * Generates a date dimension range across a given date interval
   */
  public static generateRange(
    startDateStr: string,
    endDateStr: string,
    fyStartMonth: number = 4
  ): DateDimensionRecord[] {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const results: DateDimensionRecord[] = [];

    const current = new Date(start.getTime());
    while (current <= end) {
      const yyyy = current.getUTCFullYear();
      const mm = String(current.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(current.getUTCDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      results.push(this.generateRecord(dateKey, fyStartMonth));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return results;
  }
}
