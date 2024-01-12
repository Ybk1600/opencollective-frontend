import { defineMessages } from 'react-intl';
import { z } from 'zod';

export enum TaxFormType {
  W9 = 'W9',
  W8_BEN = 'W8_BEN',
  W8_BEN_E = 'W8_BEN_E',
}

export enum SubmitterType {
  Individual = 'individual',
  Business = 'business',
}

export enum FederalTaxClassification {
  Individual = 'individual',
  C_Corporation = 'c-corporation',
  S_Corporation = 's-corporation',
  Partnership = 'partnership',
  TrustEstate = 'trust-estate',
  LimitedLiabilityCompany = 'limited-liability-company',
  Other = 'other',
}

export const TaxFormNameFields = z.object({
  firstName: z.string().min(1),
  middleName: z.string().or(z.literal('')).optional(),
  lastName: z.string().min(1),
});

export const TaxFormLocationFields = z.object({
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export const BaseFormSchema = z.object({
  isUSPersonOrEntity: z.boolean(),
  submitterType: z.nativeEnum(SubmitterType),
  formType: z.nativeEnum(TaxFormType),
  email: z.string().email(),
  signer: TaxFormNameFields,
  isSigned: z.boolean(),
});

export type BaseFormValues = z.infer<typeof BaseFormSchema>;

export const I18nFederalTaxClassification = defineMessages({
  [FederalTaxClassification.Individual]: {
    id: 'FederalTaxClassification.Individual',
    defaultMessage: 'Individual/sole proprietor or single-member LLC',
  },
  [FederalTaxClassification.C_Corporation]: {
    id: 'FederalTaxClassification.C_Corporation',
    defaultMessage: 'C Corporation',
  },
  [FederalTaxClassification.S_Corporation]: {
    id: 'FederalTaxClassification.S_Corporation',
    defaultMessage: 'S Corporation',
  },
  [FederalTaxClassification.Partnership]: {
    id: 'FederalTaxClassification.Partnership',
    defaultMessage: 'Partnership',
  },
  [FederalTaxClassification.TrustEstate]: {
    id: 'FederalTaxClassification.TrustEstate',
    defaultMessage: 'Trust/estate',
  },
  [FederalTaxClassification.LimitedLiabilityCompany]: {
    id: 'FederalTaxClassification.LimitedLiabilityCompany',
    defaultMessage: 'Limited liability company',
  },
  [FederalTaxClassification.Other]: {
    id: 'FederalTaxClassification.Other',
    defaultMessage: 'Other',
  },
});
