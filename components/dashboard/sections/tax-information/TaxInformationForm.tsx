import React from 'react';
import { Form, FormikProps } from 'formik';
import { isEmpty, isNil, omitBy, pick, values } from 'lodash';
import { FileText } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { mergeName } from '../../../../lib/collective';
import { LoggedInUser } from '../../../../lib/custom_typings/LoggedInUser';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';

import { FormikZod } from '../../../FormikZod';
import StyledInputFormikField from '../../../StyledInputFormikField';
import { Button } from '../../../ui/Button';
import WarnIfUnsavedChanges from '../../../WarnIfUnsavedChanges';

import { BaseFormSchema, BaseFormValues, TaxFormType } from './common';
import { AccountFromTaxInformationQuery } from './queries';
import { SignatureInput } from './SignatureInput';
import { TaxFormPreview } from './TaxFormPreview';
import { TaxFormPreviewModal } from './TaxFormPreviewModal';
import { TaxFormTypeSelectFields } from './TaxFormTypeSelectFields';
import { getInitialValuesForW8Ben, W8BenTaxFormFields, W8BenTaxFormValuesSchema } from './W8BenForm';
import { getInitialValuesForW9, getW9TaxFormValuesSchema, W9TaxFormFields } from './W9TaxForm';

interface TaxFormDefinition<ZodSchema extends z.ZodType<any, any, any>> {
  component: React.ComponentType<{ formik: FormikProps<z.infer<ZodSchema>> }>;
  getSchema: (baseValues: BaseFormValues) => ZodSchema;
  getInitialValues: (
    user: LoggedInUser,
    account: AccountFromTaxInformationQuery,
    baseValues: BaseFormValues,
  ) => z.infer<ZodSchema>;
}

const FORMS: Record<TaxFormType, TaxFormDefinition<any>> = {
  W9: {
    component: W9TaxFormFields,
    getSchema: getW9TaxFormValuesSchema,
    getInitialValues: getInitialValuesForW9,
  } as TaxFormDefinition<ReturnType<typeof getW9TaxFormValuesSchema>>,
  W8_BEN: {
    component: W8BenTaxFormFields,
    getSchema: () => W8BenTaxFormValuesSchema,
    getInitialValues: getInitialValuesForW8Ben,
  } as TaxFormDefinition<any>,
  W8_BEN_E: {
    component: () => <div>W8_BEN_E FIELDS</div>,
    getSchema: () => BaseFormSchema,
    getInitialValues: () => ({}),
  } as TaxFormDefinition<any>,
};

const FORM_CONFIG = {
  showRequired: true,
  hintPosition: 'above',
} as const;

export const TaxInformationForm = ({ account }) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const [hasPreviewModal, setHasPreviewModal] = React.useState(false);
  const [schema, setSchema] = React.useState(BaseFormSchema);
  const initialValues = React.useMemo(
    () => ({
      type: null,
      isUSPersonOrEntity: null,
      submitterType: null,
      email: LoggedInUser.email,
      isSigned: false,
    }),
    [LoggedInUser],
  );

  return (
    <FormikZod
      schema={schema}
      initialValues={initialValues}
      config={FORM_CONFIG}
      onSubmit={async values => {
        await new Promise(r => setTimeout(r, 500));
        alert(JSON.stringify(values, null, 2));
      }}
    >
      {(formik: FormikProps<BaseFormValues>) => {
        const form = FORMS[formik.values.formType];
        const hasCompletedBaseForm = !isNil(formik.values.isUSPersonOrEntity) && !isNil(formik.values.submitterType);
        console.log(formik.values);
        return (
          <WarnIfUnsavedChanges hasUnsavedChanges={formik.dirty}>
            <div className="flex gap-8">
              {/** Form */}
              <Form className="max-w-[440px] flex-1">
                <TaxFormTypeSelectFields
                  values={formik.values}
                  onChange={values => {
                    const form = FORMS[values.formType];
                    if (!form) {
                      setSchema(BaseFormSchema);
                      formik.resetForm({ values: { ...formik.values, ...values } });
                    } else {
                      const newSchema = form.getSchema(formik.values);
                      setSchema(newSchema);

                      const initialValues = form.getInitialValues(LoggedInUser, account, values);
                      const valuesToKeep = pick(formik.values, Object.keys(newSchema.shape));
                      const formState = { ...initialValues, ...omitBy(valuesToKeep, isEmpty), ...values };
                      formik.resetForm({ values: formState });
                    }
                  }}
                />
                {form && hasCompletedBaseForm && (
                  <div className="mt-6 flex flex-col gap-y-4">
                    <StyledInputFormikField
                      name="email"
                      label={<FormattedMessage defaultMessage="Email" />}
                      hint={intl.formatMessage({
                        defaultMessage:
                          'The email address of the person who will sign the form. A copy of the form will be sent to this email address.',
                      })}
                    />
                    <form.component formik={formik} />
                    <div className="mt-6">
                      <SignatureInput
                        isSigned={formik.values.isSigned}
                        error={formik.errors.isSigned}
                        onChange={isSigned => formik.setFieldValue('isSigned', isSigned)}
                        signerName={mergeName(formik.values.signer)}
                      />
                      <p className="mb-4 text-sm text-neutral-700">
                        <FormattedMessage defaultMessage='I agree to be legally bound by the document, and agree to the Open Collective Terms and Privacy Policy. Click on "I agree" to sign this document.' />
                      </p>
                      <div className="flex flex-col gap-y-4">
                        <Button type="button" variant="outline" onClick={() => setHasPreviewModal(true)}>
                          <FileText className="mr-2 inline-block" size={16} />
                          <FormattedMessage defaultMessage="Preview Document" />
                        </Button>
                        <Button type="submit">
                          <FormattedMessage defaultMessage="I agree" />
                        </Button>
                      </div>
                    </div>
                    {hasPreviewModal && (
                      <TaxFormPreviewModal
                        type={formik.values.formType}
                        values={formik.values}
                        onOpenChange={setHasPreviewModal}
                      />
                    )}
                  </div>
                )}
              </Form>
              {/** PDF preview */}
              {form && hasCompletedBaseForm && (
                <div className="hidden flex-1 animate-in fade-in-0 2xl:block">
                  <div className="sticky top-3 h-[95vh] w-full overflow-y-scroll rounded-lg bg-gray-100 p-4 shadow-inner">
                    <TaxFormPreview type={formik.values.formType} values={formik.values} />
                  </div>
                </div>
              )}
            </div>
          </WarnIfUnsavedChanges>
        );
      }}
    </FormikZod>
  );
};
