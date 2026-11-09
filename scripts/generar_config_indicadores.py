#!/usr/bin/env python3
"""Genera backend/database/data/indicators.json y classifiers.json a partir de la matriz (docs/fase-1/matriz-indicadores.csv)
y de la configuración técnica de cada indicador definida abajo (dimensiones, gráfico, clasificador, dependencia responsable).

Uso: python3 scripts/generar_config_indicadores.py
"""
import csv, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Clasificadores: código -> (nombre, [(código, etiqueta)]). Las etiquetas «Variable: valor» se agrupan en varios gráficos.
SEXO = [("f","Femenino"),("m","Masculino"),("ni","Otro / no informa")]
def pref(p, items): return [(f"{p[0]}_{c}", f"{p[1]}: {l}") for c,l in items]
EDAD = [("m20","Menos de 20"),("20_24","20 a 24"),("25_29","25 a 29"),("30_34","30 a 34"),("35_39","35 a 39"),("40m","40 o más")]
EDAD_ADULTO = [("m30","Menos de 30"),("30_39","30 a 39"),("40_49","40 a 49"),("50_59","50 a 59"),("60m","60 o más")]
ANTIG = [("m5","Menos de 5 años"),("5_9","5 a 9 años"),("10_19","10 a 19 años"),("20m","20 años o más")]
CL = {
 "tipo_acceso": ("Etapa del proceso de acceso", [("inscritos","Inscritos"),("admitidos","Admitidos"),("nuevos","Nuevos matriculados")]),
 "tasa_acceso": ("Indicador de acceso", [("admision","Admitidos / inscritos (%)"),("ocupacion","Nuevos / cupos aprobados (%)")]),
 "perfil_estudiante": ("Variable sociodemográfica", pref(("sexo","Sexo"),SEXO)+pref(("edad","Edad"),EDAD)+pref(("ecivil","Estado civil"),[("soltero","Soltero(a)"),("casado","Casado(a)"),("union","Unión libre"),("separado","Separado(a)/divorciado(a)"),("viudo","Viudo(a)"),("ni","No informa")])+pref(("estrato","Estrato"),[(str(i),str(i)) for i in range(1,7)]+[("ni","No informa")])+pref(("zona","Zona de residencia"),[("urbana","Urbana"),("rural","Rural")])),
 "procedencia": ("Procedencia y avance", pref(("proc","Residencia"),[("mismo","Mismo municipio del CAT"),("otro","Otro municipio")])+pref(("sem","Semestre cursado"),[(str(i),f"Semestre {i}") for i in range(1,11)])),
 "poblacion": ("Población de especial protección", [("indigena","Comunidades indígenas"),("afro","Población negra, afrocolombiana"),("raizal","Población raizal"),("palenquera","Población palenquera"),("rrom","Pueblo Rrom"),("discapacidad","Personas con discapacidad"),("victima","Víctimas del conflicto armado"),("otra","Otras poblaciones registradas")]),
 "desempeno": ("Medida de desempeño y representación", [("promedio","Promedio académico general"),("representantes","Representantes estudiantiles")]),
 "no_continuidad": ("Situación de no continuidad", [("abandono","Abandono o interrupción"),("desercion","Deserción"),("movilidad","Movilidad"),("perdida","Pérdida de la condición de estudiante")]),
 "reintegro": ("Reintegros y requisitos de grado", [("reintegros","Reintegros"),("pendientes","Con requisitos pendientes para graduarse")]),
 "prueba_estado": ("Prueba de Estado", [("saber_pro","Saber Pro — puntaje global promedio"),("saber_tyt","Saber TyT — puntaje global promedio")]),
 "opcion_grado": ("Opción de grado", []),
 "vinculacion_docente": ("Tipo de vinculación docente", [("carrera","Profesores de carrera (planta)"),("catedra","Catedráticos"),("otra","Otra modalidad")]),
 "formacion": ("Nivel máximo de formación", [("profesional","Profesional"),("especializacion","Especialización"),("maestria","Maestría"),("doctorado","Doctorado")]),
 "perfil_docente": ("Variable de perfil docente", pref(("sexo","Sexo"),SEXO)+pref(("edad","Edad"),EDAD_ADULTO)+pref(("cat","Categoría (carrera)"),[("auxiliar","Auxiliar"),("asistente","Asistente"),("asociado","Asociado"),("titular","Titular")])+pref(("antig","Antigüedad (carrera)"),ANTIG)),
 "carga": ("Medida de carga académica", [("cursos","Cursos asignados"),("docentes_con_carga","Docentes con carga asignada")]),
 "relacion_ed": ("Relación estudiantes-docentes", [("total","Estudiantes por docente (total)"),("carrera","Estudiantes por docente de carrera"),("catedra","Estudiantes por docente catedrático")]),
 "part_investigacion": ("Tipo de participación investigativa", [("grupos","Grupos de investigación"),("semilleros","Semilleros"),("proyectos","Proyectos"),("eventos","Eventos académicos"),("produccion","Producción intelectual")]),
 "cualificacion": ("Cualificación y estímulos", [("seminario","Seminario de docencia / cursos"),("convocatorias","Beneficiarios de convocatorias"),("bienestar","Bienestar"),("estimulos","Estímulos"),("reconocimientos","Reconocimientos")]),
 "medida_graduados": ("Medida de graduación", [("personas","Personas graduadas"),("titulos","Títulos otorgados")]),
 "perfil_graduado": ("Variable de perfil del graduado", pref(("sexo","Sexo"),SEXO)+[("promedio","Promedio académico final")]),
 "trayectoria": ("Medida de trayectoria", [("graduacion_cohorte","Graduación por cohorte (%)"),("tiempo_titulo","Tiempo promedio hasta el título (semestres)"),("vinculados","Graduados con vinculación laboral"),("emprendimiento","Graduados con emprendimiento")]),
 "part_graduados": ("Participación de graduados", [("eventos","Eventos"),("bienestar","Bienestar"),("actividades","Actividades institucionales")]),
 "tipo_personal": ("Tipo de personal", [("administrativo","Personal administrativo vinculado"),("contratista","Contratistas de prestación de servicios")]),
 "vinculacion_admin": ("Tipo de vinculación administrativa", [("carrera","Carrera administrativa"),("libre","Libre nombramiento y remoción"),("provisional","Provisional"),("temporal","Temporal"),("contratista","Contratista")]),
 "perfil_admin": ("Variable de perfil administrativo", pref(("sexo","Sexo"),SEXO)+pref(("edad","Edad"),EDAD_ADULTO)+pref(("formacion","Formación"),[("bachiller","Bachiller"),("tecnico","Técnico/tecnólogo"),("profesional","Profesional"),("posgrado","Posgrado")])+pref(("antig","Antigüedad"),ANTIG)),
 "desarrollo_personal": ("Medida de desarrollo del personal", [("total","Total de personal"),("capacitacion","Participantes en capacitaciones"),("bienestar","Participantes en bienestar")]),
 "medida_cobertura": ("Medida de cobertura territorial", [("cat","CAT con actividad académica"),("municipios","Municipios con presencia"),("departamentos","Departamentos con presencia")]),
 "tipo_sede": ("Carácter de la sede", [("publica","Pública"),("privada","Privada"),("propia","Propia")]),
 "espacio": ("Tipo de espacio", [("aula","Aulas"),("laboratorio","Laboratorios"),("sala_computo","Salas de cómputo"),("biblioteca","Bibliotecas"),("auditorio","Auditorios"),("deportivo","Espacios deportivos"),("bienestar","Espacios de bienestar")]),
 "tecnologia": ("Recurso tecnológico", [("equipos","Equipos de cómputo"),("conectividad_mbps","Conectividad (Mbps)"),("capacidad","Capacidad de los espacios (puestos)")]),
 "hito_cat": ("Tipo de hito", [("apertura","Apertura"),("reactivacion","Reactivación"),("cierre","Cierre")]),
 "beneficiarios_bienestar": ("Beneficiarios por estamento", pref(("unicas","Personas únicas"),[("est","Estudiantes"),("doc","Docentes"),("adm","Administrativos"),("grad","Graduados")])+pref(("part","Participaciones"),[("est","Estudiantes"),("doc","Docentes"),("adm","Administrativos"),("grad","Graduados")])),
 "servicio_bienestar": ("Servicio de bienestar / TUIDEAD", [("orientacion","Orientación"),("psicologia","Psicología"),("enfermeria","Enfermería"),("crai","CRAI"),("deporte","Deporte"),("cultura","Cultura"),("otros","Otras líneas vigentes")]),
 "tipo_actividad": ("Tipo de actividad", [("deportiva","Deportiva"),("cultural","Cultural"),("semana_idead","Semana del IDEAD"),("otro","Otros eventos institucionales")]),
 "apoyos": ("Apoyo o medición", [("socioeconomico","Apoyos socioeconómicos"),("estimulos","Estímulos"),("satisfaccion","Satisfacción con los servicios (%)")]),
 "grupos_semilleros": ("Tipo", [("grupos","Grupos de investigación"),("semilleros","Semilleros de investigación")]),
 "participantes_inv": ("Participantes", [("docentes","Docentes"),("estudiantes","Estudiantes")]),
 "estado_inv": ("Estado del proyecto", [("desarrollo","En desarrollo"),("vigente","Vigente"),("finalizado","Finalizado")]),
 "tipo_producto": ("Tipo de producto", [("articulo","Artículos"),("libro","Libros"),("capitulo","Capítulos de libro"),("ponencia","Ponencias"),("creacion","Productos de creación")]),
 "inv_formativa": ("Medida", [("trabajos_grado","Trabajos de grado"),("resultados","Resultados de proyectos"),("recursos","Recursos destinados a investigación ($)")]),
 "extension": ("Tipo de iniciativa", [("proyectos","Proyectos"),("actividades","Actividades")]),
 "beneficiarios_ext": ("Beneficiarios", [("personas","Personas"),("comunidades","Comunidades"),("municipios","Municipios"),("cat","CAT")]),
 "formacion_continua": ("Tipo de oferta", [("diplomado","Diplomados"),("seminario","Seminarios"),("curso","Cursos"),("otra","Otras actividades")]),
 "part_fc": ("Participación en formación continua", pref(("part","Participantes"),[("diplomado","Diplomados"),("seminario","Seminarios"),("curso","Cursos"),("otra","Otras")])+pref(("cert","Certificados"),[("diplomado","Diplomados"),("seminario","Seminarios"),("curso","Cursos"),("otra","Otras")])),
 "estado_presupuesto": ("Estado de los recursos", [("asignado","Asignado"),("comprometido","Comprometido"),("ejecutado","Ejecutado")]),
 "destino": ("Destino del presupuesto", [("funcionamiento","Funcionamiento académico"),("infraestructura","Infraestructura"),("tecnologia","Tecnología"),("bienestar","Bienestar"),("otros","Otros")]),
 "inversion": ("Tipo de inversión", [("infraestructura","Inversión en infraestructura"),("conectividad","Inversión en conectividad"),("por_estudiante","Inversión por estudiante"),("costo_estudiante","Costo real por estudiante")]),
 "estado_proyecto": ("Estado del proyecto", [("radicado","Radicados"),("aprobado","Aprobados"),("en_ejecucion","En ejecución"),("finalizado","Finalizados")]),
 "linea_inversion": ("Línea de inversión", [("infraestructura","Infraestructura"),("equipos","Equipos"),("tecnologia","Tecnología"),("academia","Academia"),("bienestar","Bienestar"),("otra","Otras líneas")]),
 "financiacion": ("Medida", [("aprobado","Valor aprobado"),("ejecutado","Valor ejecutado"),("beneficiarios","Beneficiarios")]),
 "convenios": ("Estado del convenio", [("vigente","Vigentes"),("terminado","Terminados"),("celebrado","Celebrados en el período")]),
 "metas": ("Eje del plan operativo", [("general","Cumplimiento general")]),
 "calidad": ("Condición de calidad", [("registro","Programas con registro calificado vigente"),("acreditacion","Programas con acreditación de alta calidad")]),
 "plan_mejora": ("Tipo de plan", [("institucional","Plan de mejoramiento institucional"),("academico","Planes de mejoramiento académico")]),
 "plataforma": ("Plataforma", [("tuaula","TuAula"),("cloudlabs","CloudLabs"),("otra","Otras plataformas")]),
 "satisfaccion": ("Medida", [("satisfaccion","Satisfacción con servicios académicos (%)"),("atendidas","Solicitudes atendidas (%)")]),
}
# code: (unit, value_type, chart, group_by, dims, classifier, widget, responsible)
P,C,D,M,L,A,K = "program","cat","department","municipality","level","area","classifier"
CFG = {
"M01-I01":("programas","count","bar","level",[L,A],None,"programs","SAIDEAD"),
"M01-I02":("programas","count","table","cat",[C,D,L,P],None,"offerings","DARCA"),
"M01-I03":("cupos","count","bar","program",[P,C,L],None,None,"CDIDEAD"),
"M01-I04":("personas","count","stacked","classifier",[P,C,L,K],"tipo_acceso",None,"DARCA"),
"M01-I05":("porcentaje","percent","bar","classifier",[P,C,K],"tasa_acceso",None,"DARCA"),
"M01-I06":("programas","count","line","program",[P,C],None,"list:hitos_oferta","CDIDEAD"),
"M02-I01":("personas","count","bar","level",[L,P,C],None,None,"DARCA"),
"M02-I02":("personas","count","line","level",[L,P,C],None,None,"DARCA"),
"M02-I03":("personas","count","bar","cat",[P,C,D,M],None,None,"DARCA"),
"M02-I04":("personas","count","bar","program",[P,C,L],None,None,"DARCA"),
"M02-I05":("personas","count","distribution","classifier",[L,P,C,K],"perfil_estudiante",None,"DARCA"),
"M02-I06":("personas","count","distribution","classifier",[P,C,K],"procedencia",None,"DARCA"),
"M02-I07":("personas","count","bar","classifier",[L,C,K],"poblacion",None,"DARCA"),
"M02-I08":("número","number","bar","classifier",[P,C,K],"desempeno","list:representacion_estudiantil","DARCA"),
"M03-I01":("porcentaje","percent","line","program",[L,P,C],None,None,"DARCA"),
"M03-I02":("personas","count","stacked","classifier",[L,P,C,K],"no_continuidad",None,"DARCA"),
"M03-I03":("personas","count","bar","classifier",[P,C,K],"reintegro",None,"SAIDEAD"),
"M03-I04":("puntaje","number","line","classifier",[L,P,C,K],"prueba_estado",None,"SAIDEAD"),
"M03-I05":("trabajos","count","bar","classifier",[P,K],"opcion_grado","list:opciones_grado","SAIDEAD"),
"M04-I01":("docentes","count","stacked","classifier",[C,P,K],"vinculacion_docente",None,"DEPTOS"),
"M04-I02":("docentes","count","line","classifier",[K],"vinculacion_docente",None,"DEPTOS"),
"M04-I03":("docentes","count","bar","classifier",[C,P,K],"formacion",None,"DEPTOS"),
"M04-I04":("docentes","count","distribution","classifier",[K],"perfil_docente",None,"DEPTOS"),
"M04-I05":("número","count","bar","classifier",[P,C,K],"carga",None,"DEPTOS"),
"M04-I06":("razón","ratio","bar","classifier",[P,C,K],"relacion_ed",None,"DEPTOS"),
"M04-I07":("docentes","count","bar","classifier",[P,C,K],"part_investigacion",None,"SAIDEAD"),
"M04-I08":("docentes","count","bar","classifier",[K],"cualificacion",None,"DEPTOS"),
"M05-I01":("personas / títulos","count","kpi","classifier",[L,P,K],"medida_graduados",None,"OG"),
"M05-I02":("personas","count","line","level",[L,P],None,None,"OG"),
"M05-I03":("personas","count","map","department",[L,P,A,C,D],None,None,"OG"),
"M05-I04":("personas","count","distribution","classifier",[L,P,K],"perfil_graduado",None,"OG"),
"M05-I05":("número","number","bar","classifier",[P,K],"trayectoria",None,"OG"),
"M05-I06":("personas","count","bar","classifier",[K],"part_graduados",None,"OG"),
"M06-I01":("personas","count","bar","classifier",[K],"tipo_personal",None,"CRIDEAD"),
"M06-I02":("personas","count","bar","classifier",[K],"vinculacion_admin",None,"CRIDEAD"),
"M06-I03":("personas","count","map","department",[C,D],None,None,"CRIDEAD"),
"M06-I04":("personas","count","distribution","classifier",[K],"perfil_admin",None,"CRIDEAD"),
"M06-I05":("personas","count","line","classifier",[K],"desarrollo_personal",None,"CRIDEAD"),
"M07-I01":("número","count","kpi","classifier",[D,K],"medida_cobertura","cats_map","CRIDEAD"),
"M07-I02":("sedes","count","bar","classifier",[C,D,K],"tipo_sede","cats_table","CRIDEAD"),
"M07-I03":("espacios","count","bar","classifier",[C,K],"espacio","cat_facilities","CRIDEAD"),
"M07-I04":("número","number","bar","classifier",[C,K],"tecnologia",None,"CRIDEAD"),
"M07-I05":("CAT","count","line","classifier",[D,K],"hito_cat","cat_timeline","CRIDEAD"),
"M07-I06":("fichas","count","table",None,[],None,"cat_cards","CRIDEAD"),
"M07-I07":("varios","number","table",None,[C],None,"cat_cards","CRIDEAD"),
"M08-I01":("personas / participaciones","count","distribution","classifier",[K],"beneficiarios_bienestar",None,"TUIDEAD"),
"M08-I02":("personas","count","bar","cat",[P,C,D],None,None,"TUIDEAD"),
"M08-I03":("atenciones","count","bar","classifier",[C,K],"servicio_bienestar","list:servicios_bienestar","TUIDEAD"),
"M08-I04":("participaciones","count","stacked","classifier",[C,K],"tipo_actividad",None,"TUIDEAD"),
"M08-I05":("número","number","bar","classifier",[C,K],"apoyos",None,"TUIDEAD"),
"M09-I01":("grupos","count","bar","classifier",[K],"grupos_semilleros","list:grupos_investigacion","SAIDEAD"),
"M09-I02":("personas","count","bar","classifier",[P,C,K],"participantes_inv",None,"SAIDEAD"),
"M09-I03":("proyectos","count","bar","classifier",[K],"estado_inv",None,"SAIDEAD"),
"M09-I04":("productos","count","bar","classifier",[P,K],"tipo_producto",None,"SAIDEAD"),
"M09-I05":("número","number","bar","classifier",[P,K],"inv_formativa",None,"SAIDEAD"),
"M10-I01":("iniciativas","count","bar","classifier",[C,K],"extension",None,"PSIDEAD"),
"M10-I02":("número","count","bar","classifier",[C,D,M,K],"beneficiarios_ext",None,"PSIDEAD"),
"M10-I03":("ofertas","count","bar","classifier",[K],"formacion_continua","list:formacion_continua","ECIDEAD"),
"M10-I04":("personas","count","distribution","classifier",[K],"part_fc",None,"ECIDEAD"),
"M11-I01":("pesos","currency","line",None,[],None,None,"PRIDEAD"),
"M11-I02":("pesos","currency","bar","classifier",[K],"estado_presupuesto",None,"PRIDEAD"),
"M11-I03":("porcentaje","percent","progress",None,[],None,None,"PRIDEAD"),
"M11-I04":("pesos","currency","distribution","classifier",[K],"destino",None,"PRIDEAD"),
"M11-I05":("pesos","currency","bar","cat",[C,P,K],"inversion",None,"PRIDEAD"),
"M12-I01":("proyectos","count","bar","classifier",[K],"estado_proyecto","projects","OPDI"),
"M12-I02":("proyectos","count","bar","classifier",[K],"linea_inversion",None,"CRIDEAD"),
"M12-I03":("proyectos","count","map","department",[C,M,D],None,"projects_map","CRIDEAD"),
"M12-I04":("pesos / personas","currency","bar","classifier",[K],"financiacion","projects_progress","CRIDEAD"),
"M12-I05":("fichas","count","table",None,[],None,"projects","CRIDEAD"),
"M12-I06":("convenios","count","bar","classifier",[K],"convenios","agreements","CRIDEAD"),
"M12-I07":("porcentaje","percent","progress","classifier",[K],"metas",None,"PIDEAD"),
"M13-I01":("programas","count","bar","classifier",[L,K],"calidad","accreditation","ACIDEAD"),
"M13-I02":("porcentaje","percent","progress","classifier",[K],"plan_mejora","list:planes_mejoramiento","ACIDEAD"),
"M13-I03":("plataformas","count","table",None,[],None,"list:plataformas_digitales","SAIDEAD"),
"M13-I04":("usuarios","count","line","classifier",[P,K],"plataforma",None,"SAIDEAD"),
"M13-I05":("porcentaje","percent","bar","classifier",[K],"satisfaccion",None,"SAIDEAD"),
}
SOURCE_MATCH = [
 ("Página web","PAGINA_WEB"),("BD matriculados","BD_MATRICULADOS"),("BD representantes","BD_REPRESENTANTES"),("BD departamentos","BD_DEPARTAMENTOS"),
 ("DARCA","DARCA"),("CDIDEAD","CDIDEAD"),("Acuerdo","ACUERDOS"),("ICFES","ICFES"),("SAIDEAD","SAIDEAD"),("DP","DP"),("CP","CP"),
 ("Departamentos","DEPTOS"),("profesor Llanos","PROF_LLANOS"),("SNIES","INFORME_SNIES"),("SGUT","SGUT"),("Oficina de Graduados","OG"),
 ("CRIDEAD","CRIDEAD"),("Coordinadores","COORDINADORES_CAT"),("Actores Claves","ACTORES_CLAVES"),("Información previamente","INFO_RECOLECTADA"),
 ("TUIDEAD","TUIDEAD"),("Informes Operadores","INFORMES_OPERADORES"),("Biblioteca","BIBLIOTECA"),("Permanencia Estudiantes","PERMANENCIA"),
 ("VICIEPS","VICIEPS"),("PIDEAD","PIDEAD"),("PSIDEAD","PSIDEAD"),("ECIDEAD","ECIDEAD"),("PRIDEAD","PRIDEAD"),("OPDI","OPDI"),("CIBAGUE","CIBAGUE"),
 (", CAT","CAT_FUENTE"),("ACIDEAD","ACIDEAD"),
]
import re
rows = list(csv.DictReader(open(os.path.join(ROOT,"docs/fase-1/matriz-indicadores.csv"),encoding="utf-8")))
assert len(rows)==76 and set(r["codigo"] for r in rows)==set(CFG)
out=[]
for r in rows:
    unit,vt,chart,gb,dims,clf,widget,resp = CFG[r["codigo"]]
    src=r["fuente_excel"]; srcs=[]
    for needle,code in SOURCE_MATCH:
        if needle in ("DP","CP"):
            if re.search(r'(^|[ ,/y])'+needle+r'($|[ ,/])', src): srcs.append(code)
        elif needle == "Departamentos":
            if re.search(r'(^|[ ,])Departamentos', src): srcs.append(code)
        elif needle.lower() in src.lower(): srcs.append(code)
    srcs=[s for s in dict.fromkeys(srcs) if not (s=="CDIDEAD" and "Acuerdo 015" in src and "CDIDEAD y" in src and False)]
    lvl=r["nivel_publicacion"].replace("-","_")
    out.append(dict(code=r["codigo"],module=int(r["codigo"][1:3]),sort=int(r["codigo"][-2:]),name=r["indicador"],information_required=r["informacion_requerida"],
        suggested_visualization=r["visualizacion_excel"],source_text=src,unit=unit,value_type=vt,chart_type=chart,group_by=gb,allowed_dimensions=dims,
        classifier=clf,widget=widget,filters_text=r["filtros"],publication_level=lvl,observations=r["observaciones"] or None,
        responsible=resp,sources=srcs,publication_authorized=(lvl!="AGR_S"),
        periodicity=("vigencia" if r["codigo"].startswith("M11") else ("anual" if r["codigo"][:3] in ("M05","M06","M09","M10","M12","M13") else "semestral"))))
os.makedirs(os.path.join(ROOT,"backend/database/data"),exist_ok=True)
json.dump(out,open(os.path.join(ROOT,"backend/database/data/indicators.json"),"w"),ensure_ascii=False,indent=1)
PARTITION = {"perfil_estudiante","procedencia","no_continuidad","opcion_grado","vinculacion_docente","formacion","perfil_docente","perfil_graduado",
 "tipo_personal","vinculacion_admin","perfil_admin","tipo_sede","espacio","hito_cat","servicio_bienestar","tipo_actividad","grupos_semilleros",
 "participantes_inv","estado_inv","tipo_producto","extension","formacion_continua","destino","estado_proyecto","linea_inversion"}
json.dump({k:{"name":v[0],"is_partition":k in PARTITION,"items":[{"code":c,"label":l} for c,l in v[1]]} for k,v in CL.items()},open(os.path.join(ROOT,"backend/database/data/classifiers.json"),"w"),ensure_ascii=False,indent=1)
missing=[o["code"] for o in out if not o["sources"]]
print("ok", len(out), "sin fuente:", missing, "clasificadores:", len(CL))
for o in out[:3]+out[60:62]: print(o["code"], o["sources"], o["source_text"])
