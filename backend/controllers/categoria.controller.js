const prisma = require('../db');
const { validateRequiredFields } = require('../utils/validateFields');

const CATEGORIAS_ESTATICAS = ["Ficción", "No Ficción", "Ciencia Ficción", "Fantasía", "Ensayo"];

/**
 * Verifica si el usuario tiene permisos de owner/moderador en el club
 */
const verificarPermisosClub = async (userId, clubId) => {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { memberships: true }
  });

  if (!club) {
    return { hasPermission: false, error: 'Club no encontrado' };
  }

  const isOwner = club.id_owner === userId;
  if (isOwner) {
    return { hasPermission: true, role: 'OWNER' };
  }

  const member = club.memberships.find(m => m.userId === userId);
  const isModerator = member?.role === 'MODERADOR';
  
  if (isModerator) {
    return { hasPermission: true, role: 'MODERADOR' };
  }

  return { hasPermission: false, error: 'No tienes permisos en este club' };
};

/**
 * Obtiene todas las categorías disponibles (globales + del club)
 * Ruta: GET /api/categorias?clubId=123
 */
const getCategorias = async (req, res) => {
  try {
    const { clubId } = req.query;

    // Asegurar que existen las categorías globales
    for (const nombre of CATEGORIAS_ESTATICAS) {
      await prisma.categoria.upsert({
        where: { nombre_clubId: { nombre, clubId: null } },
        update: {},
        create: { nombre, clubId: null }
      });
    }
    
    // Obtener categorías globales + del club específico
    const whereClause = clubId 
      ? {
          OR: [
            { clubId: null },              // Categorías globales
            { clubId: Number(clubId) }     // Categorías del club
          ]
        }
      : { clubId: null };  // Solo globales si no hay clubId

    const categorias = await prisma.categoria.findMany({
      where: whereClause,
      orderBy: { nombre: 'asc' }
    });
    
    res.json({ success: true, categorias });
  } catch (error) {
    console.error("[ERROR] Error al obtener categorías:", error);
    res.status(500).json({ success: false, message: "Error al obtener categorías" });
  }
};

/**
 * Crea una nueva categoría personalizada para un club
 * Ruta: POST /api/categorias
 */
const createCategoria = async (req, res) => {
  try {
    const { nombre, clubId } = req.body;
    const userId = req.user?.userId;

    const missingFields = validateRequiredFields(['nombre', 'clubId'], req.body);
    if (missingFields) {
      return res.status(400).json({ 
        success: false, 
        message: "Nombre y clubId son requeridos" 
      });
    }

    // Verificar permisos del usuario en el club
    const permisos = await verificarPermisosClub(userId, Number(clubId));
    if (!permisos.hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: permisos.error || "No tienes permisos para crear categorías en este club" 
      });
    }

    // Verificar que no exista ya en este club
    const existingCategoria = await prisma.categoria.findUnique({
      where: { 
        nombre_clubId: { 
          nombre: nombre.trim(), 
          clubId: Number(clubId) 
        }
      }
    });

    if (existingCategoria) {
      return res.status(400).json({ 
        success: false, 
        message: "Esta categoría ya existe en tu club" 
      });
    }

    const categoria = await prisma.categoria.create({
      data: { 
        nombre: nombre.trim(),
        clubId: Number(clubId)
      }
    });

    res.json({ success: true, categoria });
  } catch (error) {
    console.error("[ERROR] Error al crear categoría:", error);
    res.status(500).json({ success: false, message: "Error al crear categoría" });
  }
};

/**
 * Actualiza una categoría existente
 * Ruta: PUT /api/categorias/:id
 */
const updateCategoria = async (req, res) => {
  try {
    const categoriaId = Number(req.params.id);
    const { nombre } = req.body;
    const userId = req.user?.userId;

    if (!categoriaId || !nombre) {
      return res.status(400).json({ success: false, message: "Faltan datos" });
    }

    const categoria = await prisma.categoria.findUnique({ 
      where: { id: categoriaId },
      include: { club: { include: { memberships: true } } }
    });
    
    if (!categoria) {
      return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    }

    // No se pueden editar categorías globales
    if (!categoria.clubId) {
      return res.status(403).json({ 
        success: false, 
        message: "No se puede editar esta categoría predeterminada" 
      });
    }

    // Verificar permisos del usuario en el club
    const permisos = await verificarPermisosClub(userId, categoria.clubId);
    if (!permisos.hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: "No tienes permisos para editar categorías de este club" 
      });
    }

    const updated = await prisma.categoria.update({
      where: { id: categoriaId },
      data: { nombre: nombre.trim() }
    });
    
    res.json({ success: true, categoria: updated });
  } catch (error) {
    console.error("[ERROR] Error al editar categoría:", error);
    res.status(500).json({ success: false, message: "Error al editar categoría" });
  }
};

/**
 * Elimina una categoría personalizada del club
 * Ruta: DELETE /api/categorias/:id
 */
const deleteCategoria = async (req, res) => {
  try {
    const categoriaId = Number(req.params.id);
    const userId = req.user?.userId;
    
    if (!categoriaId) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }

    const categoria = await prisma.categoria.findUnique({ 
      where: { id: categoriaId },
      include: { club: { include: { memberships: true } } }
    });
    
    if (!categoria) {
      return res.status(404).json({ success: false, message: "Categoría no encontrada" });
    }

    // No se pueden eliminar categorías globales
    if (!categoria.clubId) {
      return res.status(403).json({ 
        success: false, 
        message: "No se puede eliminar esta categoría predeterminada" 
      });
    }

    // Verificar permisos del usuario en el club
    const permisos = await verificarPermisosClub(userId, categoria.clubId);
    if (!permisos.hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: "No tienes permisos para eliminar categorías de este club" 
      });
    }

    // Desconectar de libros antes de eliminar
    const booksUsingCategory = await prisma.book.findMany({
      where: {
        categorias: {
          some: { id: categoriaId }
        }
      }
    });

    if (booksUsingCategory.length > 0) {
      for (const book of booksUsingCategory) {
        await prisma.book.update({
          where: { id: book.id },
          data: {
            categorias: {
              disconnect: { id: categoriaId }
            }
          }
        });
      }
    }

    await prisma.categoria.delete({ where: { id: categoriaId } });
    
    const message = booksUsingCategory.length > 0 
      ? `Categoría eliminada y desconectada de ${booksUsingCategory.length} libros`
      : "Categoría eliminada";
    
    res.json({ success: true, message });
  } catch (error) {
    console.error("[ERROR] Error al eliminar categoría:", error);
    res.status(500).json({ success: false, message: "Error al eliminar categoría" });
  }
};

module.exports = {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria
};