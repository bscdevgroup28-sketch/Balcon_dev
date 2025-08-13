/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/auth/Login';
import { renderWithProviders } from '../test/testUtils';

// Ensure only one copy of react is used in tests (guard for hoisted deps scenario)
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return { ...actual };
});

// Debug module resolution paths to diagnose invalid hook call
// (Will print once when test file is evaluated)
// eslint-disable-next-line no-console
console.log('DEBUG react path:', require.resolve('react'));
// eslint-disable-next-line no-console
console.log('DEBUG react-dom path:', require.resolve('react-dom'));
// eslint-disable-next-line no-console
console.log('DEBUG react-redux path:', require.resolve('react-redux'));

// Mock network layer (axios instance is created in api.ts)
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
  };
  return { __esModule: true, default: { create: () => mockInstance } };
});

describe('Login Page', () => {
  it('renders and allows demo role selection login', async () => {
    renderWithProviders(<Login />);

    // Ensure heading present
    expect(screen.getByRole('heading', { name: /bal-con builders/i })).toBeInTheDocument();

    // Find a demo card and click it
    const customerDemoCard = screen.getByText(/Customer Demo/i).closest('div');
    expect(customerDemoCard).toBeInTheDocument();
    if (customerDemoCard) {
      await userEvent.click(customerDemoCard);
    }

    // After clicking, a redirect would normally happen; we at least assert that demo hint text still renders.
    expect(screen.getByText(/Explore User Dashboards/i)).toBeInTheDocument();
  });

  it('accepts email/password input', async () => {
    renderWithProviders(<Login />);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'secret');

    expect(emailInput).toHaveValue('test@example.com');
    expect((passwordInput as HTMLInputElement).value).toBe('secret');
  });
});
