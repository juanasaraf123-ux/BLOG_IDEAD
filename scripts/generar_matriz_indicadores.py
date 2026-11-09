#!/usr/bin/env python3
"""Genera docs/fase-1/02-matriz-indicadores.md y matriz-indicadores.csv a partir del Excel de indicadores.

Uso: python3 scripts/generar_matriz_indicadores.py docs/referencias/Indicadores_Sugeridos.xlsx \
        docs/fase-1/02-matriz-indicadores.md docs/fase-1/matriz-indicadores.csv
Requiere openpyxl. Las columnas propuestas (visualización, filtros, publicación, observaciones)
se mantienen en la lista A, en el mismo orden de las filas del Excel; el script falla si no hay 76.
"""
import sys, csv, openpyxl
src, out_md, out_csv = sys.argv[1:4]
ws = openpyxl.load_workbook(src).worksheets[0]
mods = {1:("Oferta académica y acceso","/oferta-academica"),2:("Estudiantes y matrícula","/estudiantes"),
3:("Permanencia y resultados académicos","/permanencia"),4:("Docentes","/docentes"),5:("Graduados","/graduados"),
6:("Personal administrativo","/personal-administrativo"),7:("CAT e infraestructura","/cat"),
8:("Bienestar universitario y TUIDEAD","/bienestar"),9:("Investigación y producción académica","/investigacion"),
10:("Extensión, proyección social y formación continua","/extension"),11:("Gestión financiera","/gestion-financiera"),
12:("Proyectos de inversión y gestión institucional","/proyectos"),13:("Calidad académica y recursos digitales","/calidad")}
# (visualización propuesta, filtros, publicación, observaciones / pendientes)
A = [
# M1
("KPI + listado filtrable","Nivel, Área","PUB","Área de conocimiento: definir clasificación (NBC SNIES / CINE-F) — validar con DARCA/SAIDEAD."),
("Tabla consultable + mapa","CAT, Depto, Nivel, Programa","PUB","Definir regla institucional de 'recibe estudiantes nuevos' vs. 'solo cohortes en curso'."),
("Barras + evolución (líneas)","Semestre, Programa, CAT","PUB","Fuente en Excel: 'BD matriculados comparando'. Aclarar si los cupos aprobados provienen de acuerdos del CDIDEAD."),
("Barras agrupadas (inscritos/admitidos/matriculados)","Semestre, Programa, CAT, Nivel","PUB",""),
("KPI porcentuales","Semestre, Programa, CAT","PUB","Fórmulas propuestas (admitidos/inscritos; nuevos/cupos) PENDIENTES de validación por DARCA."),
("Línea de tiempo + listado","Año, Programa, CAT","PUB","Programas 'proyectados' solo si están aprobados por acto administrativo."),
# M2
("KPI + barras","Semestre, Nivel, Programa, CAT","PUB","Definir fecha de corte y tipo de matrícula (académica/financiera)."),
("Líneas con variación %","Semestre, Nivel, Programa, CAT","PUB",""),
("Barras + tabla + mapa coroplético","Semestre, Programa, CAT, Municipio, Depto","AGR",""),
("Barras + porcentaje","Semestre, Programa, CAT","PUB",""),
("Distribución porcentual (barras 100 %)","Semestre, Nivel, Programa, CAT","AGR","Supresión de celdas pequeñas (umbral k a definir)."),
("Barras comparativas","Semestre, Programa, CAT","AGR",""),
("Barras / tabla agregada","Semestre, Nivel, CAT","AGR-S","Datos sensibles (Ley 1581/2012). Solo agregados con supresión; publicar víctimas/discapacidad requiere autorización expresa."),
("KPI + tabla","Semestre, Programa, CAT","AGR","Promedios de grupos pequeños pueden identificar personas. Representantes: publicar número; nombres solo si el acto es público."),
# M3
("Líneas","Semestre, Nivel, Programa, CAT","PUB","Fórmula de tasa de continuidad PENDIENTE de validación."),
("Barras apiladas por tipo + líneas","Semestre, Nivel, Programa, CAT","PUB","Excluir graduados y egresados. Tipos: abandono/interrupción, deserción, movilidad, pérdida de calidad de estudiante. Metodología (institucional vs. SPADIES) PENDIENTE."),
("Barras + tabla","Semestre, Programa, CAT","AGR",""),
("Líneas comparativas","Año, Nivel, Programa, CAT","PUB","Verificar condiciones de uso/publicación de resultados ICFES por programa y CAT."),
("Barras / tabla","Año, Semestre, Programa","PUB","Catálogo de opciones según Acuerdo 015 de 2008 CDIDEAD — verificar vigencia."),
# M4
("KPI + barras","Semestre, CAT, Programa","PUB",""),
("Líneas (planta vs. cátedra)","Semestre","PUB",""),
("Barras / tabla","Semestre, CAT, Programa","AGR",""),
("Barras","Semestre","AGR","Categoría y antigüedad solo para docentes de carrera; supresión de celdas pequeñas."),
("Barras + KPI","Semestre, Programa, CAT","AGR","No publicar carga individual."),
("KPI / tabla comparativa","Semestre, Programa, CAT","PUB","Definir si la relación es por personas o por tiempo completo equivalente (TCE)."),
("Barras + KPI","Año, Programa, CAT","PUB","Fuente 'profesor Llanos' es una persona, no una dependencia: formalizar fuente institucional."),
("Barras / tabla","Año","AGR",""),
# M5
("Dos KPI separados (personas / títulos)","Año, Semestre, Nivel, Programa","PUB","Personas únicas ≠ títulos otorgados."),
("Líneas","Año, Semestre, Nivel, Programa","PUB",""),
("Barras + mapa","Año, Nivel, Programa, Área, CAT, Depto","AGR",""),
("Distribución porcentual","Año, Nivel, Programa","AGR",""),
("Líneas + barras por cohorte","Cohorte, Programa","AGR","Seguimiento laboral solo si existen datos (posible fuente externa: OLE-MEN, por validar)."),
("KPI / barras","Año","PUB",""),
# M6
("KPI + barras (planta vs. contratistas)","Año, Semestre","PUB",""),
("Barras / tabla","Año, Dependencia","AGR","No publicar cargos unipersonales que identifiquen a la persona."),
("Tabla / mapa","Año, CAT, Depto","AGR",""),
("Barras","Año","AGR",""),
("Líneas + barras","Año","PUB",""),
# M7
("KPI + mapa de Colombia","Depto, Municipio","PUB","Requiere coordenadas verificadas de cada CAT."),
("Tabla + mapa","Depto, Municipio, Tipo de sede","PUB","Clasificación de sede: pública / privada / propia."),
("Tabla comparativa","CAT, Depto","PUB",""),
("Barras / tabla","CAT, Depto","PUB","No publicar detalles técnicos de red (riesgo de seguridad)."),
("Línea de tiempo","Año, Depto","PUB",""),
("Ficha informativa /cat/:slug","—","MIX","Fotos y datos de responsables solo con autorización. Fuente incluye 'Actores claves' (no formalizada)."),
("Resumen integrado en ficha CAT","Semestre, CAT","PUB","Se compone de valores ya publicados en otros módulos (no requiere carga propia)."),
# M8
("KPI + barras por estamento","Año, Semestre, Estamento","AGR","Medir por separado personas únicas y participaciones."),
("Barras / mapa","Semestre, Programa, CAT","AGR",""),
("KPI por tipo de servicio","Semestre, CAT, Servicio","AGR-S","Psicología/enfermería: solo conteos agregados (datos de salud)."),
("Barras + evolución","Año, Semestre, CAT, Tipo de evento","PUB",""),
("Barras / porcentajes","Semestre, CAT","PUB","Instrumento y escala de satisfacción PENDIENTES."),
# M9
("KPI + listado","Año, Categoría","PUB",""),
("Barras","Año, Programa, CAT, Estamento","AGR",""),
("KPI + barras por estado","Año, Estado","PUB",""),
("Barras por tipo de producto","Año, Tipo, Programa","PUB",""),
("Tabla + KPI","Año, Programa","MIX","Recursos financieros solo agregados."),
# M10
("KPI + barras","Año, Estado, CAT","PUB",""),
("KPI + mapa + barras","Año, Municipio, Depto, CAT","PUB",""),
("Listado + KPI","Año, Tipo","PUB",""),
("Barras + líneas","Año, Tipo","PUB","Participantes ≠ certificados."),
# M11
("KPI + líneas","Año (vigencia)","PUB",""),
("Barras comparativas (asignado/comprometido/ejecutado)","Año (vigencia)","PUB",""),
("Barra de avance %","Año (vigencia)","PUB","Fórmula (ejecutado/asignado u obligado/apropiado) PENDIENTE con PRIDEAD."),
("Distribución porcentual","Año, Destino","PUB",""),
("Tabla / barras / mapa","Año, CAT, Programa","MIX","'Costo real por estudiante' requiere metodología de costeo validada y autorización de publicación."),
# M12
("KPI + barras por estado","Año, Estado","PUB",""),
("Barras por categoría","Año, Línea","PUB",""),
("Tabla + mapa","CAT, Municipio, Depto","PUB",""),
("Tabla resumen + barras de avance","Año, Estado, CAT","PUB",""),
("Ficha /proyectos/:slug","—","MIX","Documentos soporte restringidos salvo publicación autorizada."),
("Tabla + KPI","Año, Estado","MIX","Fuente 'CIBAGUE' no definida en el glosario — aclarar. Texto completo de convenios restringido salvo publicación oficial."),
("Porcentajes / barras","Año, Eje del plan","PUB","Fuente 'PIDEAD' figura en el glosario como 'Publicaciones IDEAD' — posible inconsistencia (¿Planeación?)."),
# M13
("KPI + listado (con vencimientos)","Nivel, Programa","PUB",""),
("Barras / porcentaje","Año, Tipo de plan","PUB",""),
("Listado de recursos","—","PUB","Confirmar vigencia de TuAula y CloudLabs."),
("Líneas + barras","Semestre, Programa, Plataforma","PUB",""),
("Barras / porcentajes","Semestre","PUB","Instrumento y escala PENDIENTES."),
]
rows=[]; m=0; i=0
for r in ws.iter_rows(min_row=1, max_col=4, values_only=True):
    a,b,c,d = r
    if a and a[0].isdigit() and ". " in a: m=int(a.split(".")[0]); i=0; continue
    if a in (None,"Nombre sugerido del apartado"): continue
    i+=1; rows.append((m,i,a,b,c,d))
