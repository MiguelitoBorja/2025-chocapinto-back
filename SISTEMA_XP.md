# 🎮 Sistema de XP y Gamificación - Booksy

## ✅ Sistema Implementado

### **XP por Acciones - Alta Prioridad**

| Acción | XP | Estado | Descripción |
|--------|----|---------| ----------- |
| 📚 Completar libro | **100 XP** | ✅ Implementado | Cuando un libro pasa a estado "leído" |
| 🗳️ Votar | **10 XP** | ✅ Implementado | Por cada voto en un período de votación |
| 🎉 Unirse a club | **15 XP** | ✅ Implementado | Al ser aceptado en un club |
| 💬 Primer comentario | **20 XP** | ✅ Implementado | Primer comentario en un libro específico |
| 💬 Comentarios adicionales | **5 XP** | ✅ Implementado | Comentarios subsecuentes en el mismo libro |
| ✋ Confirmar asistencia | **5 XP** | ✅ Implementado | Al confirmar que asistirás a una sesión |
| 📍 Asistir a sesión | **25 XP** | ✅ Implementado | Cuando el moderador registra tu asistencia real |

---

## 🏗️ Arquitectura del Sistema

### **1. Archivo Central: `utils/XPRewards.js`**

Contiene:
- **`XP_REWARDS`**: Objeto con todas las cantidades de XP por acción
- **`otorgarXP(userId, tipoAccion, cantidad?)`**: Función centralizada que:
  - Calcula nuevo XP y nivel
  - Actualiza la base de datos
  - Envía notificación si sube de nivel
  - Logea la acción para debugging

### **2. Integración en Controladores**

#### **`periodo.controller.js`** - Votar
```javascript
// Después de registrar el voto
await otorgarXP(user.id, 'VOTAR');
```
**Resultado**: +10 XP cada vez que el usuario vota

---

#### **`club.controller.js`** - Unirse a Club
```javascript
// Al aceptar solicitud
await otorgarXP(solicitud.userId, 'UNIRSE_CLUB');
```
**Resultado**: +15 XP cuando es aceptado en un club

---

#### **`comment.controller.js`** - Comentar
```javascript
// Verificar si es el primer comentario
const comentariosAnteriores = await prisma.comment.count({
  where: { userId: user.id, clubBookId: clubBook.id }
});

if (comentariosAnteriores === 0) {
  await otorgarXP(user.id, 'PRIMER_COMENTARIO_LIBRO'); // +20 XP
} else {
  await otorgarXP(user.id, 'COMENTARIO_ADICIONAL'); // +5 XP
}
```
**Resultado**: +20 XP primer comentario, +5 XP por los siguientes

---

#### **`sesion.controller.js`** - Confirmar y Asistir
```javascript
// Al confirmar asistencia (solo si estado === 'ASISTIRE')
await otorgarXP(user.id, 'CONFIRMAR_ASISTENCIA'); // +5 XP

// Al registrar asistencia real
for (const asistencia of asistencias) {
  await otorgarXP(asistencia.userId, 'ASISTIR_SESION'); // +25 XP
}
```
**Resultado**: +5 XP al confirmar, +25 XP al asistir efectivamente

---

## 📊 Flujo de Experiencia

### **Ejemplo de Usuario Nuevo**

1. **Se une a un club** → +15 XP (Total: 15 XP)
2. **Vota por un libro** → +10 XP (Total: 25 XP)
3. **Comenta el libro** → +20 XP primer comentario (Total: 45 XP)
4. **Confirma asistencia a sesión** → +5 XP (Total: 50 XP)
5. **Asiste a la sesión** → +25 XP (Total: 75 XP)
6. **Completa el libro** → +100 XP (Total: 175 XP)
7. **Comenta de nuevo** → +5 XP (Total: 180 XP)

### **Niveles**
- Cada nivel requiere **500 XP**
- Nivel 1 → Nivel 2: 500 XP
- Nivel 2 → Nivel 3: 1000 XP total
- Nivel 3 → Nivel 4: 1500 XP total

---

