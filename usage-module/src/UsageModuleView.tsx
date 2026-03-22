import { requireNativeView } from 'expo';
import * as React from 'react';

import { UsageModuleViewProps } from './UsageModule.types';

const NativeView: React.ComponentType<UsageModuleViewProps> =
  requireNativeView('UsageModule');

export default function UsageModuleView(props: UsageModuleViewProps) {
  return <NativeView {...props} />;
}
