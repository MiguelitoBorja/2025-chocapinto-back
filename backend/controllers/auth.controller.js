// src/controllers/auth.controller.js
const crypto = require("crypto");
const prisma = require('../db');
const { sendPasswordResetEmail } = require("../utils/mail");
const bcrypt = require("bcryptjs");
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { validateRequiredFields, validateEmail, validatePassword } = require('../utils/validateFields');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar campos requeridos
    const missingFields = validateRequiredFields(['username', 'email', 'password'], req.body);
    if (missingFields) {
      return res.status(400).json({ 
        success: false, 
        message: `Faltan campos requeridos: ${missingFields.join(', ')}` 
      });
    }

    // Validar email
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Email inválido" });
    }

    // Validar contraseña
    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: { 
        username, 
        email, 
        password: hashedPassword, 
        role: "reader" 
      }
    });

    res.status(201).json({ 
      success: true, 
      message: "Usuario registrado con éxito", 
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.code === "P2002") {
      res.status(400).json({ success: false, message: "El usuario o email ya existe" });
    } else {
      console.error("Error al registrar:", error);
      res.status(500).json({ success: false, message: "Error del servidor" });
    }
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos
    const missingFields = validateRequiredFields(['username', 'password'], req.body);
    if (missingFields) {
      return res.status(400).json({ success: false, message: "Faltan credenciales" });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    res.json({ 
      success: true, 
      message: "Login exitoso", 
      role: user.role, 
      id: user.id 
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentUsername, currentPassword, newPassword } = req.body;

    const missingFields = validateRequiredFields(['currentUsername', 'currentPassword', 'newPassword'], req.body);
    if (missingFields) {
      return res.status(400).json({ success: false, message: "Faltan datos requeridos" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ success: false, message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({ where: { username: currentUsername } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Contraseña actual incorrecta" });
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await prisma.user.update({
      where: { username: currentUsername },
      data: { password: hashedNewPassword }
    });

    res.json({ success: true, message: "Contraseña actualizada con éxito" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Verificar si el usuario existe
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // POR SEGURIDAD: Respondemos "Si existe, enviamos mail" aunque no exista,
            // para que los hackers no sepan qué emails están registrados.
            return res.json({ success: true, message: "Si el correo existe, se envió un enlace." });
        }

        // 2. Generar Token Seguro
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 3600000); // 1 hora desde ahora

        // 3. Guardar en Supabase (Borrar tokens viejos si tenía)
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        
        await prisma.passwordResetToken.create({
            data: {
                token: resetToken,
                userId: user.id,
                expiresAt: tokenExpiration
            }
        });

        // 4. Enviar Email con Nodemailer
        // OJO: Cambia la URL por la de tu Frontend en Render
        const resetLink = `https://booksy-front-juani.onrender.com/html/reset-password.html?token=${resetToken}`;

        await sendPasswordResetEmail(email, resetLink);

        res.json({ success: true, message: "Correo enviado" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al procesar solicitud" });
    }
};
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        console.log('🔑 [RESET PASSWORD] Token recibido:', token);
        console.log('🔑 [RESET PASSWORD] Longitud del token:', token?.length);

        // 1. Buscar el token en Supabase
        const tokenRecord = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true } // Traer al usuario asociado
        });

        console.log('🔍 [RESET PASSWORD] Token encontrado en BD:', tokenRecord ? 'SÍ' : 'NO');
        if (tokenRecord) {
            console.log('📅 [RESET PASSWORD] Expira en:', tokenRecord.expiresAt);
            console.log('⏰ [RESET PASSWORD] Hora actual:', new Date());
        }

        // 2. Validaciones
        if (!tokenRecord) {
            console.log('❌ [RESET PASSWORD] Token no encontrado en BD');
            return res.status(400).json({ success: false, message: "Token inválido o expirado" });
        }

        // Verificar fecha
        if (tokenRecord.expiresAt < new Date()) {
            console.log('❌ [RESET PASSWORD] Token expirado');
            return res.status(400).json({ success: false, message: "El token ha expirado. Pide uno nuevo." });
        }

        // 3. Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Actualizar usuario
        await prisma.user.update({
            where: { id: tokenRecord.userId },
            data: { password: hashedPassword }
        });

        // 5. Borrar el token usado (Para que no se use dos veces)
        await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });

        console.log('✅ [RESET PASSWORD] Contraseña actualizada para usuario:', tokenRecord.user.username);
        res.json({ success: true, message: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error('❌ [RESET PASSWORD] Error:', error);
        res.status(500).json({ success: false, message: "Error al cambiar contraseña" });
    }
};


module.exports = {
  register,
  login,
  changePassword,
  requestPasswordReset,
  resetPassword
};