import os
import re
import subprocess

ROOMIA_DOCS_DIR = r"C:\Users\Hector\Documents\7mo\Auditorias\roomia"
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

CSS_STYLE = """
@page {
    size: letter;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {
        content: counter(page);
    }
}
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #18181b;
    background: #ffffff;
    line-height: 1.55;
    font-size: 10pt;
    margin: 0;
    padding: 0;
}
.header-bar {
    border-bottom: 2px solid #09090b;
    padding-bottom: 12px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}
.header-brand {
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #09090b;
    text-transform: uppercase;
}
.header-sub {
    font-size: 8pt;
    color: #71717a;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.header-meta {
    font-size: 8.5pt;
    color: #52525b;
    text-align: right;
    font-family: Consolas, monospace;
}
h1 {
    font-size: 17pt;
    font-weight: 800;
    color: #09090b;
    margin-top: 0;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
}
h2 {
    font-size: 13pt;
    font-weight: 700;
    color: #18181b;
    border-bottom: 1px solid #e4e4e7;
    padding-bottom: 6px;
    margin-top: 22px;
    margin-bottom: 12px;
}
h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #27272a;
    margin-top: 16px;
    margin-bottom: 8px;
}
p {
    margin-top: 0;
    margin-bottom: 10px;
}
ul, ol {
    margin-top: 0;
    margin-bottom: 12px;
    padding-left: 20px;
}
li {
    margin-bottom: 4px;
}
table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 18px;
    font-size: 8.5pt;
}
th {
    background-color: #09090b;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #27272a;
    letter-spacing: 0.02em;
}
td {
    padding: 7px 10px;
    border: 1px solid #e4e4e7;
    vertical-align: top;
}
tr:nth-child(even) td {
    background-color: #fafafa;
}
code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.5pt;
    background-color: #f4f4f5;
    padding: 1px 4px;
    border-radius: 4px;
    color: #09090b;
    border: 1px solid #e4e4e7;
}
pre {
    background-color: #18181b;
    color: #f4f4f5;
    padding: 12px 14px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: Consolas, "Courier New", monospace;
    font-size: 8pt;
    line-height: 1.45;
    margin-top: 10px;
    margin-bottom: 16px;
}
pre code {
    background: transparent;
    border: none;
    color: inherit;
    padding: 0;
}
.badge-critica {
    background-color: #fee2e2;
    color: #991b1b;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #f87171;
    font-size: 7.5pt;
}
.badge-alta {
    background-color: #ffedd5;
    color: #9a3412;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #fb923c;
    font-size: 7.5pt;
}
.badge-media {
    background-color: #fef9c3;
    color: #854d0e;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #facc15;
    font-size: 7.5pt;
}
.badge-pass {
    background-color: #dcfce7;
    color: #166534;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #4ade80;
    font-size: 7.5pt;
}
.footer-note {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #e4e4e7;
    font-size: 8pt;
    color: #a1a1aa;
    text-align: center;
}
"""

def md_to_html(md_text, title="INFORME OFICIAL"):
    lines = md_text.splitlines()
    html_lines = []
    in_table = False
    in_code = False
    code_block = []

    for line in lines:
        stripped = line.strip()

        # Code block toggle
        if stripped.startswith("```"):
            if in_code:
                in_code = False
                escaped = "\n".join(code_block).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                html_lines.append(f"<pre><code>{escaped}</code></pre>")
                code_block = []
            else:
                in_code = True
                code_block = []
            continue

        if in_code:
            code_block.append(line)
            continue

        # Tables
        if "|" in line:
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if not parts or all(set(p) <= {"-", ":"} for p in parts):
                continue
            if not in_table:
                in_table = True
                html_lines.append("<table><thead><tr>")
                for p in parts:
                    html_lines.append(f"<th>{inline_format(p)}</th>")
                html_lines.append("</tr></thead><tbody>")
            else:
                html_lines.append("<tr>")
                for p in parts:
                    html_lines.append(f"<td>{inline_format(p)}</td>")
                html_lines.append("</tr>")
            continue
        elif in_table:
            in_table = False
            html_lines.append("</tbody></table>")

        if not stripped:
            continue

        # Headers
        if line.startswith("# "):
            html_lines.append(f"<h1>{inline_format(line[2:])}</h1>")
        elif line.startswith("## "):
            html_lines.append(f"<h2>{inline_format(line[3:])}</h2>")
        elif line.startswith("### "):
            html_lines.append(f"<h3>{inline_format(line[4:])}</h3>")
        elif line.startswith("---"):
            html_lines.append("<hr style='border:none; border-top:1px solid #e4e4e7; margin: 20px 0;'>")
        elif line.startswith("- ") or line.startswith("* "):
            html_lines.append(f"<ul><li>{inline_format(line[2:])}</li></ul>")
        elif re.match(r"^\d+\.\s", line):
            content = re.sub(r"^\d+\.\s", "", line)
            html_lines.append(f"<ol><li>{inline_format(content)}</li></ol>")
        else:
            html_lines.append(f"<p>{inline_format(line)}</p>")

    if in_table:
        html_lines.append("</tbody></table>")

    body_content = "\n".join(html_lines)
    # Merge consecutive <ul> and <ol>
    body_content = re.sub(r"</ul>\s*<ul>", "", body_content)
    body_content = re.sub(r"</ol>\s*<ol>", "", body_content)

    full_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>{CSS_STYLE}</style>
