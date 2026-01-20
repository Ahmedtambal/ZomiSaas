import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const KPICard = ({ title, value, subtitle, icon: Icon, trend }: KPICardProps) => {
  return (
    <div className="glass-panel rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-zomi-green" />
        </div>
        {trend && (
          <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
};
