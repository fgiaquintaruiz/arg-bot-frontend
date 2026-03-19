Feature: Calculadora de Pesos a Euros
  Scenario: Cálculo exitoso de ARS a EUR
    Given el bot está en el panel principal
    And el precio de EUR-USDC es "1.10"
    When ingreso al flujo de calculadora con el comando "1"
    And escribo el monto "147000" ARS
    Then el bot debe mostrar "Para cubrir"
    And el bot debe mostrar "Tasa Binance"

  Scenario: Error al obtener cotizaciones
    Given el bot está en el panel principal
    And Binance no responde a la consulta de precios
    When ingreso al flujo de calculadora con el comando "1"
    And escribo el monto "50000" ARS
    Then el bot debe mostrar "Error al obtener cotizaciones"
