# Configuración detallada del MCP de Metricool — Betrayer

## 1. Cuentas y accesos requeridos (detalle completo)

| Cuenta | Requisito exacto | Cómo verificarlo | Quién debe tener acceso |
|---|---|---|---|
| **Metricool** | Cuenta propia, cualquier plan (Free alcanza para 1 marca con límites de posts/mes) | Login en metricool.com | Tú (o quien administre las redes de la banda) |
| **Instagram @betrayer_chile** | Cuenta **Business o Creator** (no personal) | Instagram → Configuración → Cuenta → debe decir "Cuenta profesional" activa | Debe estar vinculada a la Página de Facebook |
| **Facebook — Página betrayerbanda** | Debe ser **Página**, no perfil personal | Meta Business Suite → Configuración → Páginas | Necesitas rol **Admin o Editor** en esa página |
| **Vínculo Instagram↔Facebook** | La cuenta de Instagram debe estar linkeada a la Página, no a un perfil personal de Facebook | Meta Business Suite → Cuentas de Instagram → debe listar @betrayer_chile bajo la Página | Se configura una sola vez desde Meta, no desde Metricool |
| **YouTube** (opcional) | Cuenta de Google dueña o con acceso de gestor al canal de Betrayer | YouTube Studio → Configuración → Permisos | Solo si decides programar/analizar ahí también |
| **Bandcamp / WhatsApp** | No aplican — Metricool no se conecta a estas | — | Se mantienen manuales, solo se referencian en captions/links |

**Por qué importa el orden:** Metricool lee los permisos de Meta (Facebook/Instagram) tal cual estén configurados ahí. Si Instagram no es Business/Creator o no está vinculada a la Página correcta, la conexión en Metricool se ve "exitosa" pero luego falla al intentar publicar o leer métricas — por eso hay que resolver esto en Meta primero, no como parche después.

## 2. Conectar las redes en Metricool (paso a paso, una sola vez)

1. Crea/inicia sesión en metricool.com.
2. Crea una marca llamada **Betrayer** (Settings → Brands → Add brand).
3. Ve a **Conexiones → Añadir red social → Facebook**. Inicia sesión con la cuenta que tiene rol Admin/Editor en la Página betrayerbanda y autoriza los permisos que pida Meta (gestión de páginas, publicación, lectura de insights).
4. Ve a **Añadir red social → Instagram**. Si el vínculo Instagram↔Facebook ya está bien hecho en Meta, Metricool detecta automáticamente @betrayer_chile — solo confirmas.
5. (Opcional) Repite para YouTube con la cuenta de Google del canal.
6. Verifica que las tres muestren ícono verde "Conectado". Si alguna queda en amarillo/gris, revisa el paso de vínculo en Meta Business Suite antes de seguir.

## 3. Configurar el servidor MCP en Antigravity

1. Abre Antigravity → panel **Agent** → botón "..." (Additional Options).
2. **MCP Servers → Manage MCP Servers → View raw config** → abre `~/.gemini/config/mcp_config.json`.
3. Agrega dentro de `"mcpServers"`:
```json
"metricool": {
  "url": "https://ai.metricool.com/mcp",
  "type": "http"
}
```
4. Guarda el archivo.
5. En la sección MCP de Antigravity, Metricool aparece como "no autenticado" → clic en **Connect**.
6. Se abre el navegador pidiendo login en Metricool (la misma cuenta del paso 2) y consentimiento de permisos: ver/gestionar marcas, ver y descargar métricas, ver/crear/publicar posts (programados y ya publicados).
7. Autoriza. Antigravity debe mostrar el servidor como conectado.

**Nota de seguridad:** estos permisos son equivalentes a iniciar sesión directamente en tu cuenta de Metricool — puede publicar en tus redes reales. Autoriza solo si confías en el flujo que vas a correr, y puedes revocar el acceso en cualquier momento desde Metricool → Configuración → Aplicaciones conectadas, o desde el propio Antigravity quitando el servidor del config.

## 4. Tools disponibles del MCP y para qué sirve cada una

| Tool | Uso en este proyecto |
|---|---|
| `getBrandSettings` | Confirmar que la marca Betrayer existe y qué redes están activas. Ejecutar siempre primero. |
| `getBestTimeToPostByNetwork` | Obtener el mejor horario sugerido por red antes de programar cada post — reemplaza los horarios "sugeridos" de este documento si Metricool tiene datos reales de tu audiencia. |
| `createScheduledPost` | Programar cada post individualmente (texto + red + fecha/hora + asset). |
| `getScheduledPosts` | Verificar después de cada `createScheduledPost` que quedó bien agendado, y revisar qué hay pendiente antes de agregar más. |
| `updateScheduledPost` | Editar un post ya programado (cambiar texto, hora o asset) sin tener que borrarlo y crearlo de nuevo. |
| `getAnalyticsAvailableMetrics` | Ver qué métricas están disponibles por red (alcance, guardados, interacciones, etc.) antes de pedir un reporte. |
| `getAnalyticsDataByMetrics` | Traer los números reales después de que los posts ya se publicaron — usar al cerrar cada ciclo de canción para decidir qué formato repetir. |

**Flujo recomendado para el agente en cada ciclo de canción:**
`getBrandSettings` → `getBestTimeToPostByNetwork` (por cada red) → `createScheduledPost` (uno por uno) → `getScheduledPosts` (verificar) → esperar a que se publiquen → `getAnalyticsDataByMetrics` (medir) → decidir ajustes para el siguiente ciclo.

## 5. Verificación final antes de programar contenido real

- `getBrandSettings` debe devolver la marca Betrayer con Instagram, Facebook (y YouTube si aplica) como activas — sin esto, no continuar.
- `getScheduledPosts` debe responder sin error de autenticación (vacío está bien si no hay nada programado aún).
- Programar un post de prueba a una hora lejana (ej. dentro de 2 semanas) con texto simple, confirmarlo con `getScheduledPosts`, y luego borrarlo/editarlo — esto confirma que el flujo completo funciona antes de meter el ciclo real de Sobek.

## 6. Troubleshooting común

| Problema | Causa probable | Solución |
|---|---|---|
| Metricool conectado pero falla al publicar en Instagram | Cuenta no es Business/Creator, o no está vinculada a la Página correcta | Resolver en Meta Business Suite, reconectar la red en Metricool |
| Antigravity muestra Metricool como "no autenticado" tras guardar el config | Falta completar el paso OAuth en el navegador | Repetir clic en "Connect" y completar login/consentimiento |
| `createScheduledPost` da error de permisos | El usuario que autorizó el MCP no tiene rol de Admin/Editor en la Página de Facebook | Verificar roles en Meta Business Suite, volver a autorizar con la cuenta correcta |
| Los datos de `getAnalyticsDataByMetrics` vienen vacíos | Se está consultando antes de que el post se publique, o la red no está en el plan de Metricool que da acceso a esa métrica | Esperar a que el post esté publicado (no solo programado); revisar límites del plan Free si aplica |

## 7. Checklist final

- [ ] Instagram @betrayer_chile es cuenta Business/Creator
- [ ] Está vinculada a la Página de Facebook betrayerbanda en Meta Business Suite
- [ ] Tienes rol Admin/Editor en esa Página
- [ ] Las tres redes (o las que apliquen) muestran "Conectado" en Metricool
- [ ] El MCP aparece conectado en Antigravity tras el paso OAuth
- [ ] Post de prueba programado y verificado con `getScheduledPosts`
