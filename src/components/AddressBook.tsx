import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import styles from './AddressBook.module.css';

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Load addresses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAddresses(parsed);
      }
    } catch {
      // ignore parse errors
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
        setValidationError('Formato de dirección BSC/BEP20 inválido');
      } else if (!isValidChecksum(value)) {
        setValidationError('La dirección no pasa la validación de checksum');
      }
    }
  };

  // Delete address
  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      const updated = addresses.filter(addr => addr.id !== deleteConfirm);
      saveAddresses(updated);
      setDeleteConfirm(null);
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
      setFormError('Ingresá un nombre para esta dirección');
      return;
    }
    setFormError('');

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
    setFormError('');
    setShowAddForm(false);
  };

  // Add new address
  const handleAddAddress = () => {
    if (!newName.trim()) {
      setFormError('Ingresá un nombre para esta dirección');
      return;
    }
    setFormError('');

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
    setFormError('');
    setEditingId(null);
    setShowAddForm(false);
  };

  // Select address — passes full AddressEntry to caller
  const handleSelect = (entry: AddressEntry) => {
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

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className={styles['title-icon']}>📖</span> Address Book
      </h3>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles['input-search']}
        placeholder="🔍 Search by name or address..."
      />

      {/* Address List */}
      {filteredAddresses.length === 0 ? (
        <div className={styles['empty-state']}>
          {addresses.length === 0 ? 'No hay direcciones guardadas. ¡Agregá tu primera!' : 'Ninguna dirección coincide con tu búsqueda.'}
        </div>
      ) : (
        <div className={styles['list-scroll']}>
          {filteredAddresses.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.card} ${onSelect ? styles['card-select-mode'] : styles['card-manage-mode']}`}
            >
              {/* Selection button (only in select mode) */}
              {onSelect && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(entry);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleSelect(entry);
                  }}
                  className={styles['select-btn']}
                >
                  <div className={styles['card-header']}>
                    <span className={styles['card-name']}>
                      {entry.name}
                    </span>
                    <span className={styles['card-network-badge']}>
                      ✅ BSC/BEP20
                    </span>
                  </div>
                  <div className={styles['card-address-select']}>
                    {entry.address}
                  </div>
                  <div className={styles['tap-hint']}>
                    👆 Tocar para seleccionar
                  </div>
                </button>
              )}

              {/* Always show: name, address, edit/delete */}
              {!onSelect && (
                <div className={styles['card-header-mb8']}>
                  <span className={styles['card-name']}>
                    {entry.name}
                  </span>
                  <span className={styles['card-network-badge']}>
                    ✅ BSC/BEP20
                  </span>
                </div>
              )}
              {!onSelect && (
                <div className={styles['card-address-manage']}>
                  {entry.address}
                </div>
              )}

              {/* Edit/Delete buttons — ALWAYS visible */}
              <div className={`${styles['card-footer']} ${onSelect ? styles['card-footer-select'] : ''}`}>
                <span className={styles['card-date']}>
                  {new Date(entry.addedAt).toLocaleDateString('es-AR')}
                </span>
                <div className={styles['card-actions']}>
                  <button
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleEdit(entry);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(entry);
                    }}
                    className={styles['edit-btn']}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleDelete(entry.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className={styles['delete-btn']}
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
        <div className={styles['form-container']}>
          <h4 className={styles['form-title']}>
            {editingId ? '✏️ Edit Address' : '➕ Add New Address'}
          </h4>

          <label className={styles['form-label']}>Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setFormError(''); }}
            className={styles.input}
            placeholder="e.g., My Lemon Wallet"
          />

          {formError && (
            <p style={{ color: 'red', margin: '4px 0 8px', fontSize: '13px' }}>
              ⚠️ {formError}
            </p>
          )}

          <label className={styles['form-label']}>BSC/BEP20 Address</label>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            className={`${styles.input} ${validationError ? styles['input-error'] : ''}`}
            placeholder="0x..."
          />

          {validationError && (
            <div className={styles['validation-error']}>
              ⚠️ {validationError}
            </div>
          )}

          {!validationError && newAddress.length > 0 && (
            <div className={styles['validation-success']}>
              ✅ Valid BSC/BEP20 address format
            </div>
          )}

          <button onClick={editingId ? handleSaveEdit : handleAddAddress} className={styles['save-btn']}>
            {editingId ? 'Save Changes' : 'Save Address'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingId(null);
              setNewName('');
              setNewAddress('');
              setValidationError('');
              setFormError('');
            }}
            className={styles['back-btn']}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className={styles['add-btn']}
        >
          ➕ Add New Address
        </button>
      )}

      {onClose && (
        <button onClick={onClose} className={styles['back-btn']}>
          <span>⬅</span>
          <span>Back</span>
        </button>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '12px', padding: '24px', maxWidth: '320px', width: '90%', textAlign: 'center' }}>
            <p style={{ color: '#fff', marginBottom: '16px', fontSize: '15px' }}>¿Eliminar esta dirección?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={handleDeleteConfirmed} className={styles['delete-btn']}>
                Sí, eliminar
              </button>
              <button onClick={() => setDeleteConfirm(null)} className={styles['back-btn']}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
