# Matriz de correspondencia: indicadores ↔ módulos del portal

Generada directamente desde `docs/referencias/Indicadores_Sugeridos.xlsx` (hoja `Hoja1`, 13 apartados, **76 indicadores**). Ningún registro del Excel fue omitido. Versión tabular reutilizable (servirá como semilla del catálogo de indicadores): [`matriz-indicadores.csv`](matriz-indicadores.csv).

**Convenciones**

- **Código**: `Mxx-Iyy` = módulo xx, indicador yy (orden del Excel). Será la clave estable del indicador en la base de datos.
- **Publicación**: `PUB` público · `AGR` público solo agregado, con supresión de celdas pequeñas · `AGR-S` agregado de datos sensibles (requiere autorización expresa antes de publicarse) · `MIX` ficha/cifras públicas con soportes o campos restringidos en el panel privado.
- **Metodología**: en todos los casos queda *Pendiente de validación* hasta que la dependencia responsable entregue la definición y fórmula oficiales (regla 8 del prompt: no se calculan indicadores sin definición institucional).
- La columna *Fuente (Excel)* se transcribe literalmente; las abreviaturas se explican en el glosario del diagnóstico.


## Módulo 1. Oferta académica y acceso — ruta `/oferta-academica` (6 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M01-I01 | Oferta de programas académicos | Programas de pregrado y posgrado que oferta el IDEAD, por nivel de formación y área de conocimiento | Cifras destacadas y listado de programas | KPI + listado filtrable | Nivel, Área | Página web | PUB | Área de conocimiento: definir clasificación (NBC SNIES / CINE-F) — validar con DARCA/SAIDEAD. |
| M01-I02 | Programas disponibles por CAT | Programas disponibles en cada CAT, diferenciando los que reciben estudiantes nuevos de los que solo tienen cohortes en curso | Tabla consultable | Tabla consultable + mapa | CAT, Depto, Nivel, Programa | Página web y BD Matriculados | PUB | Definir regla institucional de 'recibe estudiantes nuevos' vs. 'solo cohortes en curso'. |
| M01-I03 | Cupos de primer ingreso | Cupos aprobados para nuevos estudiantes por semestre, programa y CAT | Barras o evolución histórica | Barras + evolución (líneas) | Semestre, Programa, CAT | BD matriculados comparando | PUB | Fuente en Excel: 'BD matriculados comparando'. Aclarar si los cupos aprobados provienen de acuerdos del CDIDEAD. |
| M01-I04 | Inscripción, admisión e ingreso | Aspirantes inscritos, admitidos y nuevos matriculados por semestre | Barras comparativas | Barras agrupadas (inscritos/admitidos/matriculados) | Semestre, Programa, CAT, Nivel | DARCA | PUB |  |
| M01-I05 | Indicadores de acceso y ocupación de cupos | Relación entre admitidos e inscritos, y entre estudiantes nuevos y cupos aprobados | Porcentajes o cifras destacadas | KPI porcentuales | Semestre, Programa, CAT | DARCA | PUB | Fórmulas propuestas (admitidos/inscritos; nuevos/cupos) PENDIENTES de validación por DARCA. |
| M01-I06 | Evolución y proyección de la oferta | Evolución de la oferta, nuevas cohortes y reapertura de programas o CAT; programas proyectados para futuras ofertas | Línea de tiempo y listado | Línea de tiempo + listado | Año, Programa, CAT | Acuerdos | PUB | Programas 'proyectados' solo si están aprobados por acto administrativo. |