assert len(rows)==len(A)==76, (len(rows),len(A))
leg={"PUB":"Público","AGR":"Público agregado","AGR-S":"Agregado sensible","MIX":"Mixto"}
with open(out_csv,"w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["codigo","modulo","ruta","indicador","informacion_requerida","visualizacion_excel","fuente_excel","visualizacion_propuesta","filtros","nivel_publicacion","metodologia","observaciones"])
    for (m,i,a,b,c,d),(v,fl,p,o) in zip(rows,A):
        w.writerow([f"M{m:02d}-I{i:02d}",mods[m][0],mods[m][1],a,b,c,d,v,fl,p,"Pendiente de validación",o])
md=["# Matriz de correspondencia: indicadores ↔ módulos del portal","",
"Generada directamente desde `docs/referencias/Indicadores_Sugeridos.xlsx` (hoja `Hoja1`, 13 apartados, **76 indicadores**). Ningún registro del Excel fue omitido. Versión tabular reutilizable (servirá como semilla del catálogo de indicadores): [`matriz-indicadores.csv`](matriz-indicadores.csv).","",
"**Convenciones**","",
"- **Código**: `Mxx-Iyy` = módulo xx, indicador yy (orden del Excel). Será la clave estable del indicador en la base de datos.",
"- **Publicación**: `PUB` público · `AGR` público solo agregado, con supresión de celdas pequeñas · `AGR-S` agregado de datos sensibles (requiere autorización expresa antes de publicarse) · `MIX` ficha/cifras públicas con soportes o campos restringidos en el panel privado.",
"- **Metodología**: en todos los casos queda *Pendiente de validación* hasta que la dependencia responsable entregue la definición y fórmula oficiales (regla 8 del prompt: no se calculan indicadores sin definición institucional).",
"- La columna *Fuente (Excel)* se transcribe literalmente; las abreviaturas se explican en el glosario del diagnóstico.",""]
cur=None
for (m,i,a,b,c,d),(v,fl,p,o) in zip(rows,A):
    if m!=cur:
        cur=m; n=sum(1 for x in rows if x[0]==m)
        md+=["",f"## Módulo {m}. {mods[m][0]} — ruta `{mods[m][1]}` ({n} indicadores)","",
             "| Código | Indicador | Información requerida | Visualización (Excel) | Visualización propuesta | Filtros | Fuente (Excel) | Publ. | Observaciones / pendientes |",
             "|---|---|---|---|---|---|---|---|---|"]
    esc=lambda s:(s or "").replace("|","\\|")
    md.append(f"| M{m:02d}-I{i:02d} | {esc(a)} | {esc(b)} | {esc(c)} | {esc(v)} | {esc(fl)} | {esc(d)} | {p} | {esc(o)} |")
md+=["","## Resumen por módulo","","| Módulo | Indicadores | PUB | AGR | AGR-S | MIX |","|---|---|---|---|---|---|"]
for k in mods:
    ps=[A[j][2] for j,x in enumerate(rows) if x[0]==k]
    md.append(f"| {k}. {mods[k][0]} | {len(ps)} | {ps.count('PUB')} | {ps.count('AGR')} | {ps.count('AGR-S')} | {ps.count('MIX')} |")
ps=[a[2] for a in A]
md.append(f"| **Total** | **76** | **{ps.count('PUB')}** | **{ps.count('AGR')}** | **{ps.count('AGR-S')}** | **{ps.count('MIX')}** |")
open(out_md,"w",encoding="utf-8").write("\n".join(md)+"\n")
print("ok", {k:ps.count(k) for k in leg})
