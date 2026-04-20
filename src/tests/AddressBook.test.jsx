import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddressBook from '../components/AddressBook';

const mockAddress = {
  id: '1',
  name: 'Mi Lemon Wallet',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38',
  network: 'BSC',
  addedAt: '2026-04-10T10:00:00.000Z'
};

describe('AddressBook Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render address book title', () => {
    render(<AddressBook />);
    expect(screen.getByText(/Address Book/)).toBeInTheDocument();
  });

  it('should show empty state when no addresses', () => {
    render(<AddressBook />);
    expect(screen.getByText(/No hay direcciones guardadas/)).toBeInTheDocument();
  });

  it('should show addresses from localStorage', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    expect(screen.getByText('Mi Lemon Wallet')).toBeInTheDocument();
  });

  it('should show add form when clicking add button', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    expect(screen.getByPlaceholderText(/e.g., My Lemon Wallet/)).toBeInTheDocument();
  });

  it('should validate address format in real-time', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    const addressInput = screen.getByPlaceholderText(/0x\.\.\./);
    fireEvent.change(addressInput, { target: { value: 'invalid' } });
    expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument();
  });

  it('should show edit and delete buttons for each address', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    expect(screen.getByText('✏️ Editar')).toBeInTheDocument();
    expect(screen.getByText('🗑️ Eliminar')).toBeInTheDocument();
  });

  it('should delete an address after confirmation', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AddressBook />);
    fireEvent.click(screen.getByText('🗑️ Eliminar'));
    expect(screen.queryByText('Mi Lemon Wallet')).not.toBeInTheDocument();
  });

  it('should filter addresses by name', () => {
    const addresses = [
      { ...mockAddress, name: 'Lemon Wallet' },
      { ...mockAddress, id: '2', name: 'Buenbit Wallet' }
    ];
    localStorage.setItem('address_book', JSON.stringify(addresses));
    render(<AddressBook />);
    const searchInput = screen.getByPlaceholderText(/Search by name or address/);
    fireEvent.change(searchInput, { target: { value: 'Lemon' } });
    expect(screen.getByText('Lemon Wallet')).toBeInTheDocument();
    expect(screen.queryByText('Buenbit Wallet')).not.toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<AddressBook onClose={mockOnClose} />);
    fireEvent.click(screen.getByText(/Back/));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
