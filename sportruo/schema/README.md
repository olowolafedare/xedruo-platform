# SPORTRUO Database Foundation

This directory contains the database blueprint for the future dedicated SPORTRUO Supabase project.

**Safety rule:** these migrations are documentation/development assets only. They must NOT be applied to the existing Xedruo shared Supabase project.

## Planned core tables

- profiles
- athletes
- clubs
- academies
- leagues
- competitions
- venues
- registrations
- talent_opportunities
- scouting_reports
- transfers
- statistics
- events
- sponsorships
- notifications

## Security model

Every company-specific row will be scoped to SPORTRUO and protected with RLS. Xedruo Identity will provide the global user identity; SPORTRUO will own sports-domain authorization and records.

## Deployment rule

When funding is available, create a dedicated Supabase project named `SPORTRUO` under the Xedruo organization and apply the migrations here. Never apply them to the existing company database.