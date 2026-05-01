import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddressBook from '../components/AddressBook';

const mockAddress = {
  id: '1',
  name: 'Mi Lemon Wallet',
  // All-lowercase: pasa format + checksum (isValidChecksum retorna true para all-lowercase)
  address: '0x742d35cc6634c0532925a3b844bc9e7595f2bd38',
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

  // ─── Validación de dirección en tiempo real ────────────────────────────────

  it('dirección válida (all-lowercase) muestra "✅ Valid BSC/BEP20 address format"', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    const addressInput = screen.getByPlaceholderText(/0x\.\.\./);
    fireEvent.change(addressInput, { target: { value: '0x742d35cc6634c0532925a3b844bc9e7595f2bd38' } });
    expect(screen.getByText(/Valid BSC\/BEP20 address format/)).toBeInTheDocument();
  });

  it('input de dirección vacío: no muestra error ni valid', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    const addressInput = screen.getByPlaceholderText(/0x\.\.\./);
    fireEvent.change(addressInput, { target: { value: 'invalid' } });
    // Primero mostramos el error
    expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument();
    // Luego borramos
    fireEvent.change(addressInput, { target: { value: '' } });
    expect(screen.queryByText(/Formato/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Valid BSC/)).not.toBeInTheDocument();
  });

  it('dirección con 39 hex chars (muy corta): muestra error de formato', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), {
      target: { value: '0x742d35cc6634c0532925a3b844bc9e7595f2bd3' } // 39 chars
    });
    expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument();
  });

  it('dirección sin prefijo 0x: muestra error de formato', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), {
      target: { value: '742d35cc6634c0532925a3b844bc9e7595f2bd38' }
    });
    expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument();
  });

  // ─── Add new address ────────────────────────────────────────────────────────

  it('agrega una nueva dirección con nombre y address válidos', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));

    fireEvent.change(screen.getByPlaceholderText(/e.g., My Lemon Wallet/), {
      target: { value: 'Mi Wallet Lemon' }
    });
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), {
      target: { value: '0x742d35cc6634c0532925a3b844bc9e7595f2bd38' }
    });
    fireEvent.click(screen.getByText('Save Address'));

    expect(screen.getByText('Mi Wallet Lemon')).toBeInTheDocument();
    expect(screen.queryByText(/Add New Address/)).toBeInTheDocument(); // form closed
  });

  it('handleAddAddress sin nombre: muestra alert y no agrega', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), {
      target: { value: '0x742d35cc6634c0532925a3b844bc9e7595f2bd38' }
    });
    fireEvent.click(screen.getByText('Save Address'));
    expect(alertMock).toHaveBeenCalledWith('Ingresá un nombre para esta dirección');
    alertMock.mockRestore();
  });

  it('handleAddAddress con address inválida: no llama a alert y muestra error inline', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/e.g., My Lemon Wallet/), {
      target: { value: 'Mi Wallet' }
    });
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), {
      target: { value: 'invalid' }
    });
    fireEvent.click(screen.getByText('Save Address'));
    expect(alertMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument();
    alertMock.mockRestore();
  });

  it('nueva dirección se guarda en localStorage', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/e.g., My Lemon Wallet/), {
      target: { value: 'Storage Test' }
    });
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), {
      target: { value: '0x742d35cc6634c0532925a3b844bc9e7595f2bd38' }
    });
    fireEvent.click(screen.getByText('Save Address'));
    const stored = JSON.parse(localStorage.getItem('address_book'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Storage Test');
  });

  it('cancel en el formulario oculta el formulario sin guardar', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    expect(screen.getByPlaceholderText(/e.g., My Lemon Wallet/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText(/e.g., My Lemon Wallet/)).not.toBeInTheDocument();
    expect(screen.getByText(/Add New Address/)).toBeInTheDocument();
  });

  // ─── Edit address ───────────────────────────────────────────────────────────

  it('click Editar: rellena el formulario con datos existentes', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    fireEvent.click(screen.getByText('✏️ Editar'));
    expect(screen.getByDisplayValue('Mi Lemon Wallet')).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockAddress.address)).toBeInTheDocument();
    expect(screen.getByText('✏️ Edit Address')).toBeInTheDocument();
  });

  it('handleSaveEdit: guarda el nombre editado correctamente', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    fireEvent.click(screen.getByText('✏️ Editar'));

    fireEvent.change(screen.getByDisplayValue('Mi Lemon Wallet'), {
      target: { value: 'Wallet Editada' }
    });
    fireEvent.click(screen.getByText('Save Changes'));

    expect(screen.getByText('Wallet Editada')).toBeInTheDocument();
    expect(screen.queryByText('Mi Lemon Wallet')).not.toBeInTheDocument();
  });

  it('handleSaveEdit sin nombre: muestra alert y no guarda', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    fireEvent.click(screen.getByText('✏️ Editar'));
    fireEvent.change(screen.getByDisplayValue('Mi Lemon Wallet'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(alertMock).toHaveBeenCalledWith('Ingresá un nombre para esta dirección');
    alertMock.mockRestore();
  });

  it('handleSaveEdit con address inválida: muestra error', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    fireEvent.click(screen.getByText('✏️ Editar'));
    fireEvent.change(screen.getByDisplayValue(mockAddress.address), {
      target: { value: 'invalid' }
    });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(screen.getByText(/Formato de dirección BSC\/BEP20 inválido/)).toBeInTheDocument();
  });

  // ─── Delete ─────────────────────────────────────────────────────────────────

  it('delete con confirm=false: la dirección sigue en la lista', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AddressBook />);
    fireEvent.click(screen.getByText('🗑️ Eliminar'));
    expect(screen.getByText('Mi Lemon Wallet')).toBeInTheDocument();
  });

  // ─── Select mode ────────────────────────────────────────────────────────────

  it('modo select: muestra botón "👆 Tocar para seleccionar"', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook onSelect={() => {}} />);
    expect(screen.getByText(/Tocar para seleccionar/)).toBeInTheDocument();
  });

  it('handleSelect: llama a onSelect con la AddressEntry completa y a onClose', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook onSelect={onSelect} onClose={onClose} />);
    fireEvent.click(screen.getByText(/Tocar para seleccionar/));
    expect(onSelect).toHaveBeenCalledWith(mockAddress);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handleSelect sin onClose: no explota', () => {
    const onSelect = vi.fn();
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Tocar para seleccionar/));
    expect(onSelect).toHaveBeenCalledWith(mockAddress);
  });

  // ─── Filtro de búsqueda ──────────────────────────────────────────────────────

  it('filtro por address: muestra la dirección que matchea', () => {
    const addresses = [
      { ...mockAddress, name: 'Nexo', address: '0x742d35cc6634c0532925a3b844bc9e7595f2bd38' },
      { ...mockAddress, id: '2', name: 'Lemon', address: '0xabcdefabcdefabcdefabcdefabcdefabcdef1234' },
    ];
    localStorage.setItem('address_book', JSON.stringify(addresses));
    render(<AddressBook />);
    fireEvent.change(screen.getByPlaceholderText(/Search by name or address/), {
      target: { value: '0xabcdef' }
    });
    expect(screen.getByText('Lemon')).toBeInTheDocument();
    expect(screen.queryByText('Nexo')).not.toBeInTheDocument();
  });

  it('búsqueda sin resultados: muestra "Ninguna dirección coincide"', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    fireEvent.change(screen.getByPlaceholderText(/Search by name or address/), {
      target: { value: 'XXXXXXX' }
    });
    expect(screen.getByText(/Ninguna dirección coincide/)).toBeInTheDocument();
  });

  it('localStorage corrupto: carga sin crashear con lista vacía', () => {
    localStorage.setItem('address_book', 'INVALID_JSON{{{');
    render(<AddressBook />);
    expect(screen.getByText(/No hay direcciones guardadas/)).toBeInTheDocument();
  });

  // ─── handleSave (Add New Address form) ───────────────────────────────────────

  it('handleSave: agrega dirección válida con checksum correcto', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/e.g., My Lemon Wallet/), { target: { value: 'Nexo Wallet' } });
    // All-lowercase address pasa checksum (isValidChecksum returns true)
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), { target: { value: mockAddress.address } });
    fireEvent.click(screen.getByText('Save Address'));
    expect(screen.getByText('Nexo Wallet')).toBeInTheDocument();
  });

  it('handleSave: dirección con checksum inválido muestra error', () => {
    render(<AddressBook />);
    fireEvent.click(screen.getByText(/Add New Address/));
    fireEvent.change(screen.getByPlaceholderText(/e.g., My Lemon Wallet/), { target: { value: 'Test Wallet' } });
    // Uppercase la primera 'd' (posición 3): all-lowercase pasa → 'D' en esa posición FALLA checksum
    fireEvent.change(screen.getByPlaceholderText(/0x\.\.\./), { target: { value: '0x742D35cc6634c0532925a3b844bc9e7595f2bd38' } });
    fireEvent.click(screen.getByText('Save Address'));
    expect(screen.getByText(/checksum/)).toBeInTheDocument();
  });

  it('handleSaveEdit: dirección con checksum inválido muestra error en edición', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    fireEvent.click(screen.getByText('✏️ Editar'));
    fireEvent.change(screen.getByDisplayValue(mockAddress.address), {
      target: { value: '0x742D35cc6634c0532925a3b844bc9e7595f2bd38' }
    });
    fireEvent.click(screen.getByText('Save Changes'));
    expect(screen.getByText(/checksum/)).toBeInTheDocument();
  });

  // ─── onTouchEnd handlers ─────────────────────────────────────────────────────

  it('onTouchEnd en card de selección llama a handleSelect con AddressEntry completa', () => {
    const onSelect = vi.fn();
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook onSelect={onSelect} />);
    const cardBtn = screen.getByText(/Tocar para seleccionar/).closest('button');
    fireEvent.touchEnd(cardBtn);
    expect(onSelect).toHaveBeenCalledWith(mockAddress);
  });

  it('onTouchEnd en botón Editar abre el formulario de edición', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    render(<AddressBook />);
    const editBtn = screen.getByText('✏️ Editar');
    fireEvent.touchEnd(editBtn);
    expect(screen.getByText('✏️ Edit Address')).toBeInTheDocument();
  });

  it('onTouchEnd en botón Eliminar solicita confirmación', () => {
    localStorage.setItem('address_book', JSON.stringify([mockAddress]));
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AddressBook />);
    const deleteBtn = screen.getByText('🗑️ Eliminar');
    fireEvent.touchEnd(deleteBtn);
    expect(window.confirm).toHaveBeenCalledTimes(1);
  });
});
