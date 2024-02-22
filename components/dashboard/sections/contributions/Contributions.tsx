import React from 'react';
import { useQuery } from '@apollo/client';
import { compact, toNumber } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import Avatar from '../../../Avatar';
import { DataTable } from '../../../DataTable';
import DateTime from '../../../DateTime';
import type { EditOrderActions } from '../../../EditOrderModal';
import EditOrderModal from '../../../EditOrderModal';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import PaymentMethodTypeWithIcon from '../../../PaymentMethodTypeWithIcon';
import { managedOrderFragment } from '../../../recurring-contributions/graphql/queries';
import { Span } from '../../../Text';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../ui/DropdownMenu';
import { Pagination } from '../../../ui/Pagination';
import { TableActionsButton } from '../../../ui/Table';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta } from './filters';
import { filters, OrderTypeFilter, schema, toVariables } from './filters';

enum ContributionsTab {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  CANCELED = 'CANCELED',
}

const dashboardContributionsMetadataQuery = gql`
  query DashboardContributionsMetadata($slug: String!, $filter: AccountOrdersFilter!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      settings
      imageUrl
      currency
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      ALL: orders(filter: $filter) {
        totalCount
      }
      RECURRING: orders(filter: $filter, onlyActiveSubscriptions: true, includeIncognito: true) {
        totalCount
      }
      ONETIME: orders(filter: $filter, frequency: ONETIME, status: [PAID], includeIncognito: true, minAmount: 1) {
        totalCount
      }
      CANCELED: orders(filter: $filter, status: [CANCELLED], includeIncognito: true) {
        totalCount
      }
    }
  }
`;

const dashboardContributionsQuery = gql`
  query DashboardRecurringContributions(
    $slug: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $filter: AccountOrdersFilter!
    $frequency: ContributionFrequency
    $status: [OrderStatus!]
    $onlyActiveSubscriptions: Boolean
    $includeIncognito: Boolean
    $minAmount: Int
    $maxAmount: Int
    $paymentMethod: PaymentMethodReferenceInput
  ) {
    account(slug: $slug) {
      id
      orders(
        filter: $filter
        frequency: $frequency
        status: $status
        onlyActiveSubscriptions: $onlyActiveSubscriptions
        includeIncognito: $includeIncognito
        minAmount: $minAmount
        maxAmount: $maxAmount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
      ) {
        totalCount
        nodes {
          id
          ...ManagedOrderFields
        }
      }
    }
  }
  ${managedOrderFragment}
`;

const getColumns = ({ tab, setEditOrder, intl, isIncoming }) => {
  const toAccount = {
    accessorKey: 'toAccount',
    header: intl.formatMessage({ id: 'Collective', defaultMessage: 'Collective' }),
    cell: ({ cell }) => {
      const toAccount = cell.getValue();
      return (
        <LinkCollective collective={toAccount} className="hover:underline" withHoverCard>
          <div className="flex max-w-[200px] items-center">
            <Avatar size={24} collective={toAccount} mr={2} />
            <Span as="span" truncateOverflow>
              {toAccount.name}
            </Span>
          </div>
        </LinkCollective>
      );
    },
  };
  const fromAccount = {
    accessorKey: 'fromAccount',
    header: intl.formatMessage({ id: 'Contributor', defaultMessage: 'Contributor' }),
    cell: ({ cell }) => {
      const fromAccount = cell.getValue();
      return (
        <LinkCollective collective={fromAccount} className="hover:underline" withHoverCard>
          <div className="flex max-w-[200px] items-center">
            <Avatar size={24} collective={fromAccount} mr={2} />
            <Span as="span" truncateOverflow>
              {fromAccount.name}
            </Span>
          </div>
        </LinkCollective>
      );
    },
  };
  const orderId = {
    accessorKey: 'legacyId',
    header: intl.formatMessage({ id: 'order.id', defaultMessage: 'Contribution #' }),
  };
  const paymentMethod = {
    accessorKey: 'paymentMethod',
    header: intl.formatMessage({ id: 'paymentmethod.label', defaultMessage: 'Payment Method' }),
    cell: ({ cell }) => {
      const pm = cell.getValue();
      if (pm) {
        return (
          <div className="flex items-center gap-2 truncate">
            <PaymentMethodTypeWithIcon iconSize={18} type={pm.type} />
          </div>
        );
      }
    },
  };
  const status = {
    accessorKey: 'status',
    header: intl.formatMessage({ id: 'order.status', defaultMessage: 'Status' }),
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <div>
          <OrderStatusTag status={status} />
        </div>
      );
    },
  };

  const totalAmount = {
    accessorKey: 'totalAmount',
    header: intl.formatMessage({ defaultMessage: 'Total Amount' }),
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return (
        <div className="flex items-center gap-2 truncate">
          <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />
        </div>
      );
    },
  };

  if (!tab || [ContributionsTab.ONETIME, ContributionsTab.ALL].includes(tab)) {
    return [
      isIncoming ? fromAccount : toAccount,
      orderId,
      paymentMethod,
      totalAmount,
      {
        accessorKey: 'createdAt',
        header: intl.formatMessage({ id: 'expense.incurredAt', defaultMessage: 'Date' }),
        cell: ({ cell }) => {
          const date = cell.getValue();
          return (
            <div className="flex items-center gap-2 truncate">
              <DateTime value={date} dateStyle="medium" timeStyle={undefined} />
            </div>
          );
        },
      },
      status,
    ];
  } else if ([ContributionsTab.RECURRING, ContributionsTab.CANCELED].includes(tab)) {
    const amount = {
      accessorKey: 'amount',
      header: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
      cell: ({ cell, row }) => {
        const amount = cell.getValue();
        const order = row.original;
        return (
          <div className="flex items-center gap-2 truncate">
            <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} frequency={order.frequency} />
          </div>
        );
      },
    };

    if (tab === ContributionsTab.RECURRING) {
      const actions = {
        accessorKey: 'actions',
        header: null,
        meta: { className: 'flex justify-end' },
        cell: ({ row }) => {
          const order = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TableActionsButton />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOrder({ order, action: 'editPaymentMethod' })}>
                  <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOrder({ order, action: 'editAmount' })}>
                  <FormattedMessage id="subscription.menu.updateAmount" defaultMessage="Update amount" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setEditOrder({ order, action: 'cancel' })}>
                  <FormattedMessage id="subscription.menu.cancelContribution" defaultMessage="Cancel contribution" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      };
      return compact([
        isIncoming ? fromAccount : toAccount,
        orderId,
        paymentMethod,
        amount,
        totalAmount,
        status,
        isIncoming ? null : actions,
      ]);
    } else {
      return [isIncoming ? fromAccount : toAccount, orderId, paymentMethod, amount, totalAmount, status];
    }
  }
};

