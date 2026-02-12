import { Calendar } from 'lucide-react';

export type TimePeriod = '3months' | '6months' | '9months' | '1year';

export interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  label: string;
}

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export const getDateRangeForPeriod = (period: TimePeriod): DateRange => {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  
  const monthsMap: Record<TimePeriod, number> = {
    '3months': 3,
    '6months': 6,
    '9months': 9,
    '1year': 12,
  };
  
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - monthsMap[period]);
  
  const labelMap: Record<TimePeriod, string> = {
    '3months': 'Last 3 Months',
    '6months': 'Last 6 Months',
    '9months': 'Last 9 Months',
    '1year': 'Last Year',
  };
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate,
    label: labelMap[period],
  };
};

export const TimePeriodSelector = ({ selected, onChange }: TimePeriodSelectorProps) => {
  const options: { value: TimePeriod; label: string }[] = [
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '9months', label: 'Last 9 Months' },
    { value: '1year', label: 'Last Year' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-zomi-green" />
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value as TimePeriod)}
        title="Select time period for dashboard metrics"
        aria-label="Time period selector"
        className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-zomi-green focus:outline-none focus:ring-2 focus:ring-zomi-green/20 focus:border-zomi-green transition-all cursor-pointer shadow-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
