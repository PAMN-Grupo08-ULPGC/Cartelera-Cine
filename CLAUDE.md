# Cartelera de Cine

Trabajo final de PAMN (Programación de Aplicaciones Móviles Nativas, EII - ULPGC, curso 2026-2027). Equipo de dos personas: Joel Morera Apaza (`YoelRuso`) y Alejandro Celis Hernández Delgado (`alejandrohdelgado`).

App Android nativa en Kotlin: cartelera de cine con compra de entradas (pago simulado), muchos usuarios y compras concurrentes, y una parte para empleados que validan las entradas escaneando un QR. Backend propio (por definir).

El enunciado y la rúbrica están en `docs/enunciado/Trabajo_final_PAMN.pdf`. Se evalúan también el proceso en GitHub, la memoria y una defensa en la que cada miembro debe explicar las decisiones y el código.

## Fase actual

Análisis: definiendo requisitos y casos de uso (milestone `M1 - Análisis y Diseño`, issue #2 y sus sub-issues).

**La arquitectura, el modelo de datos y las tecnologías aún no están decididos y los deciden los dos miembros del equipo juntos.** No propongas ni añadas al repositorio decisiones de arquitectura o diagramas de diseño salvo que se pida expresamente. Los requisitos y casos de uso deben describir *qué* hace el sistema, no *cómo* (sin nombrar frameworks ni librerías).

## Documentación

- `docs/memoria/memoria.tex`: memoria en LaTeX (pdfLaTeX / Overleaf). Contiene actores, RF, RNF, historias de usuario y especificación de casos de uso. Las figuras están en `docs/memoria/figuras/`.
- `docs/diagramas/`: diagramas con fuente editable (`.puml`) e imagen (`.svg`). Si se cambia un diagrama, hay que actualizar también su SVG y el PNG de la memoria.
- Identificadores: `ACT-xx` actores, `RF-xx` / `RNF-xx` requisitos, `HU-xx` historias de usuario, `CU-xx` casos de uso, `CP-xx` casos de prueba. Mantenerlos coherentes entre la memoria, los diagramas y las issues.
- Idioma de la documentación, issues, PR y commits: español.

## Flujo de trabajo en Git y GitHub

- Nunca se trabaja directamente en `main`: todo cambio llega mediante una rama y un pull request revisado por el otro miembro.
- Ramas: `tipo/descripcion-corta` en minúsculas con guiones, sin tildes; con número de issue si existe (`feature/7-cartelera-busqueda`). Tipos: `feature/`, `fix/`, `docs/`, `chore/`, `test/`.
- Commits con Conventional Commits en español e imperativo: `docs: añadir ...`, `feat: ...`, `fix: ...`, `chore: ...`.
- Issues para trabajo que hay que planificar o repartir (una por historia de usuario, tareas, bugs). Los cambios pequeños de mantenimiento van en PR sin issue.
- En los PR: `Closes #N` solo si el PR termina la issue; si es un avance parcial, `Relacionado con #N`. El trabajo grande se divide en sub-issues.
- PR con etiqueta, milestone y a Alejandro o Joel como revisor. No hacer merge de un PR propio sin aprobación.
- Las acciones visibles en GitHub (crear issues, PR, comentarios, merges, push) se confirman antes con el usuario.

### Commits

- Sin coautoría: nunca añadir `Co-Authored-By`, "Generated with Claude" ni ninguna mención a Claude o a IA en commits, PR o código. El autor es solo quien commitea.
- Primera línea ≤ 72 caracteres, sin punto final, minúscula inicial. Cuerpo opcional (tras línea en blanco) explicando el *por qué*.
- Un commit = un cambio lógico y atómico; no mezclar contenido, correcciones y formato.
- Revisar `git status` y `git diff --staged` antes de commitear y añadir archivos concretos, no `git add .` a ciegas.
- Hacer commit solo cuando el usuario lo pida.
- Sin permiso explícito, nada de `--no-verify`, `push --force`, `reset --hard` ni `--amend` de commits ya publicados.
- No commitear secretos, claves, `.env`, binarios de compilación ni archivos del IDE.

## Naming

- Nombres descriptivos y en un solo idioma; sin abreviaturas crípticas.
- Seguir la convención del lenguaje (en Kotlin: `camelCase` para variables y funciones, `PascalCase` para clases, `UPPER_SNAKE_CASE` para constantes) y la del código existente.
- Booleanos con prefijo de estado (`estaActivo`, `hayDatos`) y sin números mágicos: constantes con nombre.
- Archivos de documentación y figuras en minúsculas con guiones, sin tildes ni espacios.
