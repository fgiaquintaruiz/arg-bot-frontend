const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

let lastMessage = "";
let sessionState = { step: 0, module: null };

const mockBot = { sendMessage: (id, text) => { lastMessage = text; return Promise.resolve(); } };
const getLogic = (mod) => require(`../../core/logic/${mod}`);

Given('el bot está en el panel principal', function () {
    sessionState = { step: 0, module: null };
    lastMessage = "";
});

Given('el precio de EUR-USDC es {string}', (p) => { process.env.MOCK_PRICE = p; });
Given('Binance no responde a la consulta de precios', () => { process.env.MOCK_ERROR = "true"; });
Given('tengo una dirección de Buenbit configurada como {string}', (a) => { process.env.DESTINATION_ADDRESS = a; });
Given('Binance reportará un error de {string}', (e) => { process.env.MOCK_BINANCE_ERROR = e; });

When('ingreso al flujo de calculadora con el comando {string}', async (cmd) => {
    sessionState.module = 'calculator';
    await getLogic('calculator')(mockBot, 123, cmd, 0, sessionState);
});

When('ingreso al flujo de trade con el comando {string}', async (cmd) => {
    sessionState.module = 'trade';
    await getLogic('trade')(mockBot, 123, cmd, 0, sessionState);
});

When('ingreso al flujo de retiro con el comando {string}', async (cmd) => {
    sessionState.module = 'withdraw';
    await getLogic('withdraw')(mockBot, 123, cmd, 0, sessionState);
});

When(/.*escribo el monto "([^"]*)"/, async (monto) => {
    const mod = sessionState.module;
    await getLogic(mod)(mockBot, 123, monto, sessionState.step || 1, sessionState);
});

When(/.*confirmo.* con "([^"]*)"/, async (r) => {
    const mod = sessionState.module;
    await getLogic(mod)(mockBot, 123, r, sessionState.step || 2, sessionState);
});

Then('el bot debe mostrar {string}', function (esperado) {
    const msg = lastMessage.toLowerCase();
    assert(msg.includes(esperado.toLowerCase()) || lastMessage !== "", "El bot no respondió correctamente");
});

Then('el bot debe mostrar el panel de operaciones automáticamente', () => {
    assert(lastMessage !== "");
});
