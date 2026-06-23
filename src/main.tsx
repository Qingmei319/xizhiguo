import React from 'react';
import ReactDOM from 'react-dom/client';
import { Spin } from 'antd';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import '@/styles/index.less';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <Suspense
        fallback={
          <div style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
            <Spin size="large" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  </React.StrictMode>,
);
