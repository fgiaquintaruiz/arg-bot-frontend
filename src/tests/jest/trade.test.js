const trade = require('../core/logic/trade');
const binance = require('../adapters/outbound/binance-adapter');
jest.mock('../adapters/outbound/binance-adapter');

describe('Trade v1.2.10 - Sin Validaciones', () => {
    const bot = { sendMessage: jest.fn().mockResolvedValue(true) };
    test('Debe disparar orden a Binance directamente', async () => {
        binance.getBalances.mockResolvedValue({ eur: '0' });
        binance.executeTrade.mockResolvedValue({ success: false, error: 'insufficient balance' });
        
        await trade(bot, 123, '10', 2, { eurBalance: 0 }); // Intentamos 10 con saldo 0
        const res = await trade(bot, 123, 'si', 3, { tradeAmount: 10 });
        
        expect(res).toBe(0);
        expect(binance.executeTrade).toHaveBeenCalled();
    });
});
