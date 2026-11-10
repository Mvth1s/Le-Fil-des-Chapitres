#!/usr/bin/env bash
# Initialisation de la base locale, executee UNE SEULE FOIS par l'image
# officielle postgres, au premier demarrage (volume de donnees vide), avec le
# superuser "postgres". Pour la rejouer, il faut repartir d'un volume vide.
#
# Principe du moindre privilege, trois comptes distincts :
#   - lfdc_owner : proprietaire de la base et du schema public. Seul compte
#                  autorise a modifier la structure (CREATE/ALTER/DROP), donc
#                  utilise uniquement pour les migrations.
#   - lfdc_app   : compte du backend au quotidien. DML seulement
#                  (SELECT/INSERT/UPDATE/DELETE) : une injection SQL ou un bug
#                  ne peut ni supprimer une table ni modifier le schema.
#   - lfdc_ro    : lecture seule (SELECT), pour consulter la base (Adminer,
#                  psql) sans risque d'ecriture accidentelle.
#
# Les droits fins (tables, sequences, droits par defaut) sont poses par
# backend/database/sql/grants.sql, monte en /sql/grants.sql et execute ici en
# tant que lfdc_owner, pour que les ALTER DEFAULT PRIVILEGES s'appliquent aux
# tables que lfdc_owner creera lors des migrations.
#
# Les mots de passe arrivent par variables d'environnement (voir le .env
# racine) et sont transmis a psql via "-v" puis ":'var'" : psql les echappe
# comme litteraux SQL, aucune concatenation shell dans le SQL.

set -Eeo pipefail

# Echec explicite si un mot de passe manque ou est vide.
: "${DB_OWNER_PASSWORD:?DB_OWNER_PASSWORD est vide ou absent}"
: "${DB_APP_PASSWORD:?DB_APP_PASSWORD est vide ou absent}"
: "${DB_RO_PASSWORD:?DB_RO_PASSWORD est vide ou absent}"

GRANTS_FILE=/sql/grants.sql
# -f et non -r : si le fichier n'existe pas sur l'hote, docker cree un
# dossier vide a sa place au montage.
if [ ! -f "$GRANTS_FILE" ]; then
  echo "01-roles.sh : $GRANTS_FILE introuvable (montage manquant ?)" >&2
  exit 1
fi

DB_NAME=le_fil_des_chapitres

# 1. Roles et base, connecte en superuser sur la base "postgres".
#    \gexec execute la requete generee par chaque SELECT ; le WHERE NOT EXISTS
#    rend le bloc rejouable sans erreur. CREATE DATABASE ne peut pas tourner
#    dans un DO/transaction, d'ou ce motif plutot qu'un bloc PL/pgSQL.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v owner_pw="$DB_OWNER_PASSWORD" \
  -v app_pw="$DB_APP_PASSWORD" \
  -v ro_pw="$DB_RO_PASSWORD" \
  -v db_name="$DB_NAME" <<'SQL'
SELECT format('CREATE ROLE lfdc_owner LOGIN PASSWORD %L', :'owner_pw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lfdc_owner') \gexec
SELECT format('CREATE ROLE lfdc_app LOGIN PASSWORD %L', :'app_pw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lfdc_app') \gexec
SELECT format('CREATE ROLE lfdc_ro LOGIN PASSWORD %L', :'ro_pw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lfdc_ro') \gexec
SELECT format('CREATE DATABASE %I OWNER lfdc_owner', :'db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL

# 2. Schema public, toujours en superuser mais dans la nouvelle base :
#    lfdc_owner en devient proprietaire, et plus personne d'autre ne peut y
#    creer d'objet (deja le defaut depuis PostgreSQL 15, pose explicitement).
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_NAME" <<'SQL'
ALTER SCHEMA public OWNER TO lfdc_owner;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL

# 3. Droits applicatifs, en tant que lfdc_owner (les droits par defaut
#    s'attachent au role qui les declare). PGPASSWORD au cas ou la connexion
#    locale ne serait pas en "trust" pendant l'initialisation.
PGPASSWORD="$DB_OWNER_PASSWORD" psql -v ON_ERROR_STOP=1 \
  --username lfdc_owner --dbname "$DB_NAME" \
  -v app_role=lfdc_app -v ro_role=lfdc_ro \
  -f "$GRANTS_FILE"

echo "01-roles.sh : roles lfdc_owner, lfdc_app, lfdc_ro et base $DB_NAME prets."
