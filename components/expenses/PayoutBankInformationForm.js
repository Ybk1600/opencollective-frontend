import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Info } from '@styled-icons/feather/Info';
import { Field, useFormikContext } from 'formik';
import { compact, get, kebabCase, partition, set } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import { I18nSupportLink } from '../I18nFormatters';
import MessageBox from '../MessageBox';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledSelect from '../StyledSelect';
import StyledSpinner from '../StyledSpinner';
import StyledTooltip from '../StyledTooltip';
import { P, Span } from '../Text';

const formatStringOptions = strings => strings.map(s => ({ label: s, value: s }));
const formatTransferWiseSelectOptions = values => values.map(({ key, name }) => ({ label: name, value: key }));

const WISE_PLATFORM_COLLECTIVE_SLUG = process.env.WISE_PLATFORM_COLLECTIVE_SLUG || process.env.TW_API_COLLECTIVE_SLUG;

export const msg = defineMessages({
  currency: {
    id: 'Currency',
    defaultMessage: 'Currency',
  },
  fieldRequired: {
    id: 'FieldRequired',
    defaultMessage: '{name} is required.',
  },
});

const requiredFieldsQuery = gql`
  query PayoutBankInformationRequiredFields($slug: String, $currency: String!, $accountDetails: JSON) {
    host(slug: $slug) {
      id
      transferwise {
        id
        requiredFields(currency: $currency, accountDetails: $accountDetails) {
          type
          title
          fields {
            name
            group {
              key
              name
              type
              required
              example
              minLength
              maxLength
              validationRegexp
              refreshRequirementsOnChange
              valuesAllowed {
                key
                name
              }
            }
          }
        }
      }
    }
  }
`;

const CUSTOM_METHOD_LABEL_BY_CURRENCY = {
  // Here I'm using the same wording Wise uses on their documentation
  USD: {
    requiredFields: {
      // No need to internationalize this, since the form is generated by Wise API and it is always in English
      label: "Where's your bank account located?",
      options: {
        aba: 'In the US',
        // eslint-disable-next-line camelcase
        swift_code: 'Outside the US',
      },
    },
  },
};

const validateRequiredInput = (intl, input, required) =>
  required ? value => (value ? undefined : intl.formatMessage(msg.fieldRequired, { name: input.name })) : undefined;

