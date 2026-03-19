Feature: Trade de EUR a USDC
  Scenario: Cambio exitoso de EUR a USDC
    Given el bot está en el panel principal
    And el precio de EUR-USDC es "1.08"
    When ingreso al flujo de trade con el comando "2"
    And confirmo la operación con "SI"
    Then el bot debe mostrar "Conversión Exitosa"
    And el bot debe mostrar el panel de operaciones automáticamente