## Módulo 2. Estudiantes y matrícula — ruta `/estudiantes` (8 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M02-I01 | Matrícula total | Total de estudiantes matriculados, diferenciado entre pregrado y posgrado | Cifra destacada y barras | KPI + barras | Semestre, Nivel, Programa, CAT | BD matriculados | PUB | Definir fecha de corte y tipo de matrícula (académica/financiera). |
| M02-I02 | Evolución de la matrícula | Evolución de la matrícula y su crecimiento o disminución por semestre | Gráfico de líneas | Líneas con variación % | Semestre, Nivel, Programa, CAT | BD matriculados | PUB |  |
| M02-I03 | Distribución de estudiantes | Estudiantes por programa, CAT, municipio y departamento | Barras, tabla o mapa | Barras + tabla + mapa coroplético | Semestre, Programa, CAT, Municipio, Depto | BD matriculados | AGR |  |
| M02-I04 | Estudiantes nuevos | Estudiantes nuevos por semestre y proporción frente al total de matriculados | Barras y porcentaje | Barras + porcentaje | Semestre, Programa, CAT | BD matriculados | PUB |  |
| M02-I05 | Perfil sociodemográfico estudiantil | Caracterización: sexo, edad, estado civil, estrato y zona de residencia (rural o urbana) | Barras o distribución porcentual | Distribución porcentual (barras 100 %) | Semestre, Nivel, Programa, CAT | BD matriculados | AGR | Supresión de celdas pequeñas (umbral k a definir). |
| M02-I06 | Procedencia y avance académico | Estudiantes que viven en el mismo municipio del CAT o en otros municipios; semestre cursado | Barras comparativas | Barras comparativas | Semestre, Programa, CAT | BD matriculados | AGR |  |
| M02-I07 | Caracterización poblacional | Caracterización poblacional agregada: comunidades étnicas, discapacidad, víctimas y otras poblaciones registradas (Especial protección constitucional) | Barras o tabla agregada | Barras / tabla agregada | Semestre, Nivel, CAT | BD matriculados | AGR-S | Datos sensibles (Ley 1581/2012). Solo agregados con supresión; publicar víctimas/discapacidad requiere autorización expresa. |
| M02-I08 | Desempeño académico y representación estudiantil | Promedios académicos generales y número de representantes estudiantiles por programa o CAT | Cifras y tablas | KPI + tabla | Semestre, Programa, CAT | BD matriculados, BD representantes, Acuerdo CDIDEAD / Resolución | AGR | Promedios de grupos pequeños pueden identificar personas. Representantes: publicar número; nombres solo si el acto es público. |

## Módulo 3. Permanencia y resultados académicos — ruta `/permanencia` (5 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M03-I01 | Continuidad estudiantil | Estudiantes que continúan matriculados de un semestre a otro; evolución de la permanencia | Gráfico de líneas | Líneas | Semestre, Nivel, Programa, CAT | BD matriculados | PUB | Fórmula de tasa de continuidad PENDIENTE de validación. |
| M03-I02 | Deserción y no continuidad | Deserción y estudiantes que dejan de matricularse (no contar los graduados y egresados) (abandono o interrupción, Deserción, Movilidad, Pérdida condición estudiante) | Líneas o barras | Barras apiladas por tipo + líneas | Semestre, Nivel, Programa, CAT | BD matriculados | PUB | Excluir graduados y egresados. Tipos: abandono/interrupción, deserción, movilidad, pérdida de calidad de estudiante. Metodología (institucional vs. SPADIES) PENDIENTE. |
| M03-I03 | Reintegros y condiciones para graduarse | Reintegros y estudiantes con requisitos pendientes para graduarse, con motivos agregados cuando estén disponibles | Barras y tabla | Barras + tabla | Semestre, Programa, CAT | BD matriculados y SAIDEAD | AGR |  |
| M03-I04 | Resultados de pruebas de Estado | Resultados históricos de las pruebas Saber Pro y Saber TyT, con consulta por programa y CAT | Líneas comparativas | Líneas comparativas | Año, Nivel, Programa, CAT | ICFES | PUB | Verificar condiciones de uso/publicación de resultados ICFES por programa y CAT. |
| M03-I05 | Opciones y trabajos de grado | Opciones de grado utilizadas y trabajos de grado aprobados | Barras o tabla | Barras / tabla | Año, Semestre, Programa | Acuerdo 015 de 2008 CDIDEAD y DP / SAIDEAD | PUB | Catálogo de opciones según Acuerdo 015 de 2008 CDIDEAD — verificar vigencia. |