const Input = ({ input, getFieldName, disabled, currency, loading, refetch, formik, host }) => {
  const intl = useIntl();
  const isAccountHolderName = input.key === 'accountHolderName';
  const fieldName = isAccountHolderName ? getFieldName(input.key) : getFieldName(`details.${input.key}`);
  const required = disabled ? false : input.required;
  const submitted = Boolean(formik.submitCount);
  let validate = validateRequiredInput(intl, input, required);
  if (input.type === 'text') {
    if (input.validationRegexp || input.minLength || input.maxLength) {
      validate = value => {
        if (!value && required) {
          return formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_REQUIRED));
        }
        if (input.validationRegexp) {
          const matches = new RegExp(input.validationRegexp).test(value);
          if (!matches && value) {
            return input.validationError || formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_PATTERN));
          }
        }
        if (value && input.minLength && value.length < input.minLength) {
          return input.validationError || formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_MIN_LENGTH));
        }
        if (value && input.maxLength && value.length > input.maxLength) {
          return input.validationError || formatFormErrorMessage(intl, createError(ERROR.FORM_FIELD_MAX_LENGTH));
        }
      };
    }
    return (
      <Box key={input.key} mt={2} flex="1">
        <Field name={fieldName} validate={validate}>
          {({ field, meta }) => (
            <StyledInputField
              label={input.name}
              labelFontSize="13px"
              required={required}
              hideOptionalLabel={disabled}
              error={(meta.touched || disabled || submitted) && meta.error}
              hint={input.hint}
            >
              {() => {
                const inputValue = get(formik.values, field.name);
                return (
                  <React.Fragment>
                    <StyledInput
                      {...field}
                      placeholder={input.example}
                      error={(meta.touched || disabled || submitted) && meta.error}
                      disabled={disabled}
                      width="100%"
                      maxLength={input.maxLength}
                      minLength={input.minLength}
                      value={inputValue || ''}
                    />
                    {isAccountHolderName && inputValue && inputValue.match(/^[^\s]{1}\b/) && (
                      <MessageBox mt={2} fontSize="12px" type="warning" withIcon>
                        <FormattedMessage
                          id="Warning.AccountHolderNameNotValid"
                          defaultMessage="Full names for personal recipients. They must include more than one name, and both first and last name must have more than one character."
                        />
                      </MessageBox>
                    )}
                  </React.Fragment>
                );
              }}
            </StyledInputField>
          )}
        </Field>
      </Box>
    );
  } else if (input.type === 'date') {
    return (
      <Box key={input.key} mt={2} flex="1">
        <Field name={fieldName} validate={validate}>
          {({ field, meta }) => (
            <StyledInputField
              label={input.name}
              labelFontSize="13px"
              required={required}
              hideOptionalLabel={disabled}
              error={(meta.touched || disabled || submitted) && meta.error}
              hint={input.hint}
            >
              {() => (
                <StyledInput
                  {...field}
                  type="date"
                  error={(meta.touched || disabled || submitted) && meta.error}
                  disabled={disabled}
                  width="100%"
                  value={get(formik.values, field.name) || ''}
                />
              )}
            </StyledInputField>
          )}
        </Field>
      </Box>
    );
  } else if (input.type === 'radio' || input.type === 'select') {
    const options = formatTransferWiseSelectOptions(input.valuesAllowed || []);
    return (
      <Box mt={2} flex="1">
        <Field name={fieldName} validate={validate}>
          {({ field, meta }) => (
            <StyledInputField
              label={input.name}
              labelFontSize="13px"
              required={required}
              hideOptionalLabel={disabled}
              error={(meta.touched || disabled || submitted) && meta.error}
            >
              {() => (
                <StyledSelect
                  inputId={field.name}
                  disabled={disabled}
                  error={(meta.touched || disabled || submitted) && meta.error}
                  isLoading={loading && !options.length}
                  name={field.name}
                  options={options}
                  value={options.find(c => c.value === get(formik.values, field.name)) || null}
                  onChange={({ value }) => {
                    formik.setFieldValue(field.name, value);
                    if (input.refreshRequirementsOnChange && refetch) {
                      refetch({
                        slug: host ? host.slug : WISE_PLATFORM_COLLECTIVE_SLUG,
                        currency,
                        accountDetails: get(set({ ...formik.values }, field.name, value), getFieldName('')),
                      });
                    }
                  }}
                />
              )}
            </StyledInputField>
          )}
        </Field>
      </Box>
    );
  } else {
    return null;
  }
};

Input.propTypes = {
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string,
  }),
  currency: PropTypes.string,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
  refetch: PropTypes.func,
  input: PropTypes.object.isRequired,
};

export const FieldGroup = ({ field, ...props }) => {
  return (
    <Box flex="1">
      {field.group.map(input => (
        <Input key={input.key} input={input} {...props} />
      ))}
    </Box>
  );
};

FieldGroup.propTypes = {
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string,
  }),
  currency: PropTypes.string,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
  refetch: PropTypes.func,
  field: PropTypes.object.isRequired,
};

