import os
import sys
import subprocess

sys.path.insert(0, r'C:\Users\Hector\Documents\Proyecto_Auditoria\rommia\scripts')
from build_roomia_audit_pdfs import md_to_html, EDGE_EXE, ROOMIA_DOCS_DIR

docs = [
    ('01_seguridad_de_la_aplicacion.md', '01_seguridad_de_la_aplicacion.pdf', 'ENTREGA 01: SEGURIDAD DE LA APLICACIÓN'),
    ('02_fugas_de_informacion_y_privacidad.md', '02_fugas_de_informacion_y_privacidad.pdf', 'ENTREGA 02: FUGAS DE INFORMACIÓN Y PRIVACIDAD'),
    ('03_rendimiento_y_capacidad.md', '03_rendimiento_y_capacidad.pdf', 'ENTREGA 03: RENDIMIENTO Y CAPACIDAD'),
    ('04_optimizacion_de_recursos_y_arquitectura.md', '04_optimizacion_de_recursos_y_arquitectura.pdf', 'ENTREGA 04: OPTIMIZACIÓN DE RECURSOS Y ARQUITECTURA'),
    ('07_confiabilidad_integracion_y_operacion.md', '07_confiabilidad_integracion_y_operacion.pdf', 'ENTREGA 07: CONFIABILIDAD, INTEGRACIÓN Y OPERACIÓN'),
]

for md_file, pdf_file, title in docs:
    md_path = os.path.join(ROOMIA_DOCS_DIR, md_file)
    pdf_path = os.path.join(ROOMIA_DOCS_DIR, pdf_file)
    temp_html = os.path.join(ROOMIA_DOCS_DIR, f'temp_{os.path.splitext(md_file)[0]}.html')
    with open(md_path, 'r', encoding='utf-8') as f:
        html_content = md_to_html(f.read(), title=title)
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)
    subprocess.run([EDGE_EXE, '--headless', '--disable-gpu', '--run-all-compositor-stages-before-draw', f'--print-to-pdf={pdf_path}', temp_html], capture_output=True)
    if os.path.exists(temp_html):
        os.remove(temp_html)
    print(pdf_file, round(os.path.getsize(pdf_path) / 1024, 1), 'KB')
