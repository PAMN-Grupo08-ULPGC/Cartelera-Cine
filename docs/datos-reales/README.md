# Datos reales de cartelera (Las Palmas de Gran Canaria)

Instantánea de la cartelera real de los cines de Las Palmas de Gran Canaria para tener datos de prueba realistas (películas, sesiones, salas y aforos).

## Cómo regenerarlos

```bash
node docs/datos-reales/recolectar-cartelera.mjs
```

Requiere Node 18 o superior; no tiene dependencias. Genera `cartelera-lpgc-AAAA-MM-DD.json` (cines, películas y sesiones) y `cartelera-lpgc-AAAA-MM-DD-sesiones.csv` con los 7 días siguientes.

Los ficheros generados no se suben al repositorio (están en el `.gitignore`) porque incluyen contenido de terceros. Cada miembro los genera en local; si hace falta compartir la misma instantánea, se pasa por un canal privado. Conviene ejecutar el script solo cuando se necesiten datos nuevos.

## Fuentes y cobertura

| Cine | Fuente | Qué incluye |
|------|--------|-------------|
| OCINE Premium 7 Palmas | Web de venta del cine | Todas las sesiones con sala, formato (2D, ATMOS, Screen X, VOSE, Kids...), aforo y butacas libres; ficha con sinopsis, reparto, tráiler y próximos estrenos |
| Yelmo Cines Las Arenas | eCartelera | Películas, horarios, dirección, teléfono y precios |
| Yelmo Cines Premium Alisios | eCartelera | Películas, horarios, dirección, teléfono y precios |

## Limitaciones

- eCartelera solo publica las sesiones de tarde-noche de Yelmo (a partir de las 20:00) y no indica sala ni aforo.
- Multicines Monopol no publica su cartelera en ninguna fuente encontrada. Cinesa El Muelle, Multicine La Ballena y Multicines Galaxy's aparecen en eCartelera sin sesiones (cerrados o sin datos).
- Los carteles solo se guardan como URL (los de eCartelera); OCINE los sirve incrustados y no se guardan.
- Las butacas libres son las del momento de la recogida.
- Las sinopsis y carteles pertenecen a sus autores: los datos son para uso académico y no deben publicarse.