const DetailsForm = ({ disabled, getFieldName, formik, host, currency }) => {
  const intl = useIntl();
  const { loading, error, data, refetch } = useQuery(requiredFieldsQuery, {
    context: API_V2_CONTEXT,
    // A) If `fixedCurrency` was passed in PayoutBankInformationForm (2) (3)
    //    then `host` is not set and we'll use the Platform Wise account
    // B) If `host` is set, we expect to be in 2 cases:
    //      * The Collective Host has Wise configured and we should be able to fetch `requiredFields` from it
    //      * The Collective Host doesn't have Wise configured and `host` is already switched to the Platform account
    variables: { slug: host ? host.slug : WISE_PLATFORM_COLLECTIVE_SLUG, currency },
  });

  // Make sure we load the form data on initial load. Otherwise certain form fields such
  // as the state field in the "Recipient's Address" section might not be visible on first load
  // and only be visible after the user reselect the country.
  useEffect(() => {
    refetch({ accountDetails: get(formik.values, getFieldName('data')) });
  }, []);

  if (loading && !data) {
    return <StyledSpinner />;
  }
  if (error) {
    return (
      <MessageBox fontSize="12px" type="error">
        <FormattedMessage
          id="PayoutBankInformationForm.Error.RequiredFields"
          defaultMessage="There was an error fetching the required fields"
        />
        {error.message && `: ${error.message}`}
      </MessageBox>
    );
  }

  // If at this point we don't have `requiredFields` available,
  // we can display an error message, Wise is likely not configured on the platform
  if (!data?.host?.transferwise?.requiredFields) {
    if (process.env.OC_ENV === 'development') {
      return (
        <MessageBox fontSize="12px" type="warning">
          Could not fetch requiredFields, Wise is likely not configured on the platform.
        </MessageBox>
      );
    } else {
      // eslint-disable-next-line no-console
      console.warn('Could not fetch requiredFields through Wise.');
      return null;
    }
  }

  const transactionTypeValues = data.host.transferwise.requiredFields.map(rf => ({
    label: CUSTOM_METHOD_LABEL_BY_CURRENCY[currency]?.requiredFields?.options?.[rf.type] || rf.title,
    value: rf.type,
  }));
  // Some currencies offer different methods for the transaction
  // e.g., USD allows ABA and SWIFT transactions.
  const availableMethods = data.host.transferwise.requiredFields.find(
    method => method.type === get(formik.values, getFieldName(`data.type`)),
  );
  const [addressFields, otherFields] = partition(availableMethods?.fields, field =>
    field.group.every(g => g.key.includes('address.')),
  );

  const transactionMethodFieldName = getFieldName('data.type');
  const transactionMethod = get(formik.values, transactionMethodFieldName);
  const submitted = Boolean(formik.submitCount);

  const transactionMethodLabel =
    CUSTOM_METHOD_LABEL_BY_CURRENCY[currency]?.requiredFields?.label ||
    intl.formatMessage({
      id: 'PayoutBankInformationForm.TransactionMethod',

      defaultMessage: 'Transaction Method',
    });

  return (
    <Flex flexDirection="column">
      <Field
        name={getFieldName('data.type')}
        validate={validateRequiredInput(intl, { name: transactionMethodLabel }, !disabled)}
      >
        {({ field, meta }) => (
          <StyledInputField
            name={field.name}
            label={transactionMethodLabel}
            error={(meta.touched || disabled || submitted) && meta.error}
            labelFontSize="13px"
            mt={3}
            mb={2}
          >
            {({ id }) => (
              <StyledSelect
                inputId={id}
                name={field.name}
                onChange={({ value }) => {
                  const { type, currency } = get(formik.values, getFieldName(`data`));
                  formik.setFieldValue(getFieldName('data'), { type, currency });
                  formik.setFieldValue(field.name, value);
                }}
                options={transactionTypeValues}
                value={transactionTypeValues.find(method => method.value === availableMethods?.type) || null}
                disabled={disabled}
                error={(meta.touched || disabled || submitted) && meta.error}
                required
              />
            )}
          </StyledInputField>
        )}
      </Field>
      {transactionMethod && (
        <Span>
          <Box mt={3} flex="1">
            <P fontSize="14px" fontWeight="bold">
              <FormattedMessage id="PayoutBankInformationForm.AccountInfo" defaultMessage="Account Information" />
            </P>
          </Box>
          {otherFields.map(field => (
            <FieldGroup
              currency={currency}
              disabled={disabled}
              field={field}
              formik={formik}
              getFieldName={string => getFieldName(compact(['data', string]).join('.'))}
              host={host}
              key={kebabCase(field.name)}
              loading={loading}
              refetch={refetch}
            />
          ))}
        </Span>
      )}
      {Boolean(addressFields.length) && (
        <React.Fragment>
          <Box mt={3} flex="1" fontSize="14px" fontWeight="bold">
            <Span mr={2}>
              <FormattedMessage id="PayoutBankInformationForm.RecipientAddress" defaultMessage="Recipient's Address" />
            </Span>
            <StyledTooltip
              content={
                <FormattedMessage
                  id="PayoutBankInformationForm.HolderAddress"
                  defaultMessage="Bank account holder address (not the bank address)"
                />
              }
            >
              <Info size={16} />
            </StyledTooltip>
          </Box>
          {addressFields.map(field => (
            <FieldGroup
              currency={currency}
              disabled={disabled}
              field={field}
              formik={formik}
              getFieldName={string => getFieldName(compact(['data', string]).join('.'))}
              host={host}
              key={kebabCase(field.name)}
              loading={loading}
              refetch={refetch}
            />
          ))}
        </React.Fragment>
      )}
    </Flex>
  );
};

