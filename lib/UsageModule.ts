import { NativeModules } from 'react-native';

type UsageModuleType = {
  hello(message: string, callback: (response: string) => void): void;
};

export const { UsageModule } = NativeModules as {
  UsageModule: UsageModuleType;
};
 