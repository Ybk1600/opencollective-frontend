import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import Loading from '../../../Loading';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';

import { accountTaxInformationQuery } from './queries';
import { TaxInformationForm } from './TaxInformationForm';

/**
 * A page for users to fill their info for W9/W8 tax forms.
 */
export const TaxInformationSettings = ({ account }) => {
  const queryParams = { variables: { slug: account.slug }, context: API_V2_CONTEXT };
  const { data, error, loading } = useQuery(accountTaxInformationQuery, queryParams);
  return (
    <div>
      <h2 className="mb-4 text-3xl font-bold">
        <FormattedMessage defaultMessage="Tax Information" />
      </h2>

      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <TaxInformationForm account={data.account} />
      )}
    </div>
  );
};
