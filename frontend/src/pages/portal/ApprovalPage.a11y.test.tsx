import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from '../../test/a11y/axeTestUtils';
import ApprovalPage from './ApprovalPage';

describe('ApprovalPage accessibility', () => {
  it('has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ApprovalPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
