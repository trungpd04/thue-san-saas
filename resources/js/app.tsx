import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import theme from './Config/theme';

const appName = import.meta.env.VITE_APP_NAME;

createInertiaApp({
  title: (title) => {
    const pageTitle = title?.trim() ?? '';
    return pageTitle ? `${pageTitle} - ${appName}` : appName;
  },
  resolve: name =>
    resolvePageComponent(
      [`./Pages/${name}.tsx`, `./Pages/Admin/${name}.tsx`, `./Pages/Tenant/${name}.tsx`],
      import.meta.glob('./Pages/**/*.tsx')
    ),
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <ConfigProvider theme={theme} locale={viVN}>
        <App {...props} />
      </ConfigProvider>
    );
  },
  progress: {
    color: '#7CB305'
  }
});