## 🎯 Notificaciones Automáticas

Cuando un usuario sube de nivel, recibe automáticamente:

**Título**: 🎉 ¡Subiste de nivel!

**Mensaje**: ¡Felicidades! Ahora eres nivel X. Ganaste Y XP por [acción].

**Datos incluidos**:
- Nivel anterior
- Nivel nuevo
- XP ganado en esa acción
- XP total actual
- Tipo de acción que provocó el nivel

---

## 🧪 Testing

### **1. Probar Votar (+10 XP)**
```bash
POST /api/periodo/:periodoId/votar
Body: { "opcionId": 1, "username": "test" }
```
**Verificar**: Console debe mostrar `✨ test ganó 10 XP por VOTAR`

---

### **2. Probar Unirse a Club (+15 XP)**
1. Enviar solicitud al club
2. Que un moderador la acepte
3. **Verificar**: Usuario recibe notificación + 15 XP

---

### **3. Probar Comentarios (+20 XP / +5 XP)**
```bash
POST /api/club/:clubId/book/:bookId/comments
Body: { "content": "Mi comentario", "username": "test" }
```
**Primer comentario**: +20 XP
**Siguientes**: +5 XP

---

### **4. Probar Asistencia (+5 XP + +25 XP)**

**Confirmar**:
```bash
PUT /api/sesiones/:sesionId/confirmar
Body: { "estado": "ASISTIRE", "username": "test" }
```
**Verificar**: +5 XP

**Registrar asistencia real** (Moderador):
```bash
POST /api/sesiones/:sesionId/asistencia
Body: { "usuariosPresentes": [1, 2, 3], "username": "moderador" }
```
**Verificar**: Cada asistente gana +25 XP

---

## 📈 Logs del Sistema

El sistema genera logs claros para debugging:

```
✨ juanito ganó 10 XP por VOTAR (50 → 60 XP)
✨ maria ganó 15 XP por UNIRSE_CLUB (100 → 115 XP)
🎉 pedro subió de nivel 1 → 2!
✨ ana ganó 20 XP por PRIMER_COMENTARIO_LIBRO (480 → 500 XP)
🎉 ana subió de nivel 1 → 2!
```

---

## 🔮 Próximas Mejoras (No Implementadas Aún)

### **Media Prioridad**
- Crear club: +50 XP
- Agregar libro: +10 XP
- Crear votación: +20 XP
- Organizar sesión: +30 XP

### **Baja Prioridad**
- Milestones (5 libros: +200 XP, 10 libros: +500 XP)
- Sistema de rachas diarias
- Bonus por velocidad de lectura
- Sistema de likes en comentarios (+2 XP por like)
- Promoción a moderador: +100 XP

---

## 🛠️ Mantenimiento

### **Agregar Nueva Acción con XP**

1. **Agregar a `XP_REWARDS`** en `utils/XPRewards.js`:
```javascript
const XP_REWARDS = {
  // ...
  MI_NUEVA_ACCION: 30,
};
```

2. **Llamar en el controlador correspondiente**:
```javascript
const { otorgarXP } = require('../utils/XPRewards');

// Después de la acción
await otorgarXP(userId, 'MI_NUEVA_ACCION');
```

3. **Listo!** El sistema automáticamente:
   - Otorga el XP
   - Calcula si sube de nivel
   - Envía notificación si corresponde
   - Logea la acción

---

## 🎨 Frontend - Badge de XP

El header ya muestra:
- Nivel actual del usuario
- Barra de progreso de XP
- XP actual / XP necesario para siguiente nivel

Se actualiza automáticamente cuando ganas XP (mediante polling cada 30s de notificaciones).

---

## 📊 Estadísticas de Balance

**Para alcanzar Nivel 2 (500 XP):**
- 5 libros completados
- O 50 votos
- O 33 uniones a clubes
- O 25 primeros comentarios
- O 20 asistencias a sesiones
- **Combinación realista**: 3 libros + 10 votos + 5 comentarios + 3 sesiones = 520 XP

**Sistema balanceado para** engagement activo y constante.
