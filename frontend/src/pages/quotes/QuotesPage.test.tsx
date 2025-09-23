import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuotesPage from './QuotesPage';

jest.useFakeTimers();

jest.mock('react-redux', () => ({
  useSelector: (fn: any) => fn({ auth: { user: { firstName: 'Test', lastName: 'User' } } }),
  useDispatch: () => jest.fn()
}));

describe('QuotesPage filtering', () => {
  it('filters locally by search without additional loads', async () => {
    render(
      <MemoryRouter>
        <QuotesPage />
      </MemoryRouter>
    );

    act(() => { jest.runAllTimers(); });

    expect(await screen.findByText(/Q24090001/)).toBeInTheDocument();
    expect(screen.getByText(/Q24090002/)).toBeInTheDocument();

    const searchBox = screen.getByPlaceholderText('Search quotes...') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'residential' } });

    // Residential appears in second quote's project title
    await waitFor(() => expect(screen.queryByText(/Q24090001/)).not.toBeInTheDocument());
  expect(await screen.findByText(/Q24090002/)).toBeInTheDocument();
  });
});
