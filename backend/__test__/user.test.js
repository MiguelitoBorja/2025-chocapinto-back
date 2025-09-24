// server.test.js
const request = require("supertest");
const app = require("../app");
const prisma = require("../db");

//test para obtener usuario por username
describe("GET /user/:username", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devuelve un usuario si existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });

    const res = await request(app).get("/user/juan");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, user: { id: 1, username: "juan" } });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "juan" } });
  });

  it("devuelve 404 si no existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const res = await request(app).get("/user/pepito");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Usuario no encontrado" });
  });

  it("devuelve 500 si hay error", async () => {
    jest.spyOn(prisma.user, "findUnique").mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/user/error");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error del servidor" });
  });
});
//test para registrar usuario
describe("POST /register", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registra usuario correctamente", async () => {
    jest.spyOn(prisma.user, "create").mockResolvedValue({
      id: 1,
      username: "nuevo",
      email: "nuevo@mail.com",
      password: "12345678A",
      role: "reader"
    });

    const res = await request(app)
      .post("/register")
      .send({ username: "nuevo", email: "nuevo@mail.com", password: "12345678A" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: "Usuario registrado con éxito",
      user: {
        id: 1,
        username: "nuevo",
        email: "nuevo@mail.com",
        password: "12345678A",
        role: "reader"
      }
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { username: "nuevo", email: "nuevo@mail.com", password: "12345678A", role: "reader" }
    });
  });

  it("falla si faltan datos", async () => {
    const res = await request(app)
      .post("/register")
      .send({ username: "nuevo", password: "12345678A" }); // falta email

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Faltan datos" });
  });

  it("falla si el usuario ya existe", async () => {
    jest.spyOn(prisma.user, "create").mockRejectedValue({ code: "P2002" });

    const res = await request(app)
      .post("/register")
      .send({ username: "existente", email: "existente@mail.com", password: "12345678A" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "El usuario ya existe" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.user, "create").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/register")
      .send({ username: "error", email: "error@mail.com", password: "12345678A" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Error del servidor");
    expect(res.body.error).toBe("DB error");
  });
});

//test para login
describe("POST /login", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("login exitoso con credenciales válidas", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: 1,
      username: "juan",
      password: "12345678A",
      role: "reader"
    });

    const res = await request(app)
      .post("/login")
      .send({ username: "juan", password: "12345678A" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Login exitoso",
      role: "reader",
      id: 1
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "juan" } });
  });

  it("falla si el usuario no existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const res = await request(app)
      .post("/login")
      .send({ username: "noexiste", password: "12345678A" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Credenciales inválidas" });
  });

  it("falla si la contraseña es incorrecta", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: 1,
      username: "juan",
      password: "12345678A",
      role: "reader"
    });

    const res = await request(app)
      .post("/login")
      .send({ username: "juan", password: "incorrecta" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Credenciales inválidas" });
  });
});

//test para actualizar usuario
describe("PUT /updateUser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("actualiza el usuario correctamente", async () => {
    jest.spyOn(prisma.user, "findUnique")
      .mockResolvedValueOnce({ id: 1, username: "juan", role: "reader" }) // usuario actual
      .mockResolvedValueOnce(null); // nuevo username no existe

    jest.spyOn(prisma.user, "update").mockResolvedValue({
      username: "juanNuevo",
      role: "reader"
    });

    const res = await request(app)
      .put("/updateUser")
      .send({ currentUsername: "juan", newUsername: "juanNuevo", newPassword: "NuevaPass123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Usuario actualizado",
      user: { username: "juanNuevo", role: "reader" }
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { username: "juan" },
      data: { username: "juanNuevo", password: "NuevaPass123" },
      select: { username: true, role: true }
    });
  });

  it("falla si no se proporciona el usuario actual", async () => {
    const res = await request(app)
      .put("/updateUser")
      .send({ newUsername: "juanNuevo", newPassword: "NuevaPass123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "No se proporcionó el usuario actual" });
  });

  it("falla si el usuario actual no existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null);

    const res = await request(app)
      .put("/updateUser")
      .send({ currentUsername: "noexiste", newUsername: "nuevo", newPassword: "NuevaPass123" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Usuario no encontrado" });
  });

  it("falla si el nuevo username ya está en uso", async () => {
    jest.spyOn(prisma.user, "findUnique")
      .mockResolvedValueOnce({ id: 1, username: "juan", role: "reader" }) // usuario actual
      .mockResolvedValueOnce({ id: 2, username: "juanNuevo", role: "reader" }); // nuevo username existe

    const res = await request(app)
      .put("/updateUser")
      .send({ currentUsername: "juan", newUsername: "juanNuevo", newPassword: "NuevaPass123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Nombre de usuario ya en uso" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({ id: 1, username: "juan", role: "reader" });
    jest.spyOn(prisma.user, "update").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/updateUser")
      .send({ currentUsername: "juan", newUsername: "juanNuevo", newPassword: "NuevaPass123" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error del servidor" });
  });
});

//test para eliminar usuario
describe("POST /deleteUser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("elimina el usuario correctamente", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.user, "delete").mockResolvedValue({ id: 1, username: "juan" });

    const res = await request(app)
      .post("/deleteUser")
      .send({ username: "juan" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Usuario eliminado" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "juan" } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { username: "juan" } });
  });

  it("falla si falta el nombre de usuario", async () => {
    const res = await request(app)
      .post("/deleteUser")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Falta el nombre de usuario" });
  });

  it("falla si el usuario no existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const res = await request(app)
      .post("/deleteUser")
      .send({ username: "noexiste" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Usuario no encontrado" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.user, "delete").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/deleteUser")
      .send({ username: "juan" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error al eliminar usuario" });
  });
});

