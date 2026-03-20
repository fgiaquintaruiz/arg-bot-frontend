export const PRIVACY_TEXT = `Políticas de Privacidad - ARGBOT
Última actualización: Marzo 2026

1. Compromiso de Privacidad
En ARGBOT, valoramos y respetamos tu privacidad. Diseñamos nuestra arquitectura tecnológica desde cero para minimizar la cantidad de datos personales que recopilamos y procesamos. Esta Política explica cómo manejamos tu información cuando utilizás nuestra Plataforma de automatización de transferencias internacionales.

2. Información que Recopilamos
- Datos de Autenticación (Google Login): Al iniciar sesión, utilizamos Firebase Authentication (proveído por Google). Recopilamos únicamente tu dirección de correo electrónico, nombre público y foto de perfil proporcionados por tu cuenta de Google. No creamos ni almacenamos contraseñas adicionales.
- Claves de API de Binance (Datos en Tránsito): La Plataforma te solicita una "API Key" y un "API Secret" de Binance para operar. Estos datos se almacenan exclusivamente de forma local en el navegador de tu dispositivo (localStorage). 
- Datos de Uso: Podemos recopilar de forma anónima información técnica estándar, como tu dirección IP, tipo de navegador y la fecha/hora de acceso, con el único fin de garantizar la seguridad y estabilidad del servicio web.

3. Lo que NO hacemos con tus datos
- NO guardamos tus claves de API de Binance en ninguna base de datos propia. Cuando ejecutás una operación, tu navegador envía estas claves a nuestro servidor de backend a través de una conexión segura (HTTPS), el servidor ejecuta la instrucción en Binance, y descarta las claves de su memoria.
- NO comercializamos, vendemos, alquilamos ni cedemos tus datos personales, correo electrónico ni historial de operaciones a terceros para fines publicitarios o comerciales.
- NO tenemos acceso a tus fondos, contraseñas bancarias ni métodos de pago.

4. Uso de la Información
Utilizamos la información recopilada exclusivamente para:
- Autenticar tu identidad y darte acceso a tu panel personal.
- Ejecutar de forma automatizada las órdenes de cálculo, compra y retiro que vos mismo iniciás en la Plataforma.
- Comunicarnos con vos en caso de actualizaciones críticas del sistema o cambios en estas políticas.

5. Proveedores de Servicios de Terceros
Para que ARGBOT funcione, nos apoyamos en infraestructura de terceros de primer nivel, los cuales tienen sus propias políticas de privacidad:
- Google (Firebase): Para el sistema de inicio de sesión y validación de tokens.
- Render: Para el alojamiento (hosting) de nuestro servidor y sitio web.
- Binance: A través de su API oficial, procesamos las operaciones financieras que ordenás.
- Buenbit by Nexo: Consultamos su API pública de forma anónima para obtener el tipo de cambio actualizado.

6. Seguridad
Implementamos medidas de seguridad estándar de la industria para proteger el tránsito de la información, forzando el uso de conexiones encriptadas (SSL/HTTPS) en todo momento. Sin embargo, recordá que ningún sistema de transmisión por Internet es 100% invulnerable. Sos responsable de mantener la seguridad del dispositivo desde el cual accedés a ARGBOT, ya que tus claves de API se guardan en el mismo.

7. Tus Derechos
Como usuario, tenés el derecho en todo momento a:
- Borrar tus datos de conexión cerrando sesión ("Salir") en la aplicación.
- Eliminar tus API Keys del almacenamiento de tu dispositivo, simplemente borrándolas desde el panel de "API Binance" o limpiando el caché/localStorage de tu navegador.
- Revocar el acceso de ARGBOT a tu cuenta de Google desde el panel de seguridad de tu cuenta de Google.

Si tenés dudas sobre esta política o el tratamiento de tus datos, los canales de contacto de los desarrolladores de la plataforma están a tu disposición.`;