DetailsForm.propTypes = {
  disabled: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  currency: PropTypes.string.isRequired,
  formik: PropTypes.object.isRequired,
  getFieldName: PropTypes.func.isRequired,
};

const availableCurrenciesQuery = gql`
  query PayoutBankInformationAvailableCurrencies($slug: String, $ignoreBlockedCurrencies: Boolean) {
    host(slug: $slug) {
      id
      slug
      currency
      transferwise {
        id
        availableCurrencies(ignoreBlockedCurrencies: $ignoreBlockedCurrencies)
      }
    }
  }
`;

/**
 * Form for payout bank information. Must be used with Formik.
 *
 * The main goal is to use this component in the Expense Flow (1) but it's also reused in:
 *
 * - Collective onboarding, AcceptContributionsOurselvesOrOrg.js (2)
 * - In Collective/Host settings -> Receiving Money, BankTransfer.js (3)
 *
 * In (1) we pass the host where the expense is submitted and fixedCurrency is never set.
 *   * If Wise is configured on that host, `availableCurrencies` should normally be available.
 *   * If it's not, we'll have to fetch `availableCurrencies` from the Platform Wise account
 *
 * In (2) and (3), we never pass an `host` and `fixedCurrency` is sometimes set.
 *   * If `fixedCurrency` is set, we don't need `availableCurrencies`
 *   * If `fixedCurrency` is not set, we'll fetch `availableCurrencies` from the Platform Wise account
 */
