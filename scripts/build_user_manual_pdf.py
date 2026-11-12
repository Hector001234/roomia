import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Image,
    KeepTogether,
)

OUTPUT_PDF = r"C:\Users\Hector\Documents\7mo\Auditorias\roomia\Manual_de_Usuario_Roomia_v3.1.pdf"
os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)

# Uploaded real screenshots from the conversation
IMG_PUBLIC_HOME = r"C:\Users\Hector\.gemini\antigravity\brain\e1259018-f170-444a-8ebd-295601e292a3\.user_uploaded\media_1794521414466_5bfe6302.jpg"
IMG_PUBLIC_LOFTS = r"C:\Users\Hector\.gemini\antigravity\brain\e1259018-f170-444a-8ebd-295601e292a3\.user_uploaded\media_1794520002801_f9ec46d2.jpg"
IMG_PUBLIC_LOGIN = r"C:\Users\Hector\.gemini\antigravity\brain\e1259018-f170-444a-8ebd-295601e292a3\.user_uploaded\media_1794521936676_7a11410e.png"
IMG_ADMIN_LISTINGS = r"C:\Users\Hector\.gemini\antigravity\brain\e1259018-f170-444a-8ebd-295601e292a3\.user_uploaded\media_1794520010610_c78aeddb.jpg"
IMG_ADMIN_SOFT_DELETE = r"C:\Users\Hector\.gemini\antigravity\brain\e1259018-f170-444a-8ebd-295601e292a3\.user_uploaded\media_1794513569252_4f60b7ed.png"
IMG_ADMIN_USERS = r"C:\Users\Hector\.gemini\antigravity\brain\e1259018-f170-444a-8ebd-295601e292a3\.user_uploaded\media_1794521426638_a94da0d3.png"

# Colors
ZINC_950 = colors.HexColor("#09090B")
ZINC_800 = colors.HexColor("#27272A")
ZINC_600 = colors.HexColor("#52525B")
ZINC_500 = colors.HexColor("#71717A")
ZINC_200 = colors.HexColor("#E4E4E7")
ZINC_100 = colors.HexColor("#F4F4F5")
ZINC_50 = colors.HexColor("#FAFAFA")
EMERALD_700 = colors.HexColor("#047857")
EMERALD_50 = colors.HexColor("#ECFDF5")

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "CoverTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=24,
    leading=29,
    textColor=ZINC_950,
    alignment=0,
    spaceAfter=8,
)

subtitle_style = ParagraphStyle(
    "CoverSubTitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=12,
    leading=17,
    textColor=ZINC_600,
    spaceAfter=18,
)

kicker_style = ParagraphStyle(
    "Kicker",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=8.5,
    leading=12,
    textColor=ZINC_500,
    spaceAfter=4,
)

h1_style = ParagraphStyle(
    "H1Minimal",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=20,
    textColor=ZINC_950,
    spaceBefore=12,
    spaceAfter=6,
)

h2_style = ParagraphStyle(
    "H2Minimal",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=11.5,
    leading=16,
    textColor=ZINC_800,
    spaceBefore=10,
    spaceAfter=4,
)

body_style = ParagraphStyle(
    "BodyMinimal",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=14,
    textColor=ZINC_800,
    spaceAfter=6,
)

bullet_style = ParagraphStyle(
    "BulletMinimal",
    parent=body_style,
    leftIndent=14,
    firstLineIndent=-8,
    spaceAfter=4,
)

caption_style = ParagraphStyle(
    "CaptionMinimal",
    parent=styles["Normal"],
    fontName="Helvetica-Oblique",
    fontSize=8,
    leading=11,
    textColor=ZINC_500,
    alignment=1,
    spaceBefore=4,
    spaceAfter=10,
)

th_style = ParagraphStyle(
    "TH",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=8.5,
    leading=11,
    textColor=colors.white,
)

td_style = ParagraphStyle(
    "TD",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=12,
    textColor=ZINC_800,
)

td_bold = ParagraphStyle(
    "TDBold",
    parent=td_style,
    fontName="Helvetica-Bold",
    textColor=ZINC_950,
)


