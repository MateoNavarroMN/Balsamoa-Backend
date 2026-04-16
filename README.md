# **Guía del Equipo: Flujo de Trabajo (Git Workflow)**

Para mantener el proyecto organizado y cumplir con los criterios de evaluación de la materia, utilizaremos el **Feature Branch Workflow**. Esto asegura que la rama `main` siempre tenga código funcional y que no nos pisemos el trabajo entre nosotros.

---

## **Regla de Oro**
**La rama `main` es sagrada.** Nunca escribas código directamente en `main`. Todo se desarrolla en ramas temporales que luego se integran mediante un Pull Request.

---

## **El Ciclo de Vida de una Tarea**
Cada vez que comiences una tarea del tablero Kanban, seguí estos pasos:

### **1. Sincronizar el repositorio**
Antes de empezar, asegurate de tener lo último que subió el equipo a la rama principal.
```bash
git checkout main
git pull origin main
```

### **2. Crear una rama para la tarea**
Creá una rama nueva con un nombre descriptivo. Usamos el prefijo `feature/` para funcionalidades o `fix/` para correcciones.
```bash
git checkout -b feature/nombre-de-la-tarea
```

### **3. Desarrollar y realizar Commits**
Programá tus cambios y guardalos localmente con mensajes claros y descriptivos.
```bash
git add .
git commit -m "feat: descripción corta de lo que hiciste"
```

### **4. Subir la rama a GitHub**
Publicá tu rama en el repositorio remoto para que el equipo pueda verla.
```bash
git push origin feature/nombre-de-la-tarea
```

### **5. Abrir un Pull Request (PR)**
1. Entrá al repositorio en GitHub.
2. Hacé clic en el botón **"Compare & pull request"**.
3. Asigná a un compañero para que revise tu código.
4. Mové tu tarjeta en el Project a la columna **"En Revisión"**.

### **6. Revisión y Merge**
Un compañero debe revisar los cambios. Si todo está correcto, aprobará el PR y se realizará el Merge a la rama `main`. Una vez hecho esto:
- Mové la tarjeta a **"Finalizado"**.
- Borrá la rama local: `git branch -d feature/nombre-de-la-tarea.`

---

## **Resolución de Conflictos**
Si GitHub indica que hay conflictos de mezcla (Merge Conflicts):
1. No te asustes, sucede cuando dos personas tocan la misma línea.
2. VS Code te mostrará visualmente las diferencias. Elegí qué código debe quedar.
3. Guardá el archivo, hacé un nuevo `git add` y `git commit` para finalizar la resolución.
4. Si tenés dudas, consultalo con el equipo antes de confirmar.