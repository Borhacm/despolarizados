-- Prensa Ibérica responde 406 («WAF Forbidden») a cualquier cliente que no sea un navegador.
-- No intentamos esquivar su protección: los desactivamos hasta tener acceso autorizado.
-- El Periódico (Cataluña) además sirve un XML que no se puede analizar.
update public.medios
set active = false
where slug in (
  'levante-emv', 'el-correo-gallego', 'faro-de-vigo', 'la-opinion-murcia',
  'la-opinion-malaga', 'informacion-alicante', 'el-periodico-extremadura',
  'el-periodico-catalunya', 'el-periodico', 'regio7', 'superdeporte'
);
