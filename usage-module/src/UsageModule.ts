import { NativeModule, requireNativeModule } from 'expo';

import { UsageModuleEvents } from './UsageModule.types';

declare class UsageModule extends NativeModule<UsageModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<UsageModule>('UsageModule');
