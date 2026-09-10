import { DefaultsCollection } from '@zenmanage/sdk';
import { FlagsProvider, useFlag } from '@zenmanage/react';

const defaults = DefaultsCollection.fromObject({
  'new-homepage': true,
  'checkout-flow': 'control',
  'cart-item-limit': 20,
});

function DefaultsPanel(): JSX.Element {
  const { value: homepageEnabled } = useFlag('new-homepage', false);
  const { value: cartLimit } = useFlag('cart-item-limit', 10);

  return (
    <div>
      <p>New homepage: {String(homepageEnabled)}</p>
      <p>Cart item limit: {cartLimit}</p>
    </div>
  );
}

export function DefaultsExample(): JSX.Element {
  return (
    <FlagsProvider
      environmentToken={process.env.ZENMANAGE_ENVIRONMENT_TOKEN || 'cli_placeholder'}
      defaults={defaults}
    >
      <DefaultsPanel />
    </FlagsProvider>
  );
}