## Módulo 4. Docentes — ruta `/docentes` (8 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M04-I01 | Docentes por tipo de vinculación | Número de docentes por semestre y modalidad de vinculación, diferenciando profesores de carrera y catedráticos | Cifras destacadas y barras | KPI + barras | Semestre, CAT, Programa | BD departamentos | PUB |  |
| M04-I02 | Evolución del cuerpo docente | Evolución de docentes de planta y de cátedra en el tiempo | Gráfico de líneas | Líneas (planta vs. cátedra) | Semestre | Departamentos | PUB |  |
| M04-I03 | Distribución y formación docente | Docentes por CAT, programa y nivel máximo de formación (profesional, especialización, maestría o doctorado) | Barras o tabla | Barras / tabla | Semestre, CAT, Programa | BD departamentos | AGR |  |
| M04-I04 | Perfil y trayectoria docente | Caracterización general por sexo o género y rangos de edad; categoría y antigüedad de docentes de carrera | Barras | Barras | Semestre | BD departamentos | AGR | Categoría y antigüedad solo para docentes de carrera; supresión de celdas pequeñas. |
| M04-I05 | Asignación y carga académica | Cursos asignados y distribución de carga académica | Barras y cifras | Barras + KPI | Semestre, Programa, CAT | BD departamentos | AGR | No publicar carga individual. |
| M04-I06 | Relación estudiantes-docentes | Relación entre estudiantes matriculados y docentes, con distinción de tipo de vinculación | Cifra o tabla comparativa | KPI / tabla comparativa | Semestre, Programa, CAT | BD departamentos y BD matriculados | PUB | Definir si la relación es por personas o por tiempo completo equivalente (TCE). |
| M04-I07 | Participación docente en investigación | Docentes participantes en grupos de investigación, semilleros, proyectos, eventos académicos y producción intelectual | Barras y cifras | Barras + KPI | Año, Programa, CAT | Departamentos, SAIDEAD y profesor Llanos | PUB | Fuente 'profesor Llanos' es una persona, no una dependencia: formalizar fuente institucional. |
| M04-I08 | Cualificación, bienestar y reconocimientos docentes | Docentes formados en seminarios o cursos (seminario de docencia), beneficiarios de convocatorias, bienestar (SNIES), estímulos y reconocimientos | Barras o tabla | Barras / tabla | Año | Departamentos e Informe SNIES | AGR |  |

## Módulo 5. Graduados — ruta `/graduados` (6 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M05-I01 | Graduados y títulos otorgados | Número histórico de personas graduadas y cantidad de títulos otorgados; presentar ambos datos por separado | Dos cifras destacadas | Dos KPI separados (personas / títulos) | Año, Semestre, Nivel, Programa | SGUT, SAIDEAD y Oficina de Graduados | PUB | Personas únicas ≠ títulos otorgados. |
| M05-I02 | Evolución de la graduación | Graduados por año o semestre y evolución histórica | Gráfico de líneas | Líneas | Año, Semestre, Nivel, Programa | SGUT, SAIDEAD y Oficina de Graduados | PUB |  |
| M05-I03 | Distribución de graduados | Graduados por programa, nivel de formación, área de conocimiento, CAT y departamento | Barras y mapa | Barras + mapa | Año, Nivel, Programa, Área, CAT, Depto | SGUT, SAIDEAD y Oficina de Graduados | AGR |  |
| M05-I04 | Perfil de los graduados | Caracterización por sexo o género y promedio académico final | Barras o distribución | Distribución porcentual | Año, Nivel, Programa | SGUT, SAIDEAD y Oficina de Graduados | AGR |  |
| M05-I05 | Trayectoria académica y laboral | Graduación por cohorte, tiempo hasta obtener el título y seguimiento laboral o de emprendimiento, cuando existan datos | Líneas y barras | Líneas + barras por cohorte | Cohorte, Programa | SGUT, SAIDEAD y Oficina de Graduados | AGR | Seguimiento laboral solo si existen datos (posible fuente externa: OLE-MEN, por validar). |
| M05-I06 | Participación de graduados en la vida institucional | Participación de graduados en eventos, bienestar y actividades institucionales | Cifras o barras | KPI / barras | Año | SAIDEAD, Oficina de Graduados e informe SNIES | PUB |  |

## Módulo 6. Personal administrativo — ruta `/personal-administrativo` (5 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M06-I01 | Personal administrativo y contratistas | Total de personal administrativo vinculado al IDEAD y contratistas de prestación de servicios, informados por separado | Cifras y barras | KPI + barras (planta vs. contratistas) | Año, Semestre | CRIDEAD | PUB |  |
| M06-I02 | Vinculación y funciones administrativas | Personal por tipo de vinculación, cargo, grado, función y dependencia | Barras o tabla | Barras / tabla | Año, Dependencia | CRIDEAD | AGR | No publicar cargos unipersonales que identifiquen a la persona. |
| M06-I03 | Distribución territorial del personal | Distribución del personal por CAT y departamento | Tabla o mapa | Tabla / mapa | Año, CAT, Depto | CRIDEAD | AGR |  |
| M06-I04 | Perfil del personal administrativo | Caracterización por sexo o género, edad, nivel de formación y antigüedad | Barras | Barras | Año | CRIDEAD | AGR |  |
| M06-I05 | Evolución y desarrollo del personal | Evolución del personal y participación en capacitaciones o actividades de bienestar | Líneas y barras | Líneas + barras | Año | CRIDEAD e Informe SNIES | PUB |  |

