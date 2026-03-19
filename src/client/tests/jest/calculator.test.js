const calculator = require('../core/logic/calculator');
const binance = require('../adapters/outbound/binance-adapter');

jest.mock('../adapters/outbound/binance-adapter', () => ({
    getPrices: jest.fn().mockResolvedValue({ eurUsdc: 1.08 }),
    getServerIP: jest.fn().mockResolvedValue('127.0.0.1')
}));

describe('Pasos de Calculadora ARS', () => {
    const bot = { sendMessage: jest.fn().mockResolvedValue(true) };
    const chatId = 123;

    test('Debe pedir monto en paso 0 (ARS)', async () => {
        const res = await calculator(bot, chatId, '', 0, {});
        expect(res).toBe(1);
        expect(bot.sendMessage).toHaveBeenCalledWith(chatId, expect.stringContaining('Pesos (ARS)'));
    });

    test('Debe calcular conversión en paso 1 (ARS a EUR)', async () => {
        const res = await calculator(bot, chatId, '1200', 1, {});
        expect(res).toBe(0);
        expect(bot.sendMessage).toHaveBeenCalledWith(chatId, expect.stringContaining('1.00 EUR'));
    });
});
