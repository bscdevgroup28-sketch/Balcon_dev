import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MaterialsPage from './MaterialsPage';
import { integratedAPI } from '../../services/integratedAPI';

jest.mock('../../services/integratedAPI', () => ({
  __esModule: true,
  integratedAPI: {
    getMaterials: jest.fn(),
    getMaterialCategories: jest.fn(),
    getLowStockMaterials: jest.fn(),
    deleteMaterial: jest.fn(),
  }
}));

type TestMaterial = {
  id: number;
  name: string;
  description?: string;
  category: string;
  status: string;
  currentStock: number;
  unitOfMeasure: string;
  unitCost: number;
  sellingPrice: number;
  reorderPoint: number;
  minimumStock: number;
  supplierName?: string;
};

const buildMaterials = (overrides: Partial<TestMaterial>[] = []): TestMaterial[] => {
  const base: TestMaterial = {
    id: 1,
    name: 'Steel Beam',
    description: 'High strength beam',
    category: 'Structural',
    status: 'active',
    currentStock: 50,
    unitOfMeasure: 'pcs',
    unitCost: 100,
    sellingPrice: 150,
    reorderPoint: 10,
    minimumStock: 20,
    supplierName: 'Acme Metals'
  };
  return overrides.map((o, idx) => ({ ...base, id: idx + 1, ...o }));
};

const mockMaterials = buildMaterials([
  {},
  { id: 2, name: 'Aluminum Sheet', category: 'Sheet', currentStock: 5 },
  { id: 3, name: 'Brass Rod', category: 'Rod', currentStock: 25 },
]);

beforeEach(() => {
  (integratedAPI.getMaterials as jest.Mock).mockResolvedValue({ success: true, data: { data: mockMaterials } });
  (integratedAPI.getMaterialCategories as jest.Mock).mockResolvedValue({ success: true, data: ['Structural', 'Sheet', 'Rod'] });
  (integratedAPI.getLowStockMaterials as jest.Mock).mockResolvedValue({ success: true, data: { meta: { total: 1 } } });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('MaterialsPage fetch & filter behavior', () => {
  it('initial load calls getMaterials once and renders rows', async () => {
    render(<MaterialsPage />);
    await waitFor(() => expect(integratedAPI.getMaterials).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Steel Beam')).toBeInTheDocument();
    expect(await screen.findByText('Aluminum Sheet')).toBeInTheDocument();
    expect(await screen.findByText('Brass Rod')).toBeInTheDocument();
  });

  it('search term filters locally without extra getMaterials call', async () => {
    render(<MaterialsPage />);
    await waitFor(() => expect(integratedAPI.getMaterials).toHaveBeenCalledTimes(1));
    await screen.findByText('Steel Beam');
    const searchBox = screen.getByPlaceholderText('Search materials...') as HTMLInputElement;
    fireEvent.change(searchBox, { target: { value: 'brass' } });
  await waitFor(() => expect(screen.queryByText('Steel Beam')).not.toBeInTheDocument());
  await waitFor(() => expect(screen.queryByText('Aluminum Sheet')).not.toBeInTheDocument());
  expect(await screen.findByText('Brass Rod')).toBeInTheDocument();
    expect(integratedAPI.getMaterials).toHaveBeenCalledTimes(1);
  });

  it('changing category triggers new getMaterials fetch', async () => {
    render(<MaterialsPage />);
    await waitFor(() => expect(integratedAPI.getMaterials).toHaveBeenCalledTimes(1));
    // Find the first category select via aria-label
    const categorySelect = screen.getByRole('combobox', { name: /category select/i });
    fireEvent.mouseDown(categorySelect);
    const sheetOption = await screen.findByRole('option', { name: 'Sheet' });
    fireEvent.click(sheetOption);
    await waitFor(() => expect(integratedAPI.getMaterials).toHaveBeenCalledTimes(2));
  });
});