## Módulo 7. CAT e infraestructura — ruta `/cat` (7 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M07-I01 | Cobertura territorial de los CAT | Número de CAT con actividad académica y su distribución por municipio y departamento | Cifras y mapa de Colombia | KPI + mapa de Colombia | Depto, Municipio | CRIDEAD | PUB | Requiere coordenadas verificadas de cada CAT. |
| M07-I02 | CAT y sedes de funcionamiento | Listado de CAT y sedes físicas utilizadas, indicando el carácter público, privado o propio de cada sede | Tabla y mapa | Tabla + mapa | Depto, Municipio, Tipo de sede | CRIDEAD | PUB | Clasificación de sede: pública / privada / propia. |
| M07-I03 | Espacios físicos de apoyo académico | Cantidad de aulas, laboratorios, salas de cómputo, bibliotecas, auditorios y espacios deportivos o de bienestar por CAT | Tabla comparativa | Tabla comparativa | CAT, Depto | CRIDEAD | PUB |  |
| M07-I04 | Tecnología, conectividad y capacidad instalada | Equipos tecnológicos, conectividad y capacidad de los espacios académicos por CAT | Barras o tabla | Barras / tabla | CAT, Depto | CRIDEAD | PUB | No publicar detalles técnicos de red (riesgo de seguridad). |
| M07-I05 | Expansión de la red de CAT | Apertura, reactivación y evolución de la presencia de CAT en los territorios | Línea de tiempo | Línea de tiempo | Año, Depto | CRIDEAD | PUB |  |
| M07-I06 | Información institucional de cada CAT | Ficha informativa de cada CAT: breve historia, fotos autorizadas, ubicación, contactos, horarios, estructura y responsables | Ficha informativa | Ficha informativa /cat/:slug | — | CRIDEAD, Coordinadores, Actores Claves | MIX | Fotos y datos de responsables solo con autorización. Fuente incluye 'Actores claves' (no formalizada). |
| M07-I07 | Cifras integradas por CAT | Consulta integrada de programas, matrícula, docentes, graduados, bienestar y proyectos asociados a cada CAT | Resumen por CAT con tablas o gráficos | Resumen integrado en ficha CAT | Semestre, CAT | Información previamente recolectada | PUB | Se compone de valores ya publicados en otros módulos (no requiere carga propia). |

## Módulo 8. Bienestar universitario y TUIDEAD — ruta `/bienestar` (5 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M08-I01 | Beneficiarios de bienestar | Número de estudiantes, docentes, administrativos y graduados beneficiarios de bienestar; personas únicas y participaciones | Cifras y barras | KPI + barras por estamento | Año, Semestre, Estamento | Informe SNIES | AGR | Medir por separado personas únicas y participaciones. |
| M08-I02 | Cobertura territorial de bienestar | Beneficiarios de actividades de bienestar por programa, CAT y período | Barras o mapa | Barras / mapa | Semestre, Programa, CAT | Informe SNIES | AGR |  |
| M08-I03 | Servicios de Bienestar y TUIDEAD | Servicios y actividades de TUIDEAD: orientación, psicología, enfermería, CRAI, deporte, cultura y otras líneas vigentes | Cifras por tipo de servicio | KPI por tipo de servicio | Semestre, CAT, Servicio | TUIDEAD, Informes Operadores y Biblioteca | AGR-S | Psicología/enfermería: solo conteos agregados (datos de salud). |
| M08-I04 | Participación en actividades institucionales | Participación en actividades deportivas, culturales, Semana del IDEAD y otros eventos institucionales | Barras y evolución | Barras + evolución | Año, Semestre, CAT, Tipo de evento | CRIDEAD y TUIDEAD | PUB |  |
| M08-I05 | Apoyos y satisfacción con bienestar | Apoyos socioeconómicos, estímulos y nivel de satisfacción con los servicios | Barras o porcentajes | Barras / porcentajes | Semestre, CAT | Permanencia Estudiantes, TUIDEAD y CRIDEAD | PUB | Instrumento y escala de satisfacción PENDIENTES. |