type ContributionsProps = DashboardSectionProps & {
  direction?: 'INCOMING' | 'OUTGOING';
};

const Contributions = ({ accountSlug, direction }: ContributionsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
  } = useQuery(dashboardContributionsMetadataQuery, {
    variables: {
      slug: accountSlug,
      filter: direction || 'OUTGOING',
    },
    context: API_V2_CONTEXT,
  });

  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All' }),
      count: metadata?.account?.ALL.totalCount,
      filter: {},
    },
    {
      id: ContributionsTab.RECURRING,
      label: intl.formatMessage({ defaultMessage: 'Recurring' }),
      count: metadata?.account?.[ContributionsTab.RECURRING].totalCount,
      filter: {
        type: OrderTypeFilter.RECURRING,
        status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
      },
    },
    {
      id: ContributionsTab.ONETIME,
      label: intl.formatMessage({ defaultMessage: 'One-Time' }),
      count: metadata?.account?.[ContributionsTab.ONETIME].totalCount,
      filter: {
        type: OrderTypeFilter.ONETIME,
        status: [OrderStatus.PAID],
      },
    },
    {
      id: ContributionsTab.CANCELED,
      label: intl.formatMessage({ defaultMessage: 'Cancelled' }),
      count: metadata?.account?.[ContributionsTab.CANCELED].totalCount,
      filter: {
        status: [OrderStatus.CANCELLED],
      },
    },
  ];

  const filterMeta: FilterMeta = {
    currency: metadata?.account?.currency,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    meta: filterMeta,
    views,
    filters,
  });

  const {
    data,
    previousData,
    loading: queryLoading,
    error: queryError,
  } = useQuery(dashboardContributionsQuery, {
    variables: {
      slug: accountSlug,
      filter: direction || 'OUTGOING',
      includeIncognito: true,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });

  const [editOrder, setEditOrder] = React.useState<{ order?: { id: string }; action: EditOrderActions }>({
    order: router.query.orderId ? { id: router.query.orderId as string } : null,
    action: (router.query.action as EditOrderActions) ?? null,
  });

  const selectedOrders = data?.account?.orders.nodes || [];

  const { limit, offset } = queryFilter.values;
  const pages = Math.ceil(((data || previousData)?.account?.orders.totalCount || 1) / limit);
  const currentPage = toNumber(offset + limit) / limit;

  const isIncoming = direction === 'INCOMING';
  const loading = metadataLoading || queryLoading;
  const error = metadataError || queryError;

  const columns = getColumns({ tab: queryFilter.activeViewId, setEditOrder, intl, isIncoming }) || [];
  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={
          isIncoming ? (
            <FormattedMessage id="IncomingContributions" defaultMessage="Incoming Contributions" />
          ) : (
            <FormattedMessage id="OutgoingContributions" defaultMessage="Outgoing Contributions" />
          )
        }
        description={
          isIncoming ? (
            <FormattedMessage id="IncomingContributions.description" defaultMessage="Contributions to your account." />
          ) : (
            <FormattedMessage
              id="OutgoingContributions.description"
              defaultMessage="Manage your contributions to other Collectives."
            />
          )
        }
      />
      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && selectedOrders.length === 0 ? (
        <EmptyResults
          entityType="CONTRIBUTIONS"
          hasFilters={queryFilter.hasFilters}
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable
            loading={loading}
            columns={columns}
            data={selectedOrders}
            mobileTableView
            nbPlaceholders={nbPlaceholders}
          />
          <Pagination
            totalPages={pages}
            page={currentPage}
            onChange={page => queryFilter.setFilter('offset', (page - 1) * limit)}
          />
        </div>
      )}
      {editOrder.order && (
        <EditOrderModal
          accountSlug={accountSlug}
          order={editOrder.order}
          action={editOrder.action}
          onClose={() => setEditOrder({ order: null, action: null })}
        />
      )}
    </div>
  );
};

export default Contributions;