</head>
<body>
<div class="header-bar">
    <div>
        <div class="header-brand">ROOMIA PLATFORM</div>
        <div class="header-sub">Auditoría Técnica & Aseguramiento de Calidad de Software</div>
    </div>
    <div class="header-meta">
        <div>Folio: AUD-2026-V3.1</div>
        <div>Norma: ISO/IEC 25010</div>
    </div>
</div>
{body_content}
<div class="footer-note">
    Documento emitido y certificado bajo el marco de Auditoría de Sistemas de 7mo Semestre · Roomia S.A.P.I. de C.V.
</div>
</body>
</html>"""
    return full_html

def inline_format(text):
    # Escape HTML special chars
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Badges
    text = re.sub(r"\bCR[IÍ]TICA\b", '<span class="badge-critica">CRÍTICA</span>', text)
    text = re.sub(r"\bALTA\b", '<span class="badge-alta">ALTA</span>', text)
    text = re.sub(r"\bMEDIA\b", '<span class="badge-media">MEDIA</span>', text)
    text = re.sub(r"\b(PASS|PASADAS|RESUELTO|VERIFICADO)\b", '<span class="badge-pass">\\1</span>', text)

    # Bold and Italic
    text = re.sub(r"\*\*\*(.*?)\*\*\*", r"<strong><em>\1</em></strong>", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.*?)\*", r"<em>\1</em>", text)

    # Inline Code
    text = re.sub(r"`(.*?)`", r"<code>\1</code>", text)

    # Links
    text = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", text)
    return text

def convert_all():
    docs = [
        ("INFORME_HALLAZGOS_AUDITORIA.md", "INFORME_HALLAZGOS_AUDITORIA.pdf", "INFORME DE HALLAZGOS Y REMEDIACIONES"),
        ("EVIDENCIA_PRUEBAS_AUTOMATIZADAS.md", "EVIDENCIA_PRUEBAS_AUTOMATIZADAS.pdf", "EVIDENCIA DE PRUEBAS AUTOMATIZADAS"),
        ("CAPTURA_ESTADO_BASE_DE_DATOS.md", "CAPTURA_ESTADO_BASE_DE_DATOS.pdf", "CAPTURA Y ESTADO DE BASE DE DATOS"),
    ]

    for md_file, pdf_file, title in docs:
        md_path = os.path.join(ROOMIA_DOCS_DIR, md_file)
        pdf_path = os.path.join(ROOMIA_DOCS_DIR, pdf_file)
        temp_html = os.path.join(ROOMIA_DOCS_DIR, f"temp_{os.path.splitext(md_file)[0]}.html")

        if not os.path.exists(md_path):
            print(f"[SKIP] No existe {md_path}")
            continue

        with open(md_path, "r", encoding="utf-8") as f:
            md_content = f.read()

        html_content = md_to_html(md_content, title=title)
        with open(temp_html, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"[CONVERTING] {md_file} -> {pdf_file}...")
        cmd = [
            EDGE_EXE,
            "--headless",
            "--disable-gpu",
            "--run-all-compositor-stages-before-draw",
            f"--print-to-pdf={pdf_path}",
            temp_html
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)

        if os.path.exists(temp_html):
            os.remove(temp_html)

        if os.path.exists(pdf_path):
            size_kb = os.path.getsize(pdf_path) / 1024
            print(f"[SUCCESS] {pdf_file} generado exitosamente ({size_kb:.1f} KB)")
        else:
            print(f"[ERROR] No se generó {pdf_file}")

if __name__ == "__main__":
    convert_all()
