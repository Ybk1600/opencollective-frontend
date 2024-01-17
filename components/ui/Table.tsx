import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';

import { cn } from '../../lib/utils';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { mobileTableView?: boolean; fullWidth?: boolean; innerClassName?: string }
>(({ className, innerClassName, mobileTableView, fullWidth, ...props }, ref) => (
  <div
    className={cn(
      'table-auto overflow-auto',
      mobileTableView || fullWidth
        ? '-mx-4 border-b border-t 2xl:mx-0 2xl:rounded-xl 2xl:border'
        : 'w-full rounded-xl border',
      fullWidth ? 'sm:-mx-6' : mobileTableView ? 'sm:mx-0 sm:w-full sm:rounded-xl sm:border' : '',
      className,
    )}
  >
    <table ref={ref} className={cn('w-full caption-bottom text-sm', innerClassName)} {...props} />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn('bg-slate-900 font-medium text-slate-50', className)} {...props} />
  ),
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { highlightOnHover?: boolean }
>(({ className, highlightOnHover = true, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'group border-b ring-inset ring-ring data-[state=selected]:bg-slate-100',
      highlightOnHover && 'hover:bg-slate-100',
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { fullWidth?: boolean }
>(({ className, fullWidth, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn(
        'h-12 px-2 text-left align-middle font-medium text-slate-500 first:pl-4 last:pr-4 [&:has([role=checkbox])]:pr-0 ',
        fullWidth && 'sm:first:pl-6 sm:last:pr-6 2xl:first:pl-4 2xl:last:pr-4',
        className,
      )}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { fullWidth?: boolean; withIndicator?: boolean; compact?: boolean }
>(({ className, fullWidth, withIndicator, compact, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'relative  px-2 py-2 align-middle  first:pl-4 last:pr-4  [&:has([role=checkbox])]:pr-0',
      withIndicator && 'first:border-l-2 first:border-transparent first:data-[state=indicated]:border-primary',
      fullWidth && 'sm:first:pl-6 sm:last:pr-6 2xl:first:pl-4 2xl:last:pr-4',
      compact ? 'h-[36px] min-h-[36px]' : 'h-[56px] min-h-[56px]',
      className,
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-slate-500 ', className)} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';

const TableActionsButton = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-transparent text-slate-500 shadow-sm shadow-transparent ring-2 ring-transparent transition-colors hover:text-slate-950 hover:shadow-slate-200  focus:outline-none focus-visible:ring-black active:ring-black group-hover:border-slate-200 group-hover:bg-white data-[state=open]:ring-black',
        className,
      )}
      {...props}
    >
      <MoreHorizontal size={20} />
    </button>
  ),
);
TableActionsButton.displayName = 'TableActionsButton';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, TableActionsButton };
