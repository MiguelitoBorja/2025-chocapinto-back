// utils/XPRewards.js
const prisma = require('../db');
const { computeNewXpAndLevel } = require('./XPSystem');
const { crearNotificacion } = require('../controllers/notificaciones.controller');

const XP_REWARDS = {
  // Lectura
  COMPLETAR_LIBRO: 100,
  VOTAR: 10,
  PRIMER_COMENTARIO_LIBRO: 20,
  COMENTARIO_ADICIONAL: 5,
  
  // Club
  CREAR_CLUB: 50,
  UNIRSE_CLUB: 15,
  AGREGAR_LIBRO: 10,
  CREAR_VOTACION: 20,
  
  // Sesiones
  CONFIRMAR_ASISTENCIA: 5,
  ASISTIR_SESION: 25,
  ORGANIZAR_SESION: 30,
  
  // Milestones (futuro)
  MILESTONE_5_LIBROS: 200,
  MILESTONE_10_LIBROS: 500,
};

/**
 * Otorga XP a un usuario y notifica si sube de nivel
 * @param {number} userId - ID del usuario
 * @param {string} tipoAccion - Tipo de acción (debe estar en XP_REWARDS)
 * @param {number|null} cantidad - Cantidad personalizada de XP (opcional)
 * @returns {Promise<Object>} Resultado con info de nivel
 */
async function otorgarXP(userId, tipoAccion, cantidad = null) {
  try {
    const xpGanado = cantidad || XP_REWARDS[tipoAccion] || 0;
    
    if (xpGanado === 0) {
      console.warn(`⚠️ No hay XP definido para: ${tipoAccion}`);
      return { levelUp: false, xpGanado: 0 };
    }

    // Obtener usuario actual
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, username: true }
    });

    if (!usuario) {
      console.error(`❌ Usuario ${userId} no encontrado`);
      return { levelUp: false, xpGanado: 0 };
    }

    const oldLevel = usuario.level || 1;
    const oldXp = usuario.xp || 0;
    
    // Computar nuevo XP y nivel
    const { xp: newXp, level: newLevel } = computeNewXpAndLevel(usuario, xpGanado);

    // Actualizar XP y nivel
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXp,
        level: newLevel
      }
    });

    console.log(`✨ ${usuario.username} ganó ${xpGanado} XP por ${tipoAccion} (${oldXp} → ${newXp} XP)`);

    // Si subió de nivel, enviar notificación
    if (newLevel > oldLevel) {
      const accionLegible = tipoAccion.toLowerCase().replace(/_/g, ' ');
      
      await crearNotificacion(
        userId,
        'NIVEL_SUBIDO',
        '🎉 ¡Subiste de nivel!',
        `¡Felicidades! Ahora eres nivel ${newLevel}. Ganaste ${xpGanado} XP por ${accionLegible}.`,
        { 
          oldLevel, 
          newLevel, 
          xpGanado, 
          xpTotal: newXp,
          accion: tipoAccion 
        }
      ).catch(err => console.error('Error al notificar nivel subido:', err));
      
      console.log(`🎉 ${usuario.username} subió de nivel ${oldLevel} → ${newLevel}!`);
    }

    return {
      levelUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
      xpGanado,
      xpTotal: newXp
    };

  } catch (error) {
    console.error(`❌ Error al otorgar XP (${tipoAccion}):`, error);
    return { levelUp: false, xpGanado: 0, error: error.message };
  }
}

/**
 * Obtiene un mensaje descriptivo según el tipo de acción
 */
function getAccionDescripcion(tipoAccion) {
  const descripciones = {
    VOTAR: 'votar en una votación',
    UNIRSE_CLUB: 'unirte a un club',
    PRIMER_COMENTARIO_LIBRO: 'tu primer comentario en este libro',
    COMENTARIO_ADICIONAL: 'comentar',
    CONFIRMAR_ASISTENCIA: 'confirmar asistencia a una sesión',
    ASISTIR_SESION: 'asistir a una sesión',
    COMPLETAR_LIBRO: 'completar un libro',
    CREAR_CLUB: 'crear un club',
    AGREGAR_LIBRO: 'agregar un libro al club',
    CREAR_VOTACION: 'crear una votación',
    ORGANIZAR_SESION: 'organizar una sesión'
  };
  
  return descripciones[tipoAccion] || tipoAccion.toLowerCase().replace(/_/g, ' ');
}

module.exports = {
  XP_REWARDS,
  otorgarXP,
  getAccionDescripcion
};
