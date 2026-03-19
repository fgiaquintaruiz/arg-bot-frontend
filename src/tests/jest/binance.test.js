const binance = require('../adapters/outbound/binance-adapter');

describe('Pruebas de Lógica de Binance', () => {
    test('withdrawUSDC debe manejar parámetros', async () => {
        const result = await binance.withdrawUSDC(100, '0x123');
        expect(result.success).toBe(true);
    });
    
    test('getServerIP debe devolver una IP válida', async () => {
        const ip = await binance.getServerIP();
        // Validamos que sea un string con formato de IP
        expect(ip).toMatch(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);
    });
});
