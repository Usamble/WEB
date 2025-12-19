declare module '@vercel/analytics/react' {
  import { ComponentType } from 'react';
  
  interface AnalyticsProps {
    beforeSend?: (event: any) => any | null;
    debug?: boolean;
    mode?: 'auto' | 'development' | 'production';
  }
  
  export const Analytics: ComponentType<AnalyticsProps>;
}
