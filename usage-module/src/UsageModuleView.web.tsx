import * as React from 'react';

import { UsageModuleViewProps } from './UsageModule.types';

export default function UsageModuleView(props: UsageModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
