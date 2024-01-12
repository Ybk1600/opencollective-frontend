import React from 'react';
import { FormikProps } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { splitName } from '../../../../lib/collective';
import { LoggedInUser } from '../../../../lib/custom_typings/LoggedInUser';
import { CountryIso } from '../../../../lib/graphql/types/v2/graphql';
import { i18nCountryName } from '../../../../lib/i18n';

import InputTypeCountry from '../../../InputTypeCountry';
import StyledInput from '../../../StyledInput';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledInputLocation from '../../../StyledInputLocation';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

import {
  BaseFormSchema,
  FederalTaxClassification,
  I18nFederalTaxClassification,
  SubmitterType,
  TaxFormLocationFields,
  TaxFormNameFields,
} from './common';
import { HintText } from './HintText';
import { AccountFromTaxInformationQuery } from './queries';

export const W8BenTaxFormValuesSchema = BaseFormSchema.merge(
  z.object({
    beneficialOwner: z.object(TaxFormNameFields),
    taxpayerIdentificationNumberTypeUS: z.enum(['SSN', 'ITIN']),
    taxpayerIdentificationNumberUS: z.string(),
    taxpayerIdentificationNumberForeign: z.string(),
    dateOfBirth: z.string(),
    claimTaxTreatyBenefits: z.boolean(),
    hasTaxTreatySpecialRatesAndConditions: z.boolean(),
    certifiesResidentCountry: z.boolean(),
    hasConfirmedTOS: z.boolean(),
    countryOfCitizenship: z.string(),
    residenceAddress: TaxFormLocationFields,
    mailingAddress: TaxFormLocationFields.optional(),
    // TODO (check dropbox form): If the signer is not the beneficial owner, in what capacity are they acting?
  }),
);

type W8BenTaxFormValues = z.infer<typeof W8BenTaxFormValuesSchema>;

export const getInitialValuesForW8Ben = (
  user: LoggedInUser,
  account: AccountFromTaxInformationQuery,
): W8BenTaxFormValues => {
  const nameParts = splitName(account.legalName || account.name);
  return {
    signer: nameParts,
    beneficialOwner: nameParts,
    taxpayerIdentificationNumberTypeUS: null,
    taxpayerIdentificationNumberUS: '',
    federalTaxClassification: null,
    federalTaxClassificationDetails: '',
    exemptPayeeCode: '',
    fatcaExemptionCode: '',
    accountNumbers: '',
    location: {}, // TODO
  };
};

export const W8BenTaxFormFields = ({ formik }: { formik: FormikProps<W8BenTaxFormValues> }) => {
  const intl = useIntl();
  const { values, setFieldValue } = formik;
  return (
    <div className="flex flex-col gap-y-4">
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Full name of the beneficial owner" />
        </p>
        <HintText>
          <FormattedMessage defaultMessage="The beneficial owner is the person ultimately paid, not an intermediary." />
        </HintText>
      </div>
      <StyledInputFormikField
        name="beneficialOwner.firstName"
        label={intl.formatMessage({ defaultMessage: 'First Name' })}
      />
      <StyledInputFormikField
        name="beneficialOwner.middleName"
        label={intl.formatMessage({ defaultMessage: 'Middle Name' })}
      />
      <StyledInputFormikField
        name="beneficialOwner.lastName"
        label={intl.formatMessage({ defaultMessage: 'Last Name' })}
      />
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Address" />
        </p>
      </div>
      <StyledInputFormikField
        name="countryOfCitizenship"
        label={<FormattedMessage defaultMessage="Country of citizenship" />}
      >
        {({ field }) => (
          <InputTypeCountry
            inputId={field.id}
            name={field.name}
            onChange={value => setFieldValue(field.name, value as CountryIso)}
            value={field.value}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="residenceAddress"
        label={<FormattedMessage defaultMessage="Permanent residence address" />}
      >
        {({ field }) => (
          <StyledInputLocation
            {...field}
            onChange={value => setFieldValue(field.name, value)}
            labelFontWeight="normal"
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="mailingAddress"
        label={<FormattedMessage defaultMessage="Mailing address (if different from above)" />}
      >
        {({ field }) => (
          <StyledInputLocation
            {...field}
            onChange={value => setFieldValue(field.name, value)}
            labelFontWeight="normal"
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        inputType="date"
        name="dateOfBirth"
        label={<FormattedMessage defaultMessage="Date of birth" />}
      />
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Taxpayer Identification Number (TIN)" />
        </p>
      </div>

      <StyledInputFormikField
        name="foreignTaxIdNumber"
        label={<FormattedMessage defaultMessage="Non-U.S. tax ID number" />}
        placeholder={intl.formatMessage({ defaultMessage: 'The one you use in your country' })}
      />
      <StyledInputFormikField
        name="taxIdNumberType"
        label={<FormattedMessage defaultMessage="US Tax ID number type" />}
      >
        {({ field }) => (
          <div className="mt-2 flex items-center space-x-2">
            <Button
              type="button"
              variant={values.taxIdNumberType === 'SSN' ? 'default' : 'outline'}
              onClick={() => setFieldValue(field.name, 'SSN')}
            >
              SSN
            </Button>
            <Button
              type="button"
              variant={values.taxIdNumberType === 'ITIN' ? 'default' : 'outline'}
              onClick={() => setFieldValue(field.name, 'ITIN')}
            >
              ITIN
            </Button>
          </div>
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="taxIdNumber"
        label={<FormattedMessage defaultMessage="{tax} ID number" values={{ tax: values.taxIdNumberType || 'Tax' }} />}
      >
        {({ field }) => (
          <StyledInput
            placeholder={values.taxIdNumberType === 'SSN' ? '123-45-6789' : '12-3456789'}
            disabled={!values.taxIdNumberType}
            {...field}
            maxLength={values.taxIdNumberType === 'SSN' ? 11 : 10}
            pattern={values.taxIdNumberType === 'SSN' ? '[0-9]{3}-[0-9]{2}-[0-9]{4}' : '[0-9]{2}-[0-9]{7}'}
            onChange={e => {
              const { value } = e.target;
              if (values.taxIdNumberType === 'SSN') {
                const formattedValue = value.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
                setFieldValue(field.name, formattedValue);
              } else {
                const formattedValue = value.replace(/[^0-9]/g, '').replace(/(\d{2})(\d{7})/, '$1-$2');
                setFieldValue(field.name, formattedValue);
              }
            }}
          />
        )}
      </StyledInputFormikField>
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Tax treaty benefits" />
        </p>
      </div>
      <StyledInputFormikField
        name="claimTaxTreatyBenefits"
        label={<FormattedMessage defaultMessage="Do you claim tax treaty benefits for chapter 3 purposes?" />}
      >
        {({ field }) => (
          <div className="mt-2 flex items-center space-x-2">
            <Button
              type="button"
              variant={values.claimTaxTreatyBenefits === true ? 'default' : 'outline'}
              onClick={() => setFieldValue(field.name, true)}
            >
              <FormattedMessage defaultMessage="Yes" />
            </Button>
            <Button
              type="button"
              variant={values.claimTaxTreatyBenefits === false ? 'default' : 'outline'}
              onClick={() => setFieldValue(field.name, false)}
            >
              <FormattedMessage defaultMessage="No" />
            </Button>
          </div>
        )}
      </StyledInputFormikField>
      {Boolean(values.claimTaxTreatyBenefits && values.countryOfCitizenship) && (
        <React.Fragment>
          <StyledInputFormikField name="certifiesResidentCountry">
            {({ field }) => (
              <label className="text-sm font-normal leading-normal">
                <Checkbox
                  className="mr-2"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                />
                <div className="inline align-text-bottom">
                  <FormattedMessage
                    defaultMessage="Within the meaning of the income tax treaty between the United States and this country, I certify that the beneficial owner is a resident of {country}."
                    values={{ country: <strong>{i18nCountryName(intl, values.countryOfCitizenship)}</strong> }}
                  />
                </div>
              </label>
            )}
          </StyledInputFormikField>
          <StyledInputFormikField
            name="hasTaxTreatySpecialRatesAndConditions"
            label={
              <FormattedMessage defaultMessage="For tax treaty benefits (chapter 3), do special rates and conditions apply?" />
            }
          >
            {({ field }) => (
              <div className="mt-2 flex items-center space-x-2">
                <Button
                  type="button"
                  variant={values.hasTaxTreatySpecialRatesAndConditions === true ? 'default' : 'outline'}
                  onClick={() => setFieldValue(field.name, true)}
                >
                  <FormattedMessage defaultMessage="Yes" />
                </Button>
                <Button
                  type="button"
                  variant={values.hasTaxTreatySpecialRatesAndConditions === false ? 'default' : 'outline'}
                  onClick={() => setFieldValue(field.name, false)}
                >
                  <FormattedMessage defaultMessage="No" />
                </Button>
              </div>
            )}
          </StyledInputFormikField>
        </React.Fragment>
      )}

      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Signature" />
        </p>
      </div>
      <StyledInputFormikField
        name="isSignerTheBeneficialOwner"
        label={<FormattedMessage defaultMessage="Is signer the beneficial owner?" />}
      >
        {({ field }) => (
          <div className="mt-2 flex items-center space-x-2">
            <Button
              type="button"
              variant={values.isSignerTheBeneficialOwner === true ? 'default' : 'outline'}
              onClick={() => setFieldValue(field.name, true)}
            >
              <FormattedMessage defaultMessage="Yes" />
            </Button>
            <Button
              type="button"
              variant={values.isSignerTheBeneficialOwner === false ? 'default' : 'outline'}
              onClick={() => setFieldValue(field.name, false)}
            >
              <FormattedMessage defaultMessage="No" />
            </Button>
          </div>
        )}
      </StyledInputFormikField>
      {values.isSignerTheBeneficialOwner === false && (
        <React.Fragment>
          <StyledInputFormikField
            name="signerCapacity"
            label={
              <FormattedMessage defaultMessage="If the signer is not the beneficial owner, in what capacity are they acting?" />
            }
          />
          <StyledInputFormikField
            name="signer.firstName"
            label={intl.formatMessage({ defaultMessage: 'First Name' })}
          />
          <StyledInputFormikField
            name="signer.middleName"
            label={intl.formatMessage({ defaultMessage: 'Middle Name' })}
          />
          <StyledInputFormikField name="signer.lastName" label={intl.formatMessage({ defaultMessage: 'Last Name' })} />
        </React.Fragment>
      )}

      <StyledInputFormikField name="hasConfirmedTOS">
        {({ field }) => (
          <label className="text-sm font-normal leading-normal">
            <Checkbox
              className="mr-2"
              name={field.name}
              checked={field.value}
              onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
            />
            <div className="inline align-text-bottom">
              <FormattedMessage defaultMessage="Under penalties of perjury, I declare that I have examined the information on this form and to the best of my knowledge and belief it is true, correct, and complete. I further certify under penalties of perjury that: I am the individual that is the beneficial owner (or am authorized to sign for the individual that is the beneficial owner) of all the income to which this form relates or am using this form to document myself for chapter 4 purposes; The person named on this form is not a U.S. person; The income to which this form relates is: (a) not effectively connected with the conduct of a trade or business in the United States, (b) effectively connected but is not subject to tax under an applicable income tax treaty, or (c) the partner’s share of a partnership's effectively connected income; The person named on this form is a resident of the treaty country listed (if any) within the meaning of the income tax treaty between the United States and that country; and for broker transactions or barter exchanges, the beneficial owner is an exempt foreign person as defined in the instructions. Furthermore, I authorize this form to be provided to any withholding agent that has control, receipt, or custody of the income of which I am the beneficial owner or any withholding agent that can disburse or make payments of the income of which I am the beneficial owner. I agree that I will submit a new form within 30 days if any certification made on this form becomes incorrect." />
            </div>
          </label>
        )}
      </StyledInputFormikField>
    </div>
  );
};
