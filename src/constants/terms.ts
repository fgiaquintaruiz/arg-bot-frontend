export const TERMS_TEXT = `Términos y Condiciones de Uso - ARGBOT
Última actualización: Marzo 2026

1. Introducción y Marco Legal
Bienvenido a ARGBOT. Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma web ("la Plataforma"). Al acceder, conectar tu cuenta de Google o utilizar nuestros servicios de automatización, aceptás estar legalmente vinculado por estos Términos. 

ARGBOT es una interfaz de software independiente diseñada para automatizar operaciones en el mercado criptográfico. NO SOMOS UNA INSTITUCIÓN FINANCIERA, BANCARIA NI UN PROVEEDOR DE SERVICIOS DE PAGO (PSP). No realizamos intermediación financiera, captación de ahorros ni ofrecemos asesoramiento de inversión. 

2. Naturaleza del Servicio (Non-Custodial)
ARGBOT funciona estrictamente bajo una arquitectura "Non-Custodial" (Sin Custodia). En ningún momento recibimos, almacenamos, retenemos ni tomamos control de tus fondos en moneda fiduciaria (Euros, Pesos, etc.) ni de tus activos virtuales (USDC, BTC, etc.). 
Toda la operatoria de compra, venta y transferencia ocurre exclusivamente dentro de tu propia cuenta personal de Binance. ARGBOT actúa únicamente como un "control remoto" que ejecuta instrucciones pre-programadas utilizando las claves de API que vos mismo proporcionás.

3. Requisitos y Reglas de Operatoria
Para utilizar ARGBOT, declarás y garantizás que:
- Sos mayor de 18 años y tenés capacidad legal para contratar.
- Poseés una cuenta activa y verificada a tu nombre en Binance.
- Comprendés que los depósitos de Euros en tu cuenta de Binance deben realizarse exclusivamente mediante transferencias SEPA. No se admiten transferencias SWIFT.
- El nombre del titular de la cuenta bancaria desde donde enviás los fondos coincide exactamente con el nombre registrado en tu cuenta de Binance.

4. Gestión de API Keys y Seguridad
El uso del servicio requiere que generes credenciales ("API Key" y "API Secret") en Binance con permisos limitados a: "Lectura", "Spot & Margin Trading" y "Retiros". 
- Almacenamiento Local: Tus credenciales se guardan de forma encriptada únicamente en el almacenamiento local de tu dispositivo (localStorage). Nuestro servidor procesa las credenciales en tránsito para ejecutar las órdenes, pero no las almacena en ninguna base de datos propia.
- Whitelist (Lista Blanca): Es tu responsabilidad exclusiva y obligatoria configurar la Lista Blanca de IP en Binance, habilitando únicamente la dirección IP de nuestro servidor (proporcionada en la Plataforma) y limitando las direcciones de retiro a tus propias billeteras personales.

5. Independencia Corporativa
ARGBOT es una herramienta de desarrollo independiente. No tenemos ninguna afiliación corporativa, patrocinio, asociación ni acuerdo comercial con Binance, Nexo, Lemon, Remitly, Western Union ni ninguna otra marca mencionada en la Plataforma. Las cotizaciones se obtienen de la API pública de Nexo a fines meramente informativos y de cálculo.

6. Exención y Limitación de Responsabilidad (Cláusula "As-Is")
El servicio se proporciona "tal cual" (As-Is) y "según disponibilidad". ARGBOT y sus desarrolladores no asumen responsabilidad alguna por:
- Pérdidas financieras derivadas de fluctuaciones y volatilidad del mercado criptográfico durante la ejecución de las operaciones.
- Errores introducidos por el usuario al proporcionar direcciones de retiro (ej. seleccionar una red incorrecta como enviar USDC por una red distinta a BEP20/BSC). Las transacciones en la blockchain son irreversibles.
- Bloqueos, suspensiones, retenciones de fondos o congelamientos de cuentas aplicados por Binance o tu exchange local (ej. Nexo, Lemon).
- Caídas del servicio de Binance, de las APIs de cotización, congestión de la red blockchain o indisponibilidad de nuestros servidores en Render.
- Accesos no autorizados a tus dispositivos personales que comprometan tus API Keys.

7. Modificaciones y Jurisdicción
Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios entrarán en vigor en el momento de su publicación en la Plataforma. El uso continuado del servicio implicará tu aceptación de los nuevos términos.`;