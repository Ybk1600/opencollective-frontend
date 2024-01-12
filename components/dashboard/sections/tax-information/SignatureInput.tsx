import React from 'react';
import { FormattedMessage } from 'react-intl';

import { usePrevious } from '../../../../lib/hooks/usePrevious';
import { cn } from '../../../../lib/utils';

/**
 * A box where users can click to sign.
 */
export const SignatureInput = ({ isSigned, signerName, onChange, error }) => {
  // If the signer name changes, we need to invalidate the signature
  const previousSignerName = usePrevious(signerName);
  React.useEffect(() => {
    if (previousSignerName !== signerName && isSigned) {
      onChange(false);
    }
  }, [onChange, previousSignerName, signerName, isSigned]);

  const toggle = () => {
    onChange(!isSigned);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          toggle();
        }
      }}
      className={cn(
        'flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border bg-gray-100 text-lg text-gray-500',
        {
          'border-red-500': error,
        },
      )}
    >
      {!isSigned ? (
        <FormattedMessage defaultMessage="Click to sign" />
      ) : (
        <FormattedMessage defaultMessage="Signed by {signerName}" values={{ signerName }} />
      )}
    </div>
  );
};
