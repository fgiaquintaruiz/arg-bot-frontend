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
  onSelect?: (address: string) => void;
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
  if (!isValidBSCAddress(address)) return false;
  
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
      if (addressChar !== addressChar.toUpperCase()) return false;
    } else {
      // Should be lowercase
      if (addressChar !== addressChar.toLowerCase()) return false;
    }
  }
  
  return true;
};

export default function AddressBook({ onSelect, onClose }: AddressBookProps) {
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [validationError, setValidationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load addresses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAddresses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading address book:', error);
    }
  }, []);

  // Save to localStorage whenever addresses change
  const saveAddresses = (updated: AddressEntry[]) => {
    setAddresses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Validate address in real-time
  const handleAddressChange = (value: string) => {
    setNewAddress(value);
    setValidationError('');
    
    if (value.length > 0) {
      if (!isValidBSCAddress(value)) {
        setValidationError('Invalid BSC/BEP20 address format. Must be 0x followed by 40 hex characters.');
      } else if (!isValidChecksum(value)) {
        setValidationError('Address checksum is invalid. Please check for typos.');
      }
    }
  };

  // Delete address
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      const updated = addresses.filter(addr => addr.id !== id);
      saveAddresses(updated);
    }
  };

  // Start editing
  const handleEdit = (entry: AddressEntry) => {
    setEditingId(entry.id);
    setNewName(entry.name);
    setNewAddress(entry.address);
    setValidationError('');
    setShowAddForm(true);
  };

  // Save edited address
  const handleSaveEdit = () => {
    if (!newName.trim()) {
      alert('Please enter a name for this address');
      return;
    }

    if (!isValidBSCAddress(newAddress)) {
      setValidationError('Invalid BSC/BEP20 address format');
      return;
    }

    if (!isValidChecksum(newAddress)) {
      setValidationError('Address checksum validation failed');
      return;
    }

    const updated = addresses.map(entry =>
      entry.id === editingId
        ? { ...entry, name: newName.trim(), address: newAddress.trim() }
        : entry
    );
    saveAddresses(updated);

    // Reset form
    setEditingId(null);
    setNewName('');
    setNewAddress('');
    setValidationError('');
    setShowAddForm(false);
  };

  // Add new address
  const handleAddAddress = () => {
    if (!newName.trim()) {
      alert('Please enter a name for this address');
      return;
    }

    if (!isValidBSCAddress(newAddress)) {
      setValidationError('Invalid BSC/BEP20 address format');
      return;
    }

    if (!isValidChecksum(newAddress)) {
      setValidationError('Address checksum validation failed');
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

    // Reset form
    setNewName('');
    setNewAddress('');
    setValidationError('');
    setEditingId(null);
    setShowAddForm(false);
  };

  // Select address
  const handleSelect = (address: string) => {
    if (onSelect) {
      onSelect(address);
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
        <div style={{ textAlign: 'center', padding: '30px', color: '#8897a7', fontSize: '14px' }}>
          {addresses.length === 0 ? 'No saved addresses yet. Add your first one!' : 'No addresses match your search.'}
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px', marginBottom: '16px' }}>
          {filteredAddresses.map((entry) => (
            <div
              key={entry.id}
              style={{
                backgroundColor: '#0e1621',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '1px solid #242f3d',
                cursor: onSelect ? 'pointer' : 'default'
              }}
              onClick={() => onSelect && handleSelect(entry.address)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
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
                marginBottom: '8px'
              }}>
                {entry.address}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Added {new Date(entry.addedAt).toLocaleDateString()}
                </span>
                {!onSelect && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(entry);
                      }}
                      style={{
                        background: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      style={{
                        background: '#450a0a',
                        color: '#ef4444',
                        border: '1px solid #7f1d1d',
                        borderRadius: '6px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
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