const PayoutBankInformationForm = ({ isNew, getFieldName, host, fixedCurrency, ignoreBlockedCurrencies, optional }) => {
  const { data, loading } = useQuery(availableCurrenciesQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: WISE_PLATFORM_COLLECTIVE_SLUG, ignoreBlockedCurrencies },
    // Skip fetching/loading if the currency is fixed (2) (3)
    // Or if availableCurrencies is already available. Expense Flow + Host with Wise configured (1)
    skip: Boolean(fixedCurrency || host?.transferwise?.availableCurrencies),
  });
  const formik = useFormikContext();
  const { formatMessage } = useIntl();

  // Display spinner if loading
  if (loading) {
    return <StyledSpinner />;
  }

  // Fiscal Host with Wise configured (1) OR Platform account as fallback (1) or default (2) (3)
  // NOTE: If `fixedCurrency is set`, `wiseHost` will be null (at least today)
  const wiseHost = data?.host || host;

  const availableCurrencies = wiseHost?.transferwise?.availableCurrencies;

  let currencies;
  if (fixedCurrency) {
    currencies = formatStringOptions([fixedCurrency]);
  } else if (availableCurrencies) {
    currencies = formatStringOptions(availableCurrencies.map(c => c.code));
  } else {
    // If at this point we don't have `fixedCurrency` or `availableCurrencies`,
    // we can display an error message, Wise is likely not configured on the platform
    return (
      <MessageBox fontSize="12px" type="warning">
        <FormattedMessage
          defaultMessage="An error occurred while preparing the form for bank accounts. Please contact <I18nSupportLink>support</I18nSupportLink>"
          values={{ I18nSupportLink }}
        />
      </MessageBox>
    );
  }

  if (optional) {
    currencies.unshift({ label: 'No selection', value: null });
  }

  const currencyFieldName = getFieldName('data.currency');
  const selectedCurrency = get(formik.values, currencyFieldName);

  const validateCurrencyMinimumAmount = () => {
    // Skip if currency is fixed (2) (3)
    // or if `availableCurrencies` is not set (but we're not supposed to be there anyway)
    if (fixedCurrency || !availableCurrencies) {
      return;
    }

    // Only validate minimum amount if the form has items
    if (formik?.values?.items?.length > 0) {
      const invoiceTotalAmount = formik.values.items.reduce(
        (amount, attachment) => amount + (attachment.amount || 0),
        0,
      );
      const minAmountForSelectedCurrency =
        availableCurrencies.find(c => c.code === selectedCurrency)?.minInvoiceAmount * 100;
      if (invoiceTotalAmount < minAmountForSelectedCurrency) {
        return formatMessage(
          {
            defaultMessage:
              'The minimum amount for transferring to {selectedCurrency} is {minAmountForSelectedCurrency}',
          },
          {
            selectedCurrency,
            minAmountForSelectedCurrency: formatCurrency(minAmountForSelectedCurrency, wiseHost.currency),
          },
        );
      }
    }
  };

  return (
    <React.Fragment>
      <Field name={currencyFieldName} validate={validateCurrencyMinimumAmount}>
        {({ field }) => (
          <StyledInputField name={field.name} label={formatMessage(msg.currency)} labelFontSize="13px" mt={3} mb={2}>
            {({ id }) => (
              <StyledSelect
                inputId={id}
                name={field.name}
                onChange={({ value }) => {
                  formik.setFieldValue(getFieldName('data'), {});
                  formik.setFieldValue(field.name, value);
                }}
                options={currencies}
                value={currencies.find(c => c.label === selectedCurrency) || null}
                disabled={Boolean(fixedCurrency && !optional) || !isNew}
              />
            )}
          </StyledInputField>
        )}
      </Field>
      {selectedCurrency && (
        <DetailsForm
          currency={selectedCurrency}
          disabled={!isNew}
          formik={formik}
          getFieldName={getFieldName}
          host={wiseHost}
        />
      )}
      {!selectedCurrency && !currencies?.length && (
        <MessageBox fontSize="12px" type="error">
          <FormattedMessage
            id="PayoutBankInformationForm.Error.AvailableCurrencies"
            defaultMessage="There was an error loading available currencies for this host"
          />
          .
        </MessageBox>
      )}
    </React.Fragment>
  );
};

PayoutBankInformationForm.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    transferwise: PropTypes.shape({
      availableCurrencies: PropTypes.arrayOf(PropTypes.object),
    }),
  }),
  isNew: PropTypes.bool,
  optional: PropTypes.bool,
  ignoreBlockedCurrencies: PropTypes.bool,
  getFieldName: PropTypes.func.isRequired,
  /** Enforces a fixedCurrency */
  fixedCurrency: PropTypes.string,
  /** A map of errors for this object */
  errors: PropTypes.object,
  formik: PropTypes.object,
};

export default PayoutBankInformationForm;
