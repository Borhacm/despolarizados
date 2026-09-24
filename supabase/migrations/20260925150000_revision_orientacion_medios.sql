-- Revisión de la orientación editorial y de los grupos propietarios (25 sept 2026).
-- Orientación: clasificación propia y orientativa, ver /metodologia.

update public.medios set sesgo = 'centro-derecha' where slug = 'el-confidencial';
update public.medios set sesgo = 'centro-izquierda' where slug = 'el-pais';
update public.medios set sesgo = 'centro-derecha' where slug = 'el-independiente';
update public.medios set sesgo = 'centro-derecha', ownership = 'Grupo Henneo' where slug = 'heraldo';
update public.medios set sesgo = 'centro' where slug = 'la-vanguardia';
update public.medios set sesgo = 'centro' where slug = 'cinco-dias';
update public.medios set sesgo = 'centro-derecha' where slug = 'moncloa';
update public.medios set ownership = 'Vocento' where slug = 'diario-sur';
update public.medios set ownership = 'Vocento' where slug = 'el-comercio';
update public.medios set ownership = 'Vocento' where slug = 'las-provincias';
update public.medios set ownership = 'Grupo Joly' where slug = 'malaga-hoy';
