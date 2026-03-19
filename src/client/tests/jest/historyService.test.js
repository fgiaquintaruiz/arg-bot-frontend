const { logTransaction, getHistory } = require('../server_app/server/historyService');
test('Should log and retrieve transaction', () => {
  logTransaction('test@test.com', 'TEST_TYPE', { foo: 'bar' });
  const h = getHistory();
  expect(h.length).toBeGreaterThan(0);
  expect(h[h.length-1].user).toBe('test@test.com');
});
