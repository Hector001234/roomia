# =============================================================================
# Roomia v3.2.0 — Fase 1: Configuración de PostgreSQL 18 + pgAdmin + roomia_db
# Debe ejecutarse con privilegios de Administrador (UAC).
# =============================================================================
$ErrorActionPreference = "Stop"

$PgBin = "C:\Program Files\PostgreSQL\18\bin"
$Psql = Join-Path $PgBin "psql.exe"
$PgData = "C:\Program Files\PostgreSQL\18\data"
$PgHba = Join-Path $PgData "pg_hba.conf"
$PgHbaBak = Join-Path $PgData "pg_hba.conf.roomia_bak"
$ServiceName = "postgresql-x64-18"

$SqlDir = "C:\Users\Hector\Documents\Proyecto_Auditoria\rommia\backend\database\postgresql"
$LogFile = "C:\Users\Hector\Documents\Proyecto_Auditoria\rommia\scripts\setup-postgres18.log"

$PostgresPwd = "RoomiaAdmin2026!"
$AppUser = "roomia_app_user"
$AppPwd = "RoomiaApp2026!"
$DbName = "roomia_db"

function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

"" | Set-Content -Path $LogFile -Encoding UTF8
Write-Log "=== Inicio de configuracion PostgreSQL 18 para Roomia v3.2.0 ==="

if (-not (Test-Path $Psql)) {
    Write-Log "ERROR: No se encontro psql.exe en $Psql"
    exit 1
}
if (-not (Test-Path $PgHba)) {
    Write-Log "ERROR: No se encontro pg_hba.conf en $PgHba"
    exit 1
}

# Respaldo seguro de pg_hba.conf
if (-not (Test-Path $PgHbaBak)) {
    Copy-Item -Path $PgHba -Destination $PgHbaBak -Force
    Write-Log "Respaldo creado en $PgHbaBak"
}
$originalHba = Get-Content -Path $PgHba -Raw

try {
    Write-Log "1) Cambiando temporalmente pg_hba.conf (localhost) a trust..."
    $trustHba = $originalHba -replace '(?m)^(host\s+all\s+all\s+127\.0\.0\.1/32\s+)scram-sha-256', '${1}trust'
    $trustHba = $trustHba -replace '(?m)^(host\s+all\s+all\s+::1/128\s+)scram-sha-256', '${1}trust'
    Set-Content -Path $PgHba -Value $trustHba -NoNewline -Encoding ASCII

    Write-Log "2) Reiniciando servicio $ServiceName..."
    Restart-Service -Name $ServiceName -Force
    Start-Sleep -Seconds 2

    Write-Log "3) Restableciendo contraseña de postgres y creando usuario $AppUser + BD $DbName..."
    $env:PGPASSWORD = ""

    & $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER USER postgres WITH PASSWORD '$PostgresPwd';" 2>&1 | ForEach-Object { Write-Log $_ }
    if ($LASTEXITCODE -ne 0) { throw "Fallo ALTER USER postgres" }

    $roleExists = (& $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$AppUser';") -join ""
    if ($roleExists.Trim() -eq "1") {
        & $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPwd';" 2>&1 | ForEach-Object { Write-Log $_ }
        Write-Log "Rol $AppUser actualizado."
    } else {
        & $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE $AppUser WITH LOGIN PASSWORD '$AppPwd';" 2>&1 | ForEach-Object { Write-Log $_ }
        Write-Log "Rol $AppUser creado."
    }
    if ($LASTEXITCODE -ne 0) { throw "Fallo creacion/actualizacion de $AppUser" }

    $dbExists = (& $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName';") -join ""
    if ($dbExists.Trim() -ne "1") {
        & $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DbName OWNER $AppUser ENCODING 'UTF8';" 2>&1 | ForEach-Object { Write-Log $_ }
        if ($LASTEXITCODE -ne 0) { throw "Fallo CREATE DATABASE $DbName" }
        Write-Log "Base de datos $DbName creada."
    } else {
        & $Psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER DATABASE $DbName OWNER TO $AppUser;" 2>&1 | ForEach-Object { Write-Log $_ }
        Write-Log "Base de datos $DbName ya existia; propietario asegurado ($AppUser)."
    }
}
finally {
    Write-Log "4) Restaurando pg_hba.conf a scram-sha-256..."
    Set-Content -Path $PgHba -Value $originalHba -NoNewline -Encoding ASCII
    Write-Log "5) Reiniciando servicio $ServiceName con autenticacion scram-sha-256..."
    Restart-Service -Name $ServiceName -Force
    Start-Sleep -Seconds 2
}

Write-Log "6) Verificando conexion con scram-sha-256 como postgres y cargando scripts SQL..."
$env:PGPASSWORD = $PostgresPwd

$scripts = @(
    "01_schema_3fn.sql",
    "02_data_audit_triggers.sql",
    "03_seed_synthetic_data.sql"
)

foreach ($s in $scripts) {
    $fullPath = Join-Path $SqlDir $s
    Write-Log "Ejecutando $s..."
    & $Psql -h 127.0.0.1 -p 5432 -U postgres -d $DbName -1 -v ON_ERROR_STOP=1 -f $fullPath 2>&1 | ForEach-Object { Write-Log $_ }
    if ($LASTEXITCODE -ne 0) { throw "Error ejecutando $s" }
}

Write-Log "7) Otorgando permisos de esquema/tablas/secuencias a $AppUser (y bloqueando UPDATE/DELETE en audit_logs)..."
$grantsSql = @"
GRANT USAGE, CREATE ON SCHEMA public TO $AppUser;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $AppUser;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO $AppUser;
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_logs FROM $AppUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO $AppUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO $AppUser;
"@
& $Psql -h 127.0.0.1 -p 5432 -U postgres -d $DbName -v ON_ERROR_STOP=1 -c $grantsSql 2>&1 | ForEach-Object { Write-Log $_ }
if ($LASTEXITCODE -ne 0) { throw "Error otorgando permisos a $AppUser" }

Write-Log "8) Validando con 04_auditor_verification_queries.sql usando $AppUser (scram-sha-256)..."
$env:PGPASSWORD = $AppPwd
$verifyPath = Join-Path $SqlDir "04_auditor_verification_queries.sql"
& $Psql -h 127.0.0.1 -p 5432 -U $AppUser -d $DbName -v ON_ERROR_STOP=1 -f $verifyPath 2>&1 | ForEach-Object { Write-Log $_ }
if ($LASTEXITCODE -ne 0) { throw "Error en validacion con $AppUser" }

Write-Log "=== FASE 1 COMPLETADA CON EXITO ==="
