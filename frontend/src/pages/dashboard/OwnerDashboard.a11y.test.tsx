import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../store/store';
import { NotificationProvider } from '../../components/feedback/NotificationProvider';
import { LayoutDensityProvider } from '../../theme/LayoutDensityContext';
import { axe } from '../../test/a11y/axeTestUtils';
import OwnerDashboard from './OwnerDashboard';

describe('OwnerDashboard accessibility', () => {
  it('has no a11y violations', async () => {
    const { container } = render(
      <Provider store={store}>
        <NotificationProvider>
          <LayoutDensityProvider defaultDensity="comfortable">
            <MemoryRouter>
              <OwnerDashboard />
            </MemoryRouter>
          </LayoutDensityProvider>
        </NotificationProvider>
      </Provider>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