## Módulo 9. Investigación y producción académica — ruta `/investigacion` (5 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M09-I01 | Grupos y semilleros de investigación | Grupos y semilleros de investigación con participación del IDEAD | Cifras y listado | KPI + listado | Año, Categoría | SAIDEAD y profesor Llanos | PUB |  |
| M09-I02 | Participación en investigación | Docentes y estudiantes participantes en grupos o semilleros, por programa y CAT | Barras | Barras | Año, Programa, CAT, Estamento | SAIDEAD, profesor Llanos, VICIEPS | AGR |  |
| M09-I03 | Proyectos de investigación | Proyectos de investigación desarrollados, vigentes y finalizados | Cifras y barras | KPI + barras por estado | Año, Estado | SAIDEAD, DP y VICIEPS | PUB |  |
| M09-I04 | Producción académica y creación | Producción académica: artículos, libros, capítulos, ponencias y productos de creación | Barras por tipo de producto | Barras por tipo de producto | Año, Tipo, Programa | SAIDEAD, PIDEAD, DP, CP, VICIEPS | PUB |  |
| M09-I05 | Investigación formativa y recursos | Trabajos de grado e investigación formativa, resultados de proyectos y recursos destinados a investigación | Tabla y cifras | Tabla + KPI | Año, Programa | SAIDEAD, PIDEAD, DP, CP, VICIEPS | MIX | Recursos financieros solo agregados. |

## Módulo 10. Extensión, proyección social y formación continua — ruta `/extension` (4 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M10-I01 | Proyectos de extensión y proyección social | Proyectos y actividades de extensión o proyección social realizados por el IDEAD | Cifras y barras | KPI + barras | Año, Estado, CAT | PSIDEAD | PUB |  |
| M10-I02 | Beneficiarios y cobertura territorial | Personas, comunidades, municipios y CAT beneficiados por dichas iniciativas | Cifras, mapa y barras | KPI + mapa + barras | Año, Municipio, Depto, CAT | PSIDEAD | PUB |  |
| M10-I03 | Oferta de formación continua | Diplomados, seminarios, cursos y actividades de formación continua ofrecidos | Listado y cifras | Listado + KPI | Año, Tipo | DP y ECIDEAD | PUB |  |
| M10-I04 | Participación y certificación en formación continua | Participantes y personas certificadas o graduadas en procesos de formación continua | Barras y evolución | Barras + líneas | Año, Tipo | DP y ECIDEAD | PUB | Participantes ≠ certificados. |

## Módulo 11. Gestión financiera — ruta `/gestion-financiera` (5 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M11-I01 | Presupuesto institucional | Presupuesto anual atribuido al IDEAD y su evolución histórica | Cifras y gráfico de líneas | KPI + líneas | Año (vigencia) | PRIDEAD | PUB |  |
| M11-I02 | Asignación y ejecución de recursos | Recursos asignados, comprometidos y ejecutados durante cada vigencia, según las cifras oficiales disponibles | Barras comparativas | Barras comparativas (asignado/comprometido/ejecutado) | Año (vigencia) | PRIDEAD | PUB |  |
| M11-I03 | Ejecución presupuestal porcentual | Porcentaje de ejecución presupuestal anual | Porcentaje o barra de avance | Barra de avance % | Año (vigencia) | PRIDEAD | PUB | Fórmula (ejecutado/asignado u obligado/apropiado) PENDIENTE con PRIDEAD. |
| M11-I04 | Distribución del presupuesto por destino | Distribución de los recursos por destino: funcionamiento académico, infraestructura, tecnología, bienestar y otros | Barras o distribución porcentual | Distribución porcentual | Año, Destino | PRIDEAD | PUB |  |
| M11-I05 | Inversión territorial y por estudiante | Inversiones por CAT, especialmente infraestructura y conectividad; inversión por estudiante, costo real de estudiantes del IDEAD por CAT y Programa | Tabla, barras o mapa | Tabla / barras / mapa | Año, CAT, Programa | PRIDEAD | MIX | 'Costo real por estudiante' requiere metodología de costeo validada y autorización de publicación. |

