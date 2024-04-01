import React from 'react';
import clsx from 'clsx';
import { includes } from 'lodash';
import { Check, Copy, Ellipsis, Link } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ExpensePageExpenseFieldsFragment, ExpenseStatus } from '../../../lib/graphql/types/v2/graphql';
import useClipboard from '../../../lib/hooks/useClipboard';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { i18nExpenseType } from '../../../lib/i18n/expense';
import { PREVIEW_FEATURE_KEYS } from '../../../lib/preview-features';
import { getWebsiteUrl } from '../../../lib/utils';

import { AccountHoverCard } from '../../AccountHoverCard';
import AmountWithExchangeRateInfo from '../../AmountWithExchangeRateInfo';
import Avatar from '../../Avatar';
import DateTime from '../../DateTime';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import LinkCollective from '../../LinkCollective';
import { PayoutMethodLabel } from '../../PayoutMethodLabel';
import { Button } from '../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/DropdownMenu';
import ExpenseStatusTag, { getExpenseStatusMsgType } from '../ExpenseStatusTag';

type SubmittedExpenseListItemProps = {
  expense: ExpensePageExpenseFieldsFragment;
  className?: string;
  onClick: () => void;
};

const I18nMessages = defineMessages({
  DESCRIPTION_LINE: {
    defaultMessage: 'From {submitter} to {account} • {payoutMethod} • {submittedAt}',
  },
  DESCRIPTION_LINE_NO_PAYOUT_METHOD: {
    defaultMessage: 'From {submitter} to {account} • {submittedAt}',
  },
});

export function SubmittedExpenseListItem(props: SubmittedExpenseListItemProps) {
  const { LoggedInUser } = useLoggedInUser();
  const hasNewSubmitExpenseFlow = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW);

  const router = useRouter();
  const clipboard = useClipboard();
  const intl = useIntl();
  const hasExchangeRate =
    props.expense.amountInAccountCurrency && props.expense.amountInAccountCurrency?.currency !== props.expense.currency;

  const onDuplicateClick = React.useCallback(
    (e: React.MouseEvent) => {
      router.push(
        `/dashboard/${LoggedInUser?.collective?.slug}/expenses/new?expenseId=${props.expense.legacyId}&duplicate=true`,
      );
      e.stopPropagation();
    },
    [router, props.expense.legacyId, LoggedInUser?.collective?.slug],
  );

  return (
    <div
      role="button"
      className={clsx('grid grid-cols-[1fr_auto_auto] grid-rows-1 gap-4 p-4', props.className)}
      tabIndex={0}
      onClick={props.onClick}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          props.onClick();
        }
      }}
    >
      <div>
        <div className="mb-1 max-w-[250px] overflow-hidden text-ellipsis text-sm font-medium text-slate-800 sm:max-w-[400px]">
          {props.expense.description}
        </div>
        <div className="text-xs text-slate-700">
          <span>
            <FormattedMessage
              {...(props.expense.payoutMethod
                ? I18nMessages.DESCRIPTION_LINE
                : I18nMessages.DESCRIPTION_LINE_NO_PAYOUT_METHOD)}
              values={{
                submittedAt: <DateTime value={props.expense.createdAt} />,
                payoutMethod: <PayoutMethodLabel showIcon payoutMethod={props.expense.payoutMethod} />,
                submitter: (
                  <AccountHoverCard
                    account={props.expense.payee}
                    trigger={
                      <span className="inline-flex">
                        &nbsp;
                        <LinkCollective
                          noTitle
                          className="inline-flex hover:underline"
                          collective={props.expense.payee}
                        >
                          <Avatar collective={props.expense.payee} radius={16} />
                          &nbsp;
                          {props.expense.payee.name}
                        </LinkCollective>
                        &nbsp;
                      </span>
                    }
                  />
                ),
                account: (
                  <AccountHoverCard
                    account={props.expense.account}
                    trigger={
                      <span className="inline-flex">
                        &nbsp;
                        <LinkCollective
                          noTitle
                          className="inline-flex hover:underline"
                          collective={props.expense.account}
                        >
                          <Avatar collective={props.expense.account} radius={16} />
                          &nbsp;
                          {props.expense.account.name}
                        </LinkCollective>
                        &nbsp;
                      </span>
                    }
                  />
                ),
              }}
            />
          </span>
        </div>
      </div>
      <div>
        <div className="mb-1 flex flex-col items-end text-sm font-medium text-slate-800">
          <span>
            <FormattedMoneyAmount amount={props.expense.amount} currency={props.expense.currency} precision={2} />
          </span>

          {hasExchangeRate && (
            <div className="my-1 text-xs text-slate-600">
              <AmountWithExchangeRateInfo amount={props.expense.amountInAccountCurrency as any} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-end justify-end gap-2">
          <span className="rounded-xl rounded-ee-none rounded-se-none bg-slate-100 px-3 py-1 text-xs text-slate-800">
            {i18nExpenseType(intl, props.expense.type)} #{props.expense.legacyId}
          </span>

          <ExpenseStatusTag
            type={getExpenseStatusMsgType(props.expense.status)}
            status={props.expense.status}
            showTaxFormTag={includes(props.expense.requiredLegalDocuments, 'US_TAX_FORM')}
            showTaxFormMsg={props.expense.payee.isAdmin}
          />
        </div>
      </div>
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-xs" variant="outline">
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                clipboard.copy(`${getWebsiteUrl()}/${props.expense.account.slug}/expenses/${props.expense.legacyId}`);
              }}
            >
              {clipboard.isCopied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
              {clipboard.isCopied ? (
                <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
              ) : (
                <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
              )}
            </DropdownMenuItem>
            {props.expense.status !== ExpenseStatus.DRAFT && hasNewSubmitExpenseFlow && (
              <DropdownMenuItem onClick={onDuplicateClick}>
                <Copy className="h-4 w-4" />
                <FormattedMessage defaultMessage="Duplicate Expense" />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
