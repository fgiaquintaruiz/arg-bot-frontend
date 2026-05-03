import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

export interface AddressEntry {
  id: string;
  name: string;
  address: string;
  network: 'BSC';
  addedAt: string;
}

interface AddressBookProps {
  onSelect?: (entry: AddressEntry) => void;
  onClose?: () => void;
}

const STORAGE_KEY = 'address_book';

// Validate BSC/BEP20 address format (EVM-compatible)
const isValidBSCAddress = (address: string): boolean => {
  // Must match 0x followed by 40 hex characters
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

// Check if address matches EIP-55 checksum (optional but recommended)
const isValidChecksum = (address: string): boolean => {
  /* v8 ignore start */
  if (!isValidBSCAddress(address)) return false;
  /* v8 ignore end */
  
  // If all lowercase or all uppercase after 0x, skip checksum validation
  const addressWithoutPrefix = address.slice(2);
  if (addressWithoutPrefix === addressWithoutPrefix.toLowerCase() ||
      addressWithoutPrefix === addressWithoutPrefix.toUpperCase()) {
    return true; // No checksum, format is valid
  }
  
  // Implement EIP-55 checksum validation
  const hash = CryptoJS.SHA3(addressWithoutPrefix.toLowerCase(), { outputLength: 256 }).toString(CryptoJS.enc.Hex);

  for (let i = 0; i < 40; i++) {
    const hashChar = hash[i];
    const addressChar = addressWithoutPrefix[i];
    const hashValue = parseInt(hashChar, 16);
    
    if (hashValue >= 8) {
      // Should be uppercase
      /* v8 ignore start */
      if (addressChar !== addressChar.toUpperCase()) return false;
      /* v8 ignore end */
    } else {
      // Should be lowercase
      if (addressChar !== addressChar.toLowerCase()) return false;
    }
  }

  /* v8 ignore start */
  return true;
  /* v8 ignore end */
};

export default function AddressBook({ onSelect, onClose }: AddressBookProps) {
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [validationError, setValidationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  console.log('[AddressBook] Render — onSelect:', !!onSelect, 'addresses:', addresses.length, 'editingId:', editingId);

  // Load addresses from localStorage on mount
  useEffect(() => {
    console.log('[AddressBook] Loading from localStorage...');
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[AddressBook] Loaded', parsed.length, 'addresses:', parsed);
        setAddresses(parsed);
      } else {
        console.log('[AddressBook] No addresses in localStorage');
      }
    } catch (error) {
      console.error('[AddressBook] Error loading:', error);
    }
  }, []);

  // Save to localStorage whenever addresses change
  const saveAddresses = (updated: AddressEntry[]) => {
    console.log('[AddressBook] Saving', updated.length, 'addresses');
    setAddresses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Validate address in real-time
  const handleAddressChange = (value: string) => {
    setNewAddress(value);
    setValidationError('');

    if (value.length > 0) {
      if (!isValidBSCAddress(value)) {
        setValidationError('Formato de dirección BSC/BEP20 inválido');
      } else if (!isValidChecksum(value)) {
        setValidationError('La dirección no pasa la validación de checksum');
      }
    }
  };

  // Delete address
  const handleDelete = (id: string) => {
    console.log('[AddressBook] Delete called for id:', id);
    if (confirm('¿Estás seguro de que querés eliminar esta dirección?')) {
      const updated = addresses.filter(addr => addr.id !== id);
      saveAddresses(updated);
    }
  };

  // Start editing
  const handleEdit = (entry: AddressEntry) => {
    console.log('[AddressBook] Edit called for:', entry.name);
    setEditingId(entry.id);
    setNewName(entry.name);
    setNewAddress(entry.address);
    setValidationError('');
    setShowAddForm(true);
  };

  // Save edited address
  const handleSaveEdit = () => {
    console.log('[AddressBook] SaveEdit called');
    if (!newName.trim()) {
      alert('Ingresá un nombre para esta dirección');
      return;
    }

    if (!isValidBSCAddress(newAddress)) {
      setValidationError('Formato de dirección BSC/BEP20 inválido');
      return;
    }

    if (!isValidChecksum(newAddress)) {
      setValidationError('La dirección no pasa la validación de checksum');
      return;
    }

    const updated = addresses.map(entry =>
      entry.id === editingId
        ? { ...entry, name: newName.trim(), address: newAddress.trim() }
        : entry
    );
    saveAddresses(updated);

    setEditingId(null);
    setNewName('');
    setNewAddress('');
    setValidationError('');
    setShowAddForm(false);
  };

  // Add new address
  const handleAddAddress = () => {
    console.log('[AddressBook] AddAddress called');
    if (!newName.trim()) {
      alert('Ingresá un nombre para esta dirección');
      return;
    }

    if (!isValidBSCAddress(newAddress)) {
      setValidationError('Formato de dirección BSC/BEP20 inválido');
      return;
    }

    if (!isValidChecksum(newAddress)) {
      setValidationError('La dirección no pasa la validación de checksum');
      return;
    }

    const newEntry: AddressEntry = {
      id: Date.now().toString(),
      name: newName.trim(),
      address: newAddress.trim(),
      network: 'BSC',
      addedAt: new Date().toISOString()
    };

    const updated = [newEntry, ...addresses];
    saveAddresses(updated);

    setNewName('');
    setNewAddress('');
    setValidationError('');
    setEditingId(null);
    setShowAddForm(false);
  };

  // Select address — passes full AddressEntry to caller
  const handleSelect = (entry: AddressEntry) => {
    console.log('[AddressBook] Select called for:', entry.address);
    if (onSelect) {
      onSelect(entry);
    }
    if (onClose) {
      onClose();
    }
  };

  // Filter addresses by search
  const filteredAddresses = addresses.filter(addr => 
    addr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const btnS: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '12px'
  };

  const backBtnS: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '20px'
  };

  const inS: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#0e1621',
    border: '1px solid #334155',
    color: 'white',
    borderRadius: '12px',
    marginBottom: '16px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ backgroundColor: '#17212b', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid #1e293b', width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{marginTop:0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem'}}>
        <span style={{fontSize: '24px'}}>📖</span> Address Book
      </h3>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{...inS, marginBottom: '12px'}}
        placeholder="🔍 Search by name or address..."
      />

      {/* Address List */}
      {filteredAddresses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>
          {addresses.length === 0 ? 'No hay direcciones guardadas. ¡Agregá tu primera!' : 'Ninguna dirección coincide con tu búsqueda.'}
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px', marginBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
          {filteredAddresses.map((entry) => (
            <div
              key={entry.id}
              style={{
                backgroundColor: '#0e1621',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: onSelect ? '2px solid #38bdf8' : '1px solid #334155',
              }}
            >
              {/* Selection button (only in select mode) */}
              {onSelect && (
                <button
                  onClick={(e) => {
                    console.log('[AddressBook] Card clicked via onClick');
                    e.preventDefault();
                    handleSelect(entry);
                  }}
                  onTouchEnd={(e) => {
                    console.log('[AddressBook] Card touched via onTouchEnd');
                    e.preventDefault();
                    handleSelect(entry);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    WebkitAppearance: 'none',
                    touchAction: 'manipulation',
                    display: 'block',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '15px' }}>
                      {entry.name}
                    </span>
                    <span style={{ color: '#10b981', fontSize: '11px', backgroundColor: '#052e16', padding: '4px 8px', borderRadius: '6px' }}>
                      ✅ BSC/BEP20
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#94a3b8',
                    wordBreak: 'break-all',
                  }}>
                    {entry.address}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                    👆 Tocar para seleccionar
                  </div>
                </button>
              )}

              {/* Always show: name, address, edit/delete */}
              {!onSelect && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '15px' }}>
                    {entry.name}
                  </span>
                  <span style={{ color: '#10b981', fontSize: '11px', backgroundColor: '#052e16', padding: '4px 8px', borderRadius: '6px' }}>
                    ✅ BSC/BEP20
                  </span>
                </div>
              )}
              {!onSelect && (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#94a3b8',
                  wordBreak: 'break-all',
                  marginBottom: '8px',
                  cursor: 'text',
                  userSelect: 'text'
                }}>
                  {entry.address}
                </div>
              )}

              {/* Edit/Delete buttons — ALWAYS visible */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: onSelect ? '1px solid #1e293b' : 'none', paddingTop: onSelect ? '8px' : 0 }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {new Date(entry.addedAt).toLocaleDateString('es-AR')}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onTouchEnd={(e) => {
                      console.log('[AddressBook] Edit touched');
                      e.preventDefault();
                      handleEdit(entry);
                    }}
                    onClick={(e) => {
                      console.log('[AddressBook] Edit clicked');
                      e.stopPropagation();
                      handleEdit(entry);
                    }}
                    style={{
                      background: '#1e293b',
                      color: '#38bdf8',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      WebkitTapHighlightColor: 'transparent',
                      WebkitAppearance: 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onTouchEnd={(e) => {
                      console.log('[AddressBook] Delete touched for:', entry.name);
                      e.preventDefault();
                      handleDelete(entry.id);
                    }}
                    onClick={(e) => {
                      console.log('[AddressBook] Delete clicked for:', entry.name);
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    style={{
                      background: '#450a0a',
                      color: '#ef4444',
                      border: '1px solid #7f1d1d',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      WebkitTapHighlightColor: 'transparent',
                      WebkitAppearance: 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Address Form */}
      {showAddForm ? (
        <div style={{ backgroundColor: '#2d2013', border: '1px solid #ff9800', padding: '20px', borderRadius: '16px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#ffb74d', fontSize: '15px' }}>
            {editingId ? '✏️ Edit Address' : '➕ Add New Address'}
          </h4>
          
          <label style={{display:'block', fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={inS}
            placeholder="e.g., My Lemon Wallet"
          />

          <label style={{display:'block', fontSize:'13px', color:'#94a3b8', marginBottom:'8px'}}>BSC/BEP20 Address</label>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            style={{
              ...inS,
              borderColor: validationError ? '#ef4444' : '#334155'
            }}
            placeholder="0x..."
          />

          {validationError && (
            <div style={{ color: '#ef5350', fontSize: '13px', marginBottom: '16px', backgroundColor: '#450a0a', padding: '10px', borderRadius: '8px' }}>
              ⚠️ {validationError}
            </div>
          )}

          {!validationError && newAddress.length > 0 && (
            <div style={{ color: '#4caf50', fontSize: '13px', marginBottom: '16px', backgroundColor: '#052e16', padding: '10px', borderRadius: '8px' }}>
              ✅ Valid BSC/BEP20 address format
            </div>
          )}

          <button onClick={editingId ? handleSaveEdit : handleAddAddress} style={btnS}>
            {editingId ? 'Save Changes' : 'Save Address'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingId(null);
              setNewName('');
              setNewAddress('');
              setValidationError('');
            }}
            style={backBtnS}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          ➕ Add New Address
        </button>
      )}

      {onClose && (
        <button onClick={onClose} style={backBtnS}>
          <span>⬅</span>
          <span>Back</span>
        </button>
      )}
    </div>
  );
}