## Módulo 12. Proyectos de inversión y gestión institucional — ruta `/proyectos` (7 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M12-I01 | Estado de los proyectos de inversión | Número de proyectos radicados, aprobados, en ejecución y finalizados | Cifras y barras por estado | KPI + barras por estado | Año, Estado | CRIDEAD, PRIDEAD y OPDI | PUB |  |
| M12-I02 | Líneas de inversión | Proyectos por finalidad: infraestructura, equipos, tecnología, academia, bienestar y demás líneas institucionales | Barras por categoría | Barras por categoría | Año, Línea | CRIDEAD y PRIDEAD | PUB |  |
| M12-I03 | Cobertura territorial de los proyectos | Proyectos según CAT, municipio o departamento beneficiado | Tabla y mapa | Tabla + mapa | CAT, Municipio, Depto | CRIDEAD y PRIDEAD | PUB |  |
| M12-I04 | Financiación, avance y beneficiarios de proyectos | Valor aprobado, valor ejecutado, avance y beneficiarios de cada proyecto | Tabla resumen o barras | Tabla resumen + barras de avance | Año, Estado, CAT | CRIDEAD y PRIDEAD | PUB |  |
| M12-I05 | Información de cada proyecto | Ficha de cada proyecto con nombre, objetivo, lugar de ejecución, inversión y resultados | Ficha informativa | Ficha /proyectos/:slug | — | CRIDEAD | MIX | Documentos soporte restringidos salvo publicación autorizada. |
| M12-I06 | Convenios institucionales | Convenios celebrados, vigentes y terminados, con información general y recursos aportados cuando corresponda | Tabla y cifras | Tabla + KPI | Año, Estado | CIBAGUE, CAT, CRIDEAD | MIX | Fuente 'CIBAGUE' no definida en el glosario — aclarar. Texto completo de convenios restringido salvo publicación oficial. |
| M12-I07 | Cumplimiento de metas institucionales | Cumplimiento de metas del plan operativo de la Dirección | Porcentajes o barras | Porcentajes / barras | Año, Eje del plan | PIDEAD | PUB | Fuente 'PIDEAD' figura en el glosario como 'Publicaciones IDEAD' — posible inconsistencia (¿Planeación?). |

## Módulo 13. Calidad académica y recursos digitales — ruta `/calidad` (5 indicadores)

| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |
|---|---|---|---|---|---|---|---|---|
| M13-I01 | Registros calificados y acreditación | Programas con registro calificado vigente y con acreditación de alta calidad | Cifras y listado | KPI + listado (con vencimientos) | Nivel, Programa | ACIDEAD | PUB |  |
| M13-I02 | Planes de mejoramiento | Avance general de planes de mejoramiento institucional y académico | Barras o porcentaje | Barras / porcentaje | Año, Tipo de plan | ACIDEAD | PUB |  |
| M13-I03 | Plataformas y recursos digitales | Plataformas y aplicativos disponibles para el aprendizaje, como TuAula o CloudLabs, según su vigencia | Listado de recursos | Listado de recursos | — | SAIDEAD | PUB | Confirmar vigencia de TuAula y CloudLabs. |
| M13-I04 | Uso de herramientas digitales | Usuarios y utilización de plataformas o recursos educativos, por período y programa | Líneas y barras | Líneas + barras | Semestre, Programa, Plataforma | SAIDEAD y CRIDEAD | PUB |  |
| M13-I05 | Satisfacción y atención de solicitudes académicas | Satisfacción con servicios académicos y atención de solicitudes | Barras o porcentajes | Barras / porcentajes | Semestre | SAIDEAD y ACIDEAD | PUB | Instrumento y escala PENDIENTES. |

## Resumen por módulo

| Módulo | Indicadores | PUB | AGR | AGR-S | MIX |
|---|---|---|---|---|---|
| 1. Oferta académica y acceso | 6 | 6 | 0 | 0 | 0 |
| 2. Estudiantes y matrícula | 8 | 3 | 4 | 1 | 0 |
| 3. Permanencia y resultados académicos | 5 | 4 | 1 | 0 | 0 |
| 4. Docentes | 8 | 4 | 4 | 0 | 0 |
| 5. Graduados | 6 | 3 | 3 | 0 | 0 |
| 6. Personal administrativo | 5 | 2 | 3 | 0 | 0 |
| 7. CAT e infraestructura | 7 | 6 | 0 | 0 | 1 |
| 8. Bienestar universitario y TUIDEAD | 5 | 2 | 2 | 1 | 0 |
| 9. Investigación y producción académica | 5 | 3 | 1 | 0 | 1 |
| 10. Extensión, proyección social y formación continua | 4 | 4 | 0 | 0 | 0 |
| 11. Gestión financiera | 5 | 4 | 0 | 0 | 1 |
| 12. Proyectos de inversión y gestión institucional | 7 | 5 | 0 | 0 | 2 |
| 13. Calidad académica y recursos digitales | 5 | 5 | 0 | 0 | 0 |
| **Total** | **76** | **51** | **18** | **2** | **5** |
