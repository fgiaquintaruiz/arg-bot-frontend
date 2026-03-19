const withdraw = require('../core/logic/withdraw');
const binance = require('../adapters/outbound/binance-adapter');
jest.mock('../adapters/outbound/binance-adapter');

describe('Withdraw v1.3.3 - Env Var Check', () => {
    const bot = { sendMessage: jest.fn().mockResolvedValue(true) };
    
    beforeEach(() => {
        process.env.DESTINATION_ADDRESS = "0xTEST_ENV_ADDRESS";
        jest.clearAllMocks();
    });

    test('Debe leer la dirección de DESTINATION_ADDRESS si no hay estado previo', async () => {
        const state = {};
        await withdraw(bot, '123', '3', 0, state);
        expect(state.withdrawAddress).toBe("0xTEST_ENV_ADDRESS");
        expect(bot.sendMessage).toHaveBeenCalledWith('123', expect.stringContaining("0xTEST_ENV_ADDRESS"), expect.any(Object));
    });

    test('Permite cambiar la dirección manualmente (Paso 6)', async () => {
        const state = { withdrawAddress: "0xOLD" };
        const res = await withdraw(bot, '123', '0xNEW', 6, state);
        expect(state.withdrawAddress).toBe("0xNEW");
        expect(res).toBe(5);
    });
});
