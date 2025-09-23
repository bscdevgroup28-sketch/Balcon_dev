import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import OrdersPage from './OrdersPage';
import { MemoryRouter } from 'react-router-dom';

// Mock redux selector to avoid needing full store
jest.mock('react-redux', () => ({
  useSelector: (fn: any) => fn({ auth: { user: { firstName: 'Test', lastName: 'User' } } }),
  useDispatch: () => jest.fn()
}));

// OrdersPage uses setTimeout to simulate API; use fake timers
jest.useFakeTimers();

describe('OrdersPage filtering', () => {
  it('filters locally by search without additional loads', async () => {
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    );

    // Advance timers to resolve mock load
    act(() => {
      jest.runAllTimers();
    });

    // Wait for one of the order numbers
    expect(await screen.findByText(/ORD-1703123456789-ABC12/)).toBeInTheDocument();
    expect(screen.getByText(/ORD-1703123456790-DEF34/)).toBeInTheDocument();

    const searchBox = screen.getByPlaceholderText('Search orders...') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'residential' } });

    // Residential Garage belongs to second order only
    await waitFor(() => expect(screen.queryByText(/ORD-1703123456789-ABC12/)).not.toBeInTheDocument());
  expect(await screen.findByText(/ORD-1703123456790-DEF34/)).toBeInTheDocument();
  });
});