def add_screenshot(story, path, caption_text, max_w=6.5 * inch, max_h=3.15 * inch):
    if os.path.exists(path):
        try:
            img = Image(path)
            iw, ih = img.imageWidth, img.imageHeight
            ratio = min(max_w / float(iw), max_h / float(ih))
            img.drawWidth = iw * ratio
            img.drawHeight = ih * ratio

            wrapper = Table([[img]], colWidths=[6.6 * inch])
            wrapper.setStyle(
                TableStyle(
                    [
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("BOX", (0, 0), (-1, -1), 0.75, ZINC_200),
                        ("BACKGROUND", (0, 0), (-1, -1), ZINC_50),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(
                KeepTogether(
                    [
                        Spacer(1, 4),
                        wrapper,
                        Paragraph(caption_text, caption_style),
                    ]
                )
            )
        except Exception:
            pass


def make_table(rows, col_widths):
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ZINC_950),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, ZINC_200),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ZINC_50]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(ZINC_200)
    canvas.setLineWidth(0.5)
    canvas.line(0.75 * inch, 10.35 * inch, 7.75 * inch, 10.35 * inch)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(ZINC_600)
    canvas.drawString(0.75 * inch, 10.43 * inch, "ROOMIA S.A.P.I. DE C.V.  |  MANUAL DE USUARIO Y OPERACION DEL SISTEMA (v3.1.0)")
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(7.75 * inch, 10.43 * inch, "DOCUMENTO TECNICO - OPERATIVO")

    canvas.line(0.75 * inch, 0.65 * inch, 7.75 * inch, 0.65 * inch)
    canvas.drawString(0.75 * inch, 0.45 * inch, "Ingenieria en Software  |  Unidad de Aprendizaje: Auditorias de Sistemas  |  Grupo SW")
    canvas.drawRightString(7.75 * inch, 0.45 * inch, f"Pagina {doc.page}")
    canvas.restoreState()


