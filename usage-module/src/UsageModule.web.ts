import { registerWebModule, NativeModule } from 'expo';

import { UsageModuleEvents } from './UsageModule.types';

class UsageModule extends NativeModule<UsageModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(UsageModule, 'UsageModule');
