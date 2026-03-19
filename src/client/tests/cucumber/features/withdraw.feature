Feature: Retiro de Fondos
  Como usuario del bot
  Quiero retirar mis USDC a Buenbit

  Scenario: Retiro exitoso después de configurar dirección
    Given el bot está en el panel principal
    And tengo una dirección de Buenbit configurada como "0x123456789"
    When ingreso al flujo de retiro con el comando "3"
    And escribo el monto "50"
    And confirmo con "SI"
    Then el bot debe mostrar "Retiro enviado correctamente"
    And el bot debe mostrar el panel de operaciones automáticamente

  Scenario: Intento de retiro con saldo insuficiente
    Given el bot está en el panel principal
    And tengo una dirección de Buenbit configurada como "0x123456789"
    And Binance reportará un error de "insufficient balance"
    When ingreso al flujo de retiro con el comando "3"
    And escribo el monto "1000000"
    And confirmo con "SI"
    Then el bot debe mostrar "insufficient balance"
    And el bot debe mostrar el panel de operaciones automáticamente
