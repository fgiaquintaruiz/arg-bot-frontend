import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calculator from '../components/Calculator';

describe('Calculator Component', () => {
  const mockData = {
    balances: { eur: '100.00', usdc: '200.00' },
    rate: '1.0850',
    usdcArsRate: '1150.50',
    fees: {
      withdrawalUSDC_BEP20: 0.8,
      tradingRate: 0.001
    }
  };

  it('should render calculator with default values', () => {
    render(<Calculator data={mockData} />);
    
    expect(screen.getByText('Calculadora')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
  });

  it('should show loading state when data is null', () => {
    render(<Calculator data={null} />);
    
    expect(screen.getByText('Cargando mercado...')).toBeInTheDocument();
  });

  it('should calculate correct breakdown for ARS amount', () => {
    render(<Calculator data={mockData} />);
    
    // Default ARS amount is 500000
    const arsAmount = 500000;
    const usdcArs = 1150.50;
    const eurUsdc = 1.0850;
    const withdrawalFee = 0.8;
    const tradingFeeRate = 0.001;
    const sepaFee = 1.00;
    
    const usdcForBroker = arsAmount / usdcArs;
    const usdcAtBinance = usdcForBroker + withdrawalFee;
    const eurBeforeTradeFee = usdcAtBinance / eurUsdc;
    const tradingFeeEur = eurBeforeTradeFee * tradingFeeRate;
    const eurToDeposit = eurBeforeTradeFee + tradingFeeEur;
    const eurTotal = eurToDeposit + sepaFee;
    
    expect(screen.getByText(/Desglose de la operación/)).toBeInTheDocument();
    expect(screen.getByText(`+ ${sepaFee.toFixed(2)} EUR`)).toBeInTheDocument();
    expect(screen.getByText(`${eurBeforeTradeFee.toFixed(2)} EUR`)).toBeInTheDocument();
    expect(screen.getByText(`+ ${withdrawalFee.toFixed(2)} USDC`)).toBeInTheDocument();
    expect(screen.getByText(`${eurTotal.toFixed(2)} €`)).toBeInTheDocument();
  });

  it('should update calculations when ARS amount changes', () => {
    render(<Calculator data={mockData} />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1000000' } });
    
    // Should recalculate with new amount
    const newArsAmount = 1000000;
    const usdcArs = 1150.50;
    const eurUsdc = 1.0850;
    const withdrawalFee = 0.8;
    const tradingFeeRate = 0.001;
    const sepaFee = 1.00;
    
    const usdcForBroker = newArsAmount / usdcArs;
    const usdcAtBinance = usdcForBroker + withdrawalFee;
    const eurBeforeTradeFee = usdcAtBinance / eurUsdc;
    const tradingFeeEur = eurBeforeTradeFee * tradingFeeRate;
    const eurToDeposit = eurBeforeTradeFee + tradingFeeEur;
    const eurTotal = eurToDeposit + sepaFee;
    
    expect(screen.getByText(`${eurTotal.toFixed(2)} €`)).toBeInTheDocument();
  });

  it('should calculate and display savings vs Remitly', () => {
    render(<Calculator data={mockData} />);
    
    const arsAmount = 500000;
    const usdcArs = 1150.50;
    const eurUsdc = 1.0850;
    const withdrawalFee = 0.8;
    const tradingFeeRate = 0.001;
    const sepaFee = 1.00;
    
    const usdcForBroker = arsAmount / usdcArs;
    const usdcAtBinance = usdcForBroker + withdrawalFee;
    const eurBeforeTradeFee = usdcAtBinance / eurUsdc;
    const tradingFeeEur = eurBeforeTradeFee * tradingFeeRate;
    const eurToDeposit = eurBeforeTradeFee + tradingFeeEur;
    const eurTotal = eurToDeposit + sepaFee;
    
    const remitlyEur = eurTotal * 1.10;
    const ahorro = remitlyEur - eurTotal;
    
    expect(screen.getByText(/AHORRO vs REMITLY/)).toBeInTheDocument();
    expect(screen.getByText(`🎉 AHORRO vs REMITLY: ${ahorro.toFixed(2)} €`)).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    const mockOnBack = vi.fn();
    render(<Calculator data={mockData} onBack={mockOnBack} />);
    
    const backButton = screen.getByText(/Volver al Menú/);
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should not render back button when onBack is not provided', () => {
    render(<Calculator data={mockData} />);
    
    const backButton = screen.queryByText(/Volver al Menú/);
    expect(backButton).not.toBeInTheDocument();
  });

  it('should handle invalid ARS amount gracefully', () => {
    render(<Calculator data={mockData} />);
    
    const input = screen.getByDisplayValue('500000');
    fireEvent.change(input, { target: { value: 'invalid' } });
    
    // Should use fallback value of 0, resulting in minimal EUR cost
    expect(screen.getByText('1.74 €')).toBeInTheDocument();
  });

  it('should handle zero ARS amount', () => {
    render(<Calculator data={mockData} />);
    
    const input = screen.getByDisplayValue('500000');
    fireEvent.change(input, { target: { value: '0' } });
    
    // Should calculate with 0 - result should be minimal (just fees)
    expect(screen.getByText('1.74 €')).toBeInTheDocument();
  });

  it('should handle missing fees in data', () => {
    const dataWithoutFees = {
      balances: { eur: '100.00', usdc: '200.00' },
      rate: '1.0850',
      usdcArsRate: '1150.50'
    };
    
    render(<Calculator data={dataWithoutFees} />);
    
    // Should use default withdrawal fee of 0.8
    expect(screen.getByText('+ 0.80 USDC')).toBeInTheDocument();
  });

  it('should handle missing usdcArsRate with fallback', () => {
    const dataWithoutRate = {
      balances: { eur: '100.00', usdc: '200.00' },
      rate: '1.0850',
      fees: {
        withdrawalUSDC_BEP20: 0.8,
        tradingRate: 0.001
      }
    };
    
    render(<Calculator data={dataWithoutRate} />);
    
    // Should use fallback rate of 1121.00
    expect(screen.getByText(/USDC destino \(Tasa: 1121\)/)).toBeInTheDocument();
  });

  it('should handle missing rate with fallback', () => {
    const dataWithoutRate = {
      balances: { eur: '100.00', usdc: '200.00' },
      usdcArsRate: '1150.50',
      fees: {
        withdrawalUSDC_BEP20: 0.8,
        tradingRate: 0.001
      }
    };
    
    render(<Calculator data={dataWithoutRate} />);
    
    // Should use fallback rate of 1.08
    expect(screen.getByText(/EUR para comprar USDC \(1.08\)/)).toBeInTheDocument();
  });
});
