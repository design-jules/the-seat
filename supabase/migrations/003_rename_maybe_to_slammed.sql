-- Rename persona 'maybe' to 'slammed'
alter table sessions drop constraint sessions_persona_check;

update sessions set persona = 'slammed' where persona = 'maybe';

alter table sessions add constraint sessions_persona_check
  check (persona in ('skeptic', 'hype', 'slammed'));
