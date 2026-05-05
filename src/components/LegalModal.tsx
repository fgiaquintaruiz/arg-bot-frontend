import React, { useState } from 'react';
import { TERMS_TEXT } from '../constants/terms';
import { PRIVACY_TEXT } from '../constants/privacy';
import styles from './LegalModal.module.css';

interface LegalModalProps {
    onClose: () => void;
    initialTab?: 'terms' | 'privacy';
}

export default function LegalModal({ onClose, initialTab = 'terms' }: LegalModalProps) {
    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                <div className={styles.header}>
                    <h2 className={styles['header-title']}>Documentación Legal</h2>
                    <button onClick={onClose} aria-label="Cerrar modal legal" className={styles['close-button']}>✖</button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={activeTab === 'terms' ? styles['tab-active'] : styles['tab-inactive']}
                        onClick={() => setActiveTab('terms')}
                    >
                        Términos y Condiciones
                    </button>
                    <button
                        className={activeTab === 'privacy' ? styles['tab-active'] : styles['tab-inactive']}
                        onClick={() => setActiveTab('privacy')}
                    >
                        Políticas de Privacidad
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles['content-text']}>
                        {activeTab === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
                    </div>
                </div>

            </div>
        </div>
    );
}