def build_manual():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.85 * inch,
    )

    story = []

    # ================= PORTADA =================
    story.append(Spacer(1, 0.35 * inch))
    story.append(Paragraph("MANUAL OFICIAL DE USUARIO Y OPERACION", kicker_style))
    story.append(Paragraph("Plataforma Roomia Sanctuaries & Stays (v3.1.0)", title_style))
    story.append(
        Paragraph(
            "Guia integral paso a paso del Portal Publico de Huespedes (Puerto 5174), Consola Central de Administracion y Auditoria (Puerto 5175), ciclo de Altas, Bajas Logicas, Reactivaciones, Reservas Concurrentes y Bitacora SHA-256.",
            subtitle_style,
        )
    )

    meta_rows = [
        [Paragraph("Atributo Institucional", th_style), Paragraph("Detalle Oficial del Proyecto", th_style)],
        [Paragraph("Programa Academico", td_bold), Paragraph("Ingenieria en Software", td_style)],
        [Paragraph("Unidad de Aprendizaje", td_bold), Paragraph("Auditorias de Sistemas", td_style)],
        [Paragraph("Grupo", td_bold), Paragraph("SW", td_style)],
        [Paragraph("Docente Titular", td_bold), Paragraph("MTRA. JULIETA GARCILAZO REYES", td_style)],
        [
            Paragraph("Equipo Desarrollador", td_bold),
            Paragraph(
                "Jesus Valdez Dominguez<br/>Jair Resenos Serrano<br/>Hector Tomas Rodriguez Flores",
                td_style,
            ),
        ],
        [Paragraph("Version del Sistema", td_bold), Paragraph("Roomia Platform v3.1.0 (PostgreSQL 16 3NF + React 18 + Node/PHP API)", td_style)],
        [Paragraph("Fecha de Emision", td_bold), Paragraph("12 de noviembre de 2026", td_style)],
    ]
    story.append(make_table(meta_rows, [2.2 * inch, 4.8 * inch]))
    story.append(Spacer(1, 0.25 * inch))

    # Arquitectura de acceso rápido
    arch_rows = [
        [
            Paragraph("Componente", th_style),
            Paragraph("URL Local", th_style),
            Paragraph("Roles Autorizados", th_style),
            Paragraph("Proposito Operativo", th_style),
        ],
        [
            Paragraph("Portal Publico", td_bold),
            Paragraph("http://localhost:5174", td_style),
            Paragraph("GUEST / HOST", td_style),
            Paragraph("Exploracion de catalogo, filtrado multicriterio, mapa interactivo, reservas, pagos tokenizados y resenas verificadas.", td_style),
        ],
        [
            Paragraph("Backoffice Admin", td_bold),
            Paragraph("http://127.0.0.1:5175", td_style),
            Paragraph("ADMIN (Exclusivo)", td_style),
            Paragraph("Alta de residencias, edicion, baja logica (deleted_at), reactivacion, control de usuarios RBAC y cadena SHA-256.", td_style),
        ],
        [
            Paragraph("Motor API REST v1", td_bold),
            Paragraph("http://127.0.0.1:8000", td_style),
            Paragraph("Sistema / Gateway", td_style),
            Paragraph("Sincronizacion en tiempo real entre portales, bloqueo pesimista de fechas y persistencia atomica.", td_style),
        ],
    ]
    story.append(Paragraph("1. Arquitectura Operativa de Portales Segregados", h1_style))
    story.append(
        Paragraph(
            "Por seguridad estructural (prevencion de exposicion de paneles administrativos CWE-284), Roomia separa fisicamente el Portal Publico de Clientes y la Consola Administrativa en dos aplicaciones independientes que se sincronizan en tiempo real.",
            body_style,
        )
    )
    story.append(make_table(arch_rows, [1.3 * inch, 1.5 * inch, 1.2 * inch, 3.0 * inch]))

    story.append(PageBreak())

    # ================= SECCION 2: CREDENCIALES Y ACCESO =================
    story.append(Paragraph("2. Control de Acceso, Roles (RBAC) y Registro de Usuarios", h1_style))
    story.append(
        Paragraph(
            "El Modulo M01 gestiona la autenticacion mediante hashing criptografico Argon2id, validacion sintactica de correo bajo el estandar RFC 5322, tokens JWT en memoria volatil y bloqueo automatico contra fuerza bruta al 5.o intento fallido (HTTP 429 Too Many Requests).",
            body_style,
        )
    )

    cred_rows = [
        [
            Paragraph("Rol RBAC", th_style),
            Paragraph("Nombre de Usuario", th_style),
            Paragraph("Correo Electronico", th_style),
            Paragraph("Contrasena", th_style),
            Paragraph("Portal de Acceso", th_style),
        ],
        [
            Paragraph("GUEST", td_bold),
            Paragraph("Alejandro Mendoza", td_style),
            Paragraph("guest.alejandro@roomia.mx", td_style),
            Paragraph("SecurePass#2026", td_style),
            Paragraph("localhost:5174/login", td_style),
        ],
        [
            Paragraph("HOST", td_bold),
            Paragraph("Elena Rostova", td_style),
            Paragraph("host.elena@roomia.mx", td_style),
            Paragraph("SecurePass#2026", td_style),
            Paragraph("localhost:5174/login", td_style),
        ],
        [
            Paragraph("ADMIN", td_bold),
            Paragraph("Auditor CISA / Admin TI", td_style),
            Paragraph("auditor.ti@roomia.mx", td_style),
            Paragraph("SecurePass#2026", td_style),
            Paragraph("127.0.0.1:5175/login", td_style),
        ],
    ]
    story.append(make_table(cred_rows, [0.8 * inch, 1.5 * inch, 1.8 * inch, 1.3 * inch, 1.6 * inch]))

    story.append(Paragraph("2.1 Pantalla de Inicio de Sesion sin Autocompletado", h2_style))
    story.append(
        Paragraph(
            "La pantalla de inicio de sesion en el portal publico exige ingresar manualmente el correo electronico y contrasena, sin exponer enlaces hacia la consola administrativa ni prellenar credenciales en el navegador.",
            body_style,
        )
    )
    add_screenshot(
        story,
        IMG_PUBLIC_LOGIN,
        "Figura 1. Pantalla de Inicio de Sesion del Portal Publico (http://localhost:5174/login) con proteccion Argon2id.",
        max_h=2.75 * inch,
    )

    story.append(Paragraph("2.2 Registro de Nuevo Huesped y Sincronizacion con el Backoffice", h2_style))
    story.append(
        Paragraph(
            "Paso 1: En http://localhost:5174/register ingresar Nombre Completo, Correo Electronico valido (RFC 5322), Contrasena (minimo 8 caracteres) y seleccionar el rol Huesped (GUEST) o Anfitrion (HOST).",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "Paso 2: Al presionar REGISTRARSE, el sistema genera el hash Argon2id, inicia la sesion automaticamente en el portal publico y sincroniza el nuevo usuario en tiempo real hacia el Directorio de Identidad del Backoffice (:5175/users).",
            bullet_style,
        )
    )
    add_screenshot(
        story,
        IMG_ADMIN_USERS,
        "Figura 2. Directorio de Usuarios y Control de Acceso RBAC en el Backoffice (http://127.0.0.1:5175/users).",
        max_h=2.4 * inch,
    )

    story.append(PageBreak())

    # ================= SECCION 3: PORTAL PUBLICO =================
    story.append(Paragraph("3. Operacion del Portal Publico de Huespedes (Puerto 5174)", h1_style))
    story.append(
        Paragraph(
            "El portal publico ofrece una interfaz minimalista centrada en la transparencia de precios, exploracion por categorias arquitectonicas y busqueda con disponibilidad garantizada.",
            body_style,
        )
    )

    story.append(Paragraph("3.1 Exploracion General y Busqueda Multicriterio", h2_style))
    story.append(
        Paragraph(
            "1. Barra Superior de Busqueda: Permite filtrar por Destino (Toluca, Metepec, Valle de Bravo, Lerma), Fecha de Llegada (Check-In), Fecha de Salida (Check-Out) y Numero de Huespedes.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "2. Validacion de Fechas: Si la fecha de salida es igual o anterior a la fecha de llegada, el sistema rechaza la consulta con codigo HTTP 422.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "3. Conmutador de Impuestos Incluidos: Permite visualizar la tarifa base por noche o el total estimado con comision de servicio (12%) e IVA (16%).",
            bullet_style,
        )
    )
    add_screenshot(
        story,
        IMG_PUBLIC_HOME,
        "Figura 3. Vista principal del Portal Publico (http://localhost:5174) mostrando el catalogo activo y sesion de usuario.",
        max_h=2.9 * inch,
    )

    story.append(Paragraph("3.2 Filtrado por Categorias (Lofts de Autor, Bosque & Montana, etc.)", h2_style))
    story.append(
        Paragraph(
            "Al seleccionar cualquier pestana de categoria (por ejemplo, Lofts de Autor), el portal consulta en tiempo real el inventario sincronizado y muestra unicamente los alojamientos con estado ACTIVE y sin marca de borrado logico (deleted_at = null).",
            body_style,
        )
    )
    add_screenshot(
        story,
        IMG_PUBLIC_LOFTS,
        "Figura 4. Filtrado instantaneo por la categoria 'Lofts de Autor' en el Portal Publico.",
        max_h=2.85 * inch,
    )

    story.append(PageBreak())

    # ================= SECCION 4: ALTA, BAJA Y REACTIVACION =================
    story.append(Paragraph("4. Guia Paso a Paso: Dar de Alta, Baja Logica, Reactivar y Editar Alojamientos", h1_style))
    story.append(
        Paragraph(
            "La gestion integral del inventario se realiza desde la Consola Central de Administracion en http://127.0.0.1:5175/listings. Toda accion ejecutada en esta pantalla se refleja automaticamente en el Portal Publico (http://localhost:5174) en menos de 2.5 segundos sin necesidad de recargar manualmente.",
            body_style,
        )
    )

    story.append(Paragraph("4.1 Como Dar de Alta una Nueva Residencia (+ NUEVA RESIDENCIA)", h2_style))
    alta_steps = [
        [Paragraph("Paso", th_style), Paragraph("Accion en el Sistema", th_style), Paragraph("Validacion y Resultado", th_style)],
        [
            Paragraph("Paso 1", td_bold),
            Paragraph("Ingresar a http://127.0.0.1:5175/listings y hacer clic en el boton negro '+ NUEVA RESIDENCIA' en la esquina superior derecha.", td_style),
            Paragraph("Se abre el modal de registro de alojamiento.", td_style),
        ],
        [
            Paragraph("Paso 2", td_bold),
            Paragraph("Capturar Titulo (minimo 5 caracteres), Categoria (ej. Lofts, Cabanas, Montana), Ciudad (ej. Metepec, Lerma, Toluca) y Tarifa por noche en MXN.", td_style),
            Paragraph("El sistema valida que la tarifa sea mayor a $0.00 MXN (DECIMAL 10,2).", td_style),
        ],
        [
            Paragraph("Paso 3", td_bold),
            Paragraph("Capturar Capacidad de Huespedes, Recamaras, Banos, Coordenadas Geograficas (Latitud [-90, 90] y Longitud [-180, 180]) y URL de fotografia.", td_style),
            Paragraph("Si las coordenadas estan fuera de rango (ej. Latitud 135), el sistema bloquea el registro con HTTP 422.", td_style),
        ],
        [
            Paragraph("Paso 4", td_bold),
            Paragraph("Hacer clic en 'PUBLICAR ALOJAMIENTO'.", td_style),
            Paragraph("Se asigna ID unico, se convierte metadato a WebP, se anexa registro en la cadena SHA-256 y aparece inmediatamente como ACTIVE en el portal publico (:5174).", td_style),
        ],
    ]
    story.append(make_table(alta_steps, [0.8 * inch, 3.2 * inch, 3.0 * inch]))
    add_screenshot(
        story,
        IMG_ADMIN_LISTINGS,
        "Figura 5. Confirmacion de Alta Exitosa ('Residencia Presidencial Lerma' #54) en la Consola Administrativa (:5175/listings).",
        max_h=2.85 * inch,
    )

    story.append(Paragraph("4.2 Como Aplicar Baja Logica (Dar de Baja) y Reactivar un Alojamiento", h2_style))
    story.append(
        Paragraph(
            "Conforme a las reglas de integridad referencial 3NF (ON DELETE RESTRICT), Roomia nunca destruye registros fisicos que puedan tener historial contable o de auditoria. En su lugar utiliza Baja Logica:",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "• Dar de Baja (Boton Rojo 'Dar de Baja'): Asigna la marca de tiempo actual al campo deleted_at y cambia el estado a BAJA LOGICA (PAUSED). De manera inmediata, la propiedad desaparece del Portal Publico (:5174) tanto en 'Todos los espacios' como en su categoria.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• Reactivar (Boton Verde 'Reactivar'): Restaura el campo deleted_at = null y devuelve el estado a ACTIVE. Al instante, la propiedad vuelve a mostrarse en el Portal Publico (:5174) lista para recibir reservaciones.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• Editar (Boton Amarillo 'Editar'): Permite modificar titulo, ciudad, categoria, tarifa por noche, capacidad o fotografia de cualquier residencia, sincronizando los cambios en vivo con el portal de clientes.",
            bullet_style,
        )
    )
    add_screenshot(
        story,
        IMG_ADMIN_SOFT_DELETE,
        "Figura 6. Estado 'BAJA LOGICA' con boton verde 'Reactivar' y estado 'ACTIVE' con boton 'Dar de Baja' en :5175/listings.",
        max_h=2.3 * inch,
    )

    story.append(PageBreak())

    # ================= SECCION 5: RESERVAS, PAGOS, CFDI Y AUDITORIA =================
    story.append(Paragraph("5. Flujo Transaccional de Reservas, Pagos PCI-DSS, CFDI 4.0 y Resenas", h1_style))

    flujo_rows = [
        [Paragraph("Modulo", th_style), Paragraph("Operacion del Usuario", th_style), Paragraph("Control Interno y Respuesta del Sistema", th_style)],
        [
            Paragraph("1. Reserva y Bloqueo de Fechas (M04)", td_bold),
            Paragraph("El huesped selecciona una propiedad en :5174, elige fechas de Check-In y Check-Out y presiona 'Reservar'.", td_style),
            Paragraph("El motor ejecuta bloqueo pesimista (SELECT ... FOR UPDATE / lockedDates). Si otro usuario intenta reservar las mismas fechas simultaneamente, recibe HTTP 409 Conflict (Cero Sobreventa). Calcula con precision exacta: Subtotal + 12% Comision + 16% IVA.", td_style),
        ],
        [
            Paragraph("2. Pasarela Tokenizada Zero-PAN (PCI-DSS 4.0)", td_bold),
            Paragraph("En el modal de pago, el huesped elige tarjeta aprobada (4242...) o simula tarjeta declinada (4000...0999).", td_style),
            Paragraph("Jamás se almacenan numeros PAN ni CVV en la base de datos; solo se guarda el token (pi_...). Si la tarjeta es declinada, devuelve HTTP 402 Payment Required y libera automaticamente las fechas bloqueadas.", td_style),
        ],
        [
            Paragraph("3. Facturacion SAT CFDI 4.0 (Mis Estancias)", td_bold),
            Paragraph("En la seccion 'Mis Estancias' (/trips), el huesped presiona 'Facturar CFDI 4.0' sobre una reserva confirmada.", td_style),
            Paragraph("Valida RFC receptor, Regimen Fiscal y Uso de CFDI (G03) y genera la representacion XML/PDF timbrada con desglose de impuestos.", td_style),
        ],
        [
            Paragraph("4. Resenas Verificadas (M05)", td_bold),
            Paragraph("El huesped marca su estancia como finalizada (COMPLETED) y publica una calificacion de 1 a 5 estrellas.", td_style),
            Paragraph("Si un usuario intenta publicar una resena sin haber completado una estancia en esa propiedad, el sistema bloquea la accion con HTTP 403 Forbidden.", td_style),
        ],
        [
            Paragraph("5. Bitacora Criptografica SHA-256 (M06)", td_bold),
            Paragraph("El administrador consulta http://127.0.0.1:5175/audit para inspeccionar todos los eventos del sistema.", td_style),
            Paragraph("Cada evento (login, alta, baja logica, reserva, pago, bloqueo 403/409/429) encadena el previous_hash con el current_hash (SHA-256) y anonimiza la IP (.XXX) cumpliendo con la LFPDPPP.", td_style),
        ],
    ]
    story.append(make_table(flujo_rows, [1.45 * inch, 2.45 * inch, 3.1 * inch]))

    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("6. Soporte Tecnico, Privacidad (LFPDPPP) y Derechos ARCO", h1_style))
    story.append(
        Paragraph(
            "Roomia cumple con la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP) y el estandar PCI-DSS 4.0:",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "• Centro de Transparencia Legal (/legal): Disponible desde el pie de pagina del Portal Publico para consultar el Aviso de Privacidad Integral, los Terminos y Condiciones de Servicio y la Politica de Seguridad Zero-PAN.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• Ejercicio de Derechos ARCO: Los usuarios pueden solicitar el Acceso, Rectificacion, Cancelacion u Oposicion de sus datos personales directamente desde el modulo de privacidad.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• Exportacion de Reportes Operativos (CSV): En las vistas administrativas de Catalogo y Reservaciones, el boton 'Exportar CSV' genera reportes compatibles con Excel con codificacion UTF-8 para conciliacion contable.",
            bullet_style,
        )
    )

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF generated successfully: {OUTPUT_PDF} ({os.path.getsize(OUTPUT_PDF)} bytes)")


if __name__ == "__main__":
    build_manual()
