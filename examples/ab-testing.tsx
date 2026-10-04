import { FlagsProvider, useVariant } from '@zenmanage/react';

function CheckoutExperience() {
  const { variant, isLoading } = useVariant('checkout-flow', 'control');

  if (isLoading) {
    return <p>Loading checkout experience...</p>;
  }

  if (variant === 'one-page') {
    return <p>One-page checkout experience</p>;
  }

  return <p>Control multi-step checkout</p>;
}

export function ABTestingExample() {
  return (
    <FlagsProvider environmentToken={process.env.ZENMANAGE_ENVIRONMENT_TOKEN || 'cli_placeholder'}>
      <CheckoutExperience />
    </FlagsProvider>
  );
}
