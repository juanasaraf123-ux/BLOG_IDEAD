# Manual de administración — Panel privado del IDEAD

Acceso: `https://<dominio>/admin` (enlace «Funcionarios» del portal). El menú lateral muestra solo las opciones permitidas para su rol.

## 1. Acceso y seguridad de la cuenta

- **Iniciar sesión** con correo y contraseña. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.
- **Verificación en dos pasos**: *Mi cuenta → Configurar*. Escanee el código QR con una aplicación autenticadora e ingrese el código de 6 dígitos. Si el IDEAD lo exige, el panel no se habilita hasta configurarla.
- **¿Olvidó su contraseña?** en la pantalla de acceso envía un enlace válido por 60 minutos.
- **Cambiar contraseña** en *Mi cuenta* (mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos).
- Cierre siempre la sesión con **Salir** en equipos compartidos.

## 2. Roles

| Rol | Puede |
|---|---|
| **Director del IDEAD** | Consultar todo lo interno, revisar y aprobar lotes de datos, publicar indicadores, contenidos y fichas, editar la ficha técnica de los indicadores (metodología y autorización), ver documentos internos, restringidos y financieros, informes y auditoría |
| **Administración documental** | Cargar, clasificar, versionar y archivar documentos; gestionar convenios |
| **Caja menor** | Registrar presupuestos, gastos y facturas; cargar soportes financieros; informe de caja menor |
| **Comunicaciones** | Crear y editar noticias, actividades, multimedia y páginas; carrusel, cifras destacadas y equipo. Publica **previa aprobación** de un revisor |
| **Coordinador / responsable** | Registrar e importar datos de los indicadores **de sus dependencias**, enviarlos a revisión; editar CAT, programas, oferta, proyectos y listados |
| **Administrador técnico** | Usuarios, roles, permisos, catálogos, configuración y auditoría. **No** ve documentos financieros ni restringidos ni datos de indicadores |

Los roles son configurables en *Roles y permisos*; nadie puede modificar sus propios roles.

## 3. Registrar datos de un indicador (coordinadores)

1. *Catálogo de indicadores* → abra el indicador (use «Solo mis dependencias»).
2. **Nueva carga de datos**. Opciones:
   - **Manual**: *Agregar fila*, elija período y, si aplica, programa/CAT/departamento/categoría; deje «(total)» para el valor total. *Guardar valores*.
   - **Importar Excel/CSV**: descargue la **Plantilla** (incluye instrucciones y códigos válidos), complétela y use *Importar*. El sistema valida cada fila (período existente, valor numérico, porcentajes ≤ 100, desagregaciones admitidas, filas repetidas) e informa la fila con error.
3. **Enviar a revisión**. El lote queda bloqueado para edición.
4. Si se **devuelve**, aparece el comentario del revisor; corrija y vuelva a enviar.

Para corregir datos ya publicados: en la ficha del indicador use **Corregir** sobre el lote publicado; se crea un lote nuevo que, al publicarse, reemplaza al anterior (el anterior se conserva en el historial).

## 4. Revisar y publicar (Director o revisor)

*Inicio* muestra los pendientes. En *Cargas de datos* abra el lote **Enviado**:
- **Aprobar** o **Devolver** (con comentario obligatorio). Quien registró el lote no puede aprobarlo.
- En el lote **Aprobado**: **Publicar en el portal**. Al publicar se reservan automáticamente las cifras pequeñas (por debajo del umbral *k*) en los indicadores agregados.
- **Retirar del portal** si hay un error grave.

En la ficha técnica del indicador el Director registra la **metodología** (y la marca como *Validada*) y la **autorización de publicación** de indicadores sensibles.

## 5. Contenidos (Comunicaciones)

Noticias, Actividades, Multimedia y Páginas siguen el flujo **Borrador → Enviar a revisión → Aprobar y publicar** (o **Devolver**). Una fecha de publicación futura programa el contenido. *Despublicar* lo retira. El HTML se limpia automáticamente al guardar (no se permiten scripts). Las fotografías solo se publican si se marca la **autorización de uso de imagen**. Cada registro tiene **Historial de cambios**.

*Cifras destacadas* del inicio se conectan a un indicador o a un conteo de registros publicados: nunca se escriben a mano.

## 6. Fichas institucionales

- **CAT**: datos de contacto, horarios, historia, fotografía, sedes, espacios y capacidad, línea de tiempo y municipios atendidos. Las coordenadas aparecen en el mapa solo si se marcan como *verificadas*; el responsable solo si su publicación está *autorizada*. Publica el Director.
- **Programas** y **Oferta por CAT** (por período, cupos y si recibe estudiantes nuevos).
- **Proyectos** y **Avances** (cada reporte actualiza el avance y conserva la serie).
- **Listados institucionales**: grupos y semilleros, plataformas digitales (TuAula, CloudLabs), formación continua, opciones de grado, hitos, servicios de bienestar.
- **Convenios**: solo los marcados como públicos aparecen en el portal.

## 7. Documentos

*Documentos → Cargar documento*: título, categoría, confidencialidad (Público, Interno, Restringido, Financiero), dependencia y archivo (PDF, Word, Excel, PowerPoint, ODF, CSV, JPG, PNG; tamaño máximo configurable). Se rechazan ejecutables y archivos cuyo contenido no coincide con su extensión. **Nueva versión** conserva las anteriores. Toda descarga de documentos no públicos queda en la auditoría. Solo los documentos *Público* y *Vigente* se pueden descargar en el portal.

## 8. Caja menor

Primero cargue la factura o soporte en *Documentos* con confidencialidad *Financiero*; luego registre el gasto en *Caja menor: gastos* y asócielo. El presupuesto muestra el valor gastado. *Informes → Informe de caja menor* exporta a Excel.

## 9. Informes

*Informes → Informe interno de indicadores*: por módulo, período, CAT o programa, en Excel o CSV. Incluye datos aprobados aún no publicados y respeta su rol (el módulo financiero requiere permiso financiero; los coordinadores solo exportan sus dependencias). Para PDF use «Imprimir / PDF» en el módulo del portal.

## 10. Administración técnica

- **Usuarios**: crear, asignar roles y dependencias, desactivar (no se borran, para conservar la trazabilidad), restablecer 2FA.
- **Roles y permisos**: 35 permisos independientes agrupados.
- **Catálogos**: períodos, dependencias, fuentes (con estado de validación del nombre oficial), clasificadores y categorías («Variable: valor» agrupa distribuciones), territorio, niveles, áreas, categorías documentales.
- **Configuración**: contacto, logotipo oficial, enlaces, tamaño máximo de archivos, umbral *k*, exigir 2FA, revisión obligatoria de contenidos.
- **Auditoría**: filtros por acción y fechas (`auth.login`, `auth.failed`, `indicator.publish`, `document.download`, `user.roles_changed`, `report.export`…).
