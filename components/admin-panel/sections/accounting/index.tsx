import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import {
  AccountingCategory,
  AccountingCategoryKind,
  AdminAccountingCategoriesQuery,
  AdminAccountingCategoriesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import DashboardHeader from '../../../dashboard/DashboardHeader';
import { buildComboSelectFilter } from '../../../dashboard/filters/ComboSelectFilter';
import { Filterbar } from '../../../dashboard/filters/Filterbar';
import { buildOrderByFilter } from '../../../dashboard/filters/OrderFilter';
import { searchFilter } from '../../../dashboard/filters/SearchFilter';
import { DashboardSectionProps } from '../../../dashboard/types';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';

import { AccountingCategoriesTable } from './AccountingCategoriesTable';
import { AccountingCategoryKindI18n } from './AccountingCategoryForm';
import { CreateAccountingCategoryModal } from './CreateAccountingCategoryModal';

const accountingCategoriesQuery = gql`
  query AdminAccountingCategories($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      slug
      accountingCategories {
        totalCount
        nodes {
          id
          kind
          code
          name
          friendlyName
          expensesTypes
          createdAt
        }
      }
    }
  }
`;

// TODO adapt for host types other than organization
const editAccountingCategoryMutation = gql`
  mutation EditAccountingCategories($hostSlug: String!, $categories: [AccountingCategoryInput!]!) {
    editAccountingCategories(account: { slug: $hostSlug }, categories: $categories) {
      id
      ... on Organization {
        host {
          id
          slug
          accountingCategories {
            totalCount
            nodes {
              id
              kind
              code
              name
              friendlyName
              expensesTypes
              createdAt
            }
          }
        }
      }
    }
  }
`;

function categoryToEditableFields(category: AccountingCategory) {
  const editableFields = ['kind', 'code', 'name', 'friendlyName', 'expensesTypes'];
  return pick(category, ['id', ...editableFields]);
}

const orderByCodeFilter = buildOrderByFilter(
  z.enum(['CODE,DESC', 'CODE,ASC', 'NAME,DESC', 'NAME,ASC']).default('CODE,ASC'),
  {
    'CODE,DESC': defineMessage({ defaultMessage: 'Code descending' }),
    'CODE,ASC': defineMessage({ defaultMessage: 'Code ascending' }),
    'NAME,DESC': defineMessage({ defaultMessage: 'Name descending' }),
    'NAME,ASC': defineMessage({ defaultMessage: 'Name ascending' }),
  },
);

const appliesToFilter = buildComboSelectFilter(
  z
    .array(
      z.enum([AccountingCategoryKind.ADDED_FUNDS, AccountingCategoryKind.CONTRIBUTION, AccountingCategoryKind.EXPENSE]),
    )
    .optional(),
  defineMessage({ defaultMessage: 'Applies to' }),
  AccountingCategoryKindI18n,
);

/**
 * The accounting sections lets host admins customize their chart of accounts.
 */
export const HostAdminAccountingSection = ({ accountSlug }: DashboardSectionProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const { toast } = useToast();

  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = React.useState(false);
  const queryFilter = useQueryFilter({
    schema: React.useMemo(
      () =>
        z.object({
          searchTerm: searchFilter.schema,
          orderBy: orderByCodeFilter.schema,
          appliesTo: appliesToFilter.schema,
        }),
      [],
    ),
    filters: {
      searchTerm: searchFilter.filter,
      orderBy: orderByCodeFilter.filter,
      appliesTo: appliesToFilter.filter,
    },
    toVariables: {
      searchTerm: searchFilter.toVariables,
      orderBy: orderByCodeFilter.toVariables,
      appliesTo: appliesToFilter.toVariables,
    },
  });

  const query = useQuery<AdminAccountingCategoriesQuery, AdminAccountingCategoriesQueryVariables>(
    accountingCategoriesQuery,
    {
      context: API_V2_CONTEXT,
      variables: {
        hostSlug: accountSlug,
      },
    },
  );

  const categories = React.useMemo(
    () => query.data?.host?.accountingCategories?.nodes || [],
    [query.data?.host?.accountingCategories?.nodes],
  );

  const filterFn: (c: (typeof categories)[number]) => boolean = React.useMemo(() => {
    if (!queryFilter.values.searchTerm && !queryFilter.values.appliesTo) {
      return null;
    }

    const termRegExp = queryFilter.values.searchTerm && new RegExp(queryFilter.values.searchTerm, 'i');
    return c => {
      return (
        (!termRegExp || termRegExp.test(c.code) || termRegExp.test(c.name) || termRegExp.test(c.friendlyName)) &&
        (!queryFilter.values.appliesTo || queryFilter.values.appliesTo.includes(c.kind))
      );
    };
  }, [queryFilter.values.searchTerm, queryFilter.values.appliesTo]);

  const sortFn: (a: (typeof categories)[number], b: (typeof categories)[number]) => number = React.useMemo(() => {
    return (a, b) => {
      if (queryFilter.values.orderBy === 'CODE,ASC') {
        return a.code.localeCompare(b.code);
      } else if (queryFilter.values.orderBy === 'CODE,DESC') {
        return b.code.localeCompare(a.code);
      } else if (queryFilter.values.orderBy === 'NAME,ASC') {
        return a.name.localeCompare(b.name);
      } else if (queryFilter.values.orderBy === 'NAME,DESC') {
        return b.name.localeCompare(a.name);
      }
    };
  }, [queryFilter.values.orderBy]);

  const filteredCategories = React.useMemo(() => {
    let result = categories;

    if (filterFn) {
      result = result.filter(filterFn);
    }

    result = result.toSorted(sortFn);

    return result;
  }, [categories, sortFn, filterFn]);

  const isAdmin = Boolean(LoggedInUser?.isAdminOfCollective(query.data?.host)); // Accountants can't edit accounting categories

  const [editAccountingCategories] = useMutation(editAccountingCategoryMutation, {
    context: API_V2_CONTEXT,
    variables: {
      hostSlug: accountSlug,
    },
  });

  const updateCategories = React.useCallback(
    async (newCategories, onSuccess = null) => {
      try {
        const cleanCategories = newCategories.map(categoryToEditableFields);
        await editAccountingCategories({ variables: { categories: cleanCategories } });
        toast({ variant: 'success', message: intl.formatMessage({ id: 'saved', defaultMessage: 'Saved' }) });
        onSuccess && onSuccess();
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        throw e;
      }
    },
    [intl, toast, editAccountingCategories],
  );

  const onDelete = React.useCallback(
    async deleted => {
      await updateCategories(categories.filter(c => c.id !== deleted.id));
    },
    [updateCategories, categories],
  );

  const onEdit = React.useCallback(
    async (edited: Pick<AccountingCategory, 'id' | 'kind' | 'name' | 'friendlyName' | 'code' | 'expensesTypes'>) => {
      await updateCategories([...categories.filter(c => c.id !== edited.id), edited]);
    },
    [updateCategories, categories],
  );

  const onCreate = React.useCallback(
    async (
      created: Pick<AccountingCategory, 'kind' | 'name' | 'friendlyName' | 'code' | 'expensesTypes'> & { id: never },
    ) => {
      await updateCategories([...categories, created], () => setIsCreateCategoryModalOpen(false));
    },
    [updateCategories, categories],
  );

  return (
    <React.Fragment>
      <div className="flex max-w-screen-lg flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Chart of Accounts" />}
          description={
            <FormattedMessage defaultMessage="Manage your accounting categories, and use these categories to keep your Collectives’ expenses organized." />
          }
          actions={
            <Button size="sm" className="gap-1" onClick={() => setIsCreateCategoryModalOpen(true)}>
              <span>
                <FormattedMessage defaultMessage="Create category" />
              </span>
              <PlusIcon size={20} />
            </Button>
          }
        />

        <Filterbar {...queryFilter} />

        {query.error && <MessageBoxGraphqlError error={query.error} />}

        <AccountingCategoriesTable
          hostSlug={accountSlug}
          accountingCategories={filteredCategories}
          isAdmin={isAdmin}
          loading={query.loading}
          isFiltered={!!queryFilter.values.searchTerm}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
      {isCreateCategoryModalOpen && (
        <CreateAccountingCategoryModal onClose={() => setIsCreateCategoryModalOpen(false)} onCreate={onCreate} />
      )}
    </React.Fragment>
  );
};
