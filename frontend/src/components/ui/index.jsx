import React from 'react';
import { cn } from '../../lib/utils';

const ICON_COLORS = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  primary: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  default: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
};

export function StatsCard({ title, value, change, changeType, icon: Icon, iconColor = 'primary' }) {
  const scheme = ICON_COLORS[iconColor] || ICON_COLORS.primary;
  return (
    <div className="card-hover p-6 group">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {change && (
            <p className={cn('text-sm font-medium flex items-center gap-1', changeType === 'increase' ? 'text-emerald-600' : 'text-emerald-500')}>
              <span className={cn('inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]', changeType === 'increase' ? 'bg-emerald-100' : 'bg-emerald-100')}>
                {changeType === 'increase' ? '↑' : '↓'}
              </span>
              {change}
              <span className="text-slate-400 font-normal">vs last month</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
            scheme.bg
          )}>
            <Icon className={cn('w-6 h-6', scheme.text)} />
          </div>
        )}
      </div>
    </div>
  );
}

export function DataTable({ columns, data, emptyMessage = 'No data found.', pageSize: initialPageSize = 10, pageSizeOptions = [5, 10, 20, 50] }) {
  const [sortKey, setSortKey] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  // Reset page when data changes
  React.useEffect(() => { setPage(0); }, [data.length]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  // Sort data
  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const pagedData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <span className="ml-1 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity">↕</span>;
    return <span className="ml-1 text-primary-500">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="border border-emerald-400 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200/80">
              {columns.map((col) => {
                const sortable = col.sortable !== false && col.key !== 'actions';
                return (
                  <th
                    key={col.key}
                    onClick={sortable ? () => handleSort(col.key) : undefined}
                    className={cn(
                      'px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider group/th',
                      sortable && 'cursor-pointer select-none hover:text-slate-700 transition-colors'
                    )}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-primary-50/30 transition-colors duration-150">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-sm text-slate-700">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>of {sorted.length} entries</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1 text-sm rounded-lg text-slate-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ««
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 text-sm rounded-lg text-slate-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-8 h-8 text-sm rounded-lg font-medium transition-colors',
                    page === pageNum ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-500 hover:bg-primary-50'
                  )}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2.5 py-1 text-sm rounded-lg text-slate-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-sm rounded-lg text-slate-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
      {Icon && (
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
          <Icon className="w-8 h-8 text-primary-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1.5 text-center max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div
      className={cn(
        'border-primary-200 border-t-primary-600 rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10"
      />
    </div>
  );
}

export function StatusBadge({ status }) {
  const colorMap = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    present: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    upcoming: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    pending: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    cancelled: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    absent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    ongoing: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    draft: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/50',
  };

  return (
    <span className={cn('badge capitalize', colorMap[status] || 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/50')}>
      {status}
    </span>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-md w-full p-6 animate-scale-in">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            className={cn('text-sm', danger ? 'btn-danger' : 'btn-primary')}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, size = 'md', children }) {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-h-[90vh] flex flex-col animate-scale-in',
        sizeClasses[size]
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
