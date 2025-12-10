const prisma = require('../db');
const { validateRequiredFields } = require('../utils/validateFields');

/**
 * Obtener usuario por ID o username
 * Ruta: GET /api/users/:idOrUsername
 */
const getUserByIdOrUsername = async (req, res) => {
  try {
    const idOrUsername = req.params.idOrUsername;
    let user = null;

    if (!isNaN(Number(idOrUsername))) {
      user = await prisma.user.findUnique({ where: { id: Number(idOrUsername) } });
    } else {
      user = await prisma.user.findUnique({ where: { username: idOrUsername } });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("[ERROR] Error al obtener usuario:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

/**
 * Actualizar usuario
 * Ruta: PUT /api/users
 */
const updateUser = async (req, res) => {
  try {
    const { currentUsername, newUsername, newPassword } = req.body;

    if (!currentUsername) {
      return res.status(400).json({ success: false, message: "No se proporcionó el usuario actual" });
    }

    const user = await prisma.user.findUnique({ where: { username: currentUsername } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    if (newUsername && newUsername !== currentUsername) {
      const exists = await prisma.user.findUnique({ where: { username: newUsername } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Nombre de usuario ya en uso" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { username: currentUsername },
      data: {
        username: newUsername || currentUsername,
        ...(newPassword ? { password: newPassword } : {})
      },
      select: { username: true, role: true }
    });

    res.json({ success: true, message: "Usuario actualizado", user: updatedUser });
  } catch (error) {
    console.error("[ERROR] Error al actualizar usuario:", error);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
};

/**
 * Eliminar usuario
 * Ruta: DELETE /api/users
 */
const deleteUser = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: "Falta el nombre de usuario" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    await prisma.user.delete({ where: { username } });
    res.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    console.error("[ERROR] Error al eliminar usuario:", error);
    res.status(500).json({ success: false, message: "Error al eliminar usuario" });
  }
};

/**
 * Obtener clubes del usuario
 * Ruta: GET /api/users/:username/clubs
 */
const getMyClubs = async (req, res) => {
    const { username } = req.params;

    try {
        const userWithClubs = await prisma.user.findUnique({
            where: { username: username },
            select: {
                id: true,
                memberships: { 
                    select: {
                        role: true,
                        joinedAt: true,
                        club: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                id_owner: true,
                                imagen: true,
                            }
                        }
                    }
                }
            }
        });

        if (!userWithClubs) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado." });
        }
        
        const clubsData = userWithClubs.memberships.map(membership => ({
            id: membership.club.id,
            name: membership.club.name,
            role: membership.role,
            joinedAt: membership.joinedAt, 
            imagen: membership.club.imagen
        }));

        res.json({ success: true, clubs: clubsData });

    } catch (error) {
        console.error("[ERROR] Error al obtener los clubes del usuario:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor al consultar clubes." });
    }
};

/**
 * Actualizar selección de avatar del usuario
 * Ruta: PUT /api/users/:userId/avatar
 */
const updateAvatarSelection = async (req, res) => {
    const { userId } = req.params;
    const { avatarName } = req.body; 

    try {
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ 
                success: false, 
                message: "ID de usuario no válido" 
            });
        }

        if (!avatarName || typeof avatarName !== 'string') {
            return res.status(400).json({ 
                success: false, 
                message: "Nombre de avatar no válido" 
            });
        }

        const avatarPath = `../images/avatars/${avatarName}`;

        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!existingUser) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado" 
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { avatar: avatarPath },
            select: { 
                id: true, 
                username: true, 
                avatar: true 
            }
        });

        res.json({ 
            success: true, 
            message: "Avatar actualizado correctamente",
            avatar: avatarPath,
            user: updatedUser 
        });

    } catch (error) {
        console.error("[ERROR] Error actualizando avatar:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error del servidor al actualizar el avatar" 
        });
    }
};

module.exports = {
  getUserByIdOrUsername,
  updateUser,
  deleteUser,
  getMyClubs,
  updateAvatarSelection
};