import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from '../../test/a11y/axeTestUtils';
import ProjectDetailPage from './ProjectDetailPage';

describe('ProjectDetailPage accessibility', () => {
  it('has no a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ProjectDetailPage />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
