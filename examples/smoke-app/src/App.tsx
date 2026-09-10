import type { JSX } from 'react';
import { FlagGate, FlagsProvider, useFlag, useVariant, withFlag } from '@zenmanage/react';

interface MockFlag {
  asBool: () => boolean;
  asString: () => string;
  asNumber: () => number;
}

interface MockFlagManager {
  withContext: (_context: unknown) => MockFlagManager;
  withDefaults: (_defaults: unknown) => MockFlagManager;
  single: (key: string, defaultValue?: boolean | string | number) => Promise<MockFlag>;
  all: () => Promise<MockFlag[]>;
  refreshRules: () => Promise<void>;
}

interface MockClient {
  flags: () => MockFlagManager;
}

const manager: MockFlagManager = {
  withContext() {
    return this;
  },
  withDefaults() {
    return this;
  },
  async single(key, defaultValue = false) {
    if (key === 'checkout-v2') {
      return {
        asBool: () => true,
        asString: () => 'true',
        asNumber: () => 1,
      };
    }

    if (key === 'checkout-variant') {
      return {
        asBool: () => true,
        asString: () => 'one-page',
        asNumber: () => 0,
      };
    }

    if (typeof defaultValue === 'boolean') {
      return {
        asBool: () => defaultValue,
        asString: () => String(defaultValue),
        asNumber: () => Number(defaultValue),
      };
    }

    if (typeof defaultValue === 'number') {
      return {
        asBool: () => Boolean(defaultValue),
        asString: () => String(defaultValue),
        asNumber: () => defaultValue,
      };
    }

    return {
      asBool: () => Boolean(defaultValue),
      asString: () => String(defaultValue),
      asNumber: () => 0,
    };
  },
  async all() {
    return [];
  },
  async refreshRules() {
    return;
  },
};

const client: MockClient = {
  flags: () => manager,
};

function CheckoutView(): JSX.Element {
  const { value: enabled, isLoading } = useFlag('checkout-v2', false);
  const { variant } = useVariant('checkout-variant', 'control');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>{enabled ? `New checkout (${variant})` : 'Classic checkout'}</div>;
}

function PromoCard(): JSX.Element {
  return <div>Promo Card</div>;
}

const PromoCardIfEnabled = withFlag('checkout-v2')(PromoCard);

export function SmokeApp(): JSX.Element {
  return (
    <FlagsProvider client={client as never} preload={false}>
      <CheckoutView />
      <FlagGate flagKey="checkout-v2" disabledFallback={<div>fallback</div>}>
        <div>FlagGate enabled</div>
      </FlagGate>
      <PromoCardIfEnabled />
    </FlagsProvider>
  );
}
