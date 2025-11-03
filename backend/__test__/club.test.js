
// server.test.js
const request = require("supertest");
const app = require("../app");
const prisma = require("../db");


//test para crear club
describe("POST /createClub", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("crea el club correctamente", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.club, "create").mockResolvedValue({
      id: 10,
      name: "Club Lectura",
      description: "Un club para leer",
      id_owner: 1,
      members: [{ id: 1, username: "juan" }]
    });

    const res = await request(app)
      .post("/createClub")
      .send({ name: "Club Lectura", description: "Un club para leer", ownerUsername: "juan" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      club: {
        id: 10,
        name: "Club Lectura",
        description: "Un club para leer",
        id_owner: 1,
        members: [{ id: 1, username: "juan" }]
      }
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "juan" } });
    expect(prisma.club.create).toHaveBeenCalledWith({
      data: {
        name: "Club Lectura",
        description: "Un club para leer",
        id_owner: 1,
        members: { connect: { id: 1 } }
      },
      include: { members: true }
    });
  });

  it("falla si faltan datos", async () => {
    const res = await request(app)
      .post("/createClub")
      .send({ name: "Club Lectura", ownerUsername: "juan" }); // falta description

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Faltan datos" });
  });

  it("falla si el usuario no existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const res = await request(app)
      .post("/createClub")
      .send({ name: "Club Lectura", description: "Un club para leer", ownerUsername: "noexiste" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Usuario no encontrado" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.club, "create").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/createClub")
      .send({ name: "Club Lectura", description: "Un club para leer", ownerUsername: "juan" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error del servidor" });
  });
});

//test para obtener todos los clubes
describe("GET /clubs", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devuelve la lista de clubes correctamente", async () => {
    jest.spyOn(prisma.club, "findMany").mockResolvedValue([
      {
        id: 1,
        name: "Club A",
        description: "Descripción A",
        members: [{ id: 1, username: "juan" }]
      },
      {
        id: 2,
        name: "Club B",
        description: "Descripción B",
        members: [{ id: 2, username: "ana" }]
      }
    ]);

    const res = await request(app).get("/clubs");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      clubs: [
        {
          id: 1,
          name: "Club A",
          description: "Descripción A",
          members: [{ id: 1, username: "juan" }]
        },
        {
          id: 2,
          name: "Club B",
          description: "Descripción B",
          members: [{ id: 2, username: "ana" }]
        }
      ]
    });
    expect(prisma.club.findMany).toHaveBeenCalledWith({ include: { members: true } });
  });

  it("devuelve error de servidor si falla la consulta", async () => {
    jest.spyOn(prisma.club, "findMany").mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/clubs");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error del servidor" });
  });
});

//test para unirse a un club
describe("POST /joinClub", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("permite unirse al club correctamente", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      members: []
    });
    jest.spyOn(prisma.club, "update").mockResolvedValue({});

    const res = await request(app)
      .post("/joinClub")
      .send({ clubId: 10, username: "juan" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Te uniste al club correctamente" });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "juan" } });
    expect(prisma.club.findUnique).toHaveBeenCalledWith({ where: { id: 10 }, include: { members: true } });
    expect(prisma.club.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { members: { connect: { id: 1 } } }
    });
  });

  it("falla si faltan datos", async () => {
    const res = await request(app)
      .post("/joinClub")
      .send({ clubId: 10 }); // falta username

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Faltan datos" });
  });

  it("falla si el usuario no existe", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const res = await request(app)
      .post("/joinClub")
      .send({ clubId: 10, username: "noexiste" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Usuario no encontrado" });
  });

  it("falla si el usuario ya es miembro", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      members: [{ id: 1, username: "juan" }]
    });

    const res = await request(app)
      .post("/joinClub")
      .send({ clubId: 10, username: "juan" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: false, message: "Ya eres miembro del club" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({ id: 10, members: [] });
    jest.spyOn(prisma.club, "update").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/joinClub")
      .send({ clubId: 10, username: "juan" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error del servidor" });
  });
});

//test para obtener un club por id
describe("GET /club/:id", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devuelve el club correctamente", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      name: "Club Lectura",
      description: "Un club para leer",
      id_owner: 1,
      readBooks: [
        { id: 1, title: "Libro 1", author: "Autor 1" },
        { id: 2, title: "Libro 2", author: "Autor 2" }
      ]
    });

    const res = await request(app).get("/club/10");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      club: {
        id: 10,
        name: "Club Lectura",
        description: "Un club para leer",
        id_owner: 1,
        readBooks: [
          { id: 1, title: "Libro 1", author: "Autor 1" },
          { id: 2, title: "Libro 2", author: "Autor 2" }
        ]
      }
    });
    expect(prisma.club.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
      include: { readBooks: true }
    });
  });

  it("devuelve error si el id es inválido", async () => {
    const res = await request(app).get("/club/abc");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "ID inválido" });
  });

  it("devuelve error si el club no existe", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue(null);

    const res = await request(app).get("/club/99");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Club no encontrado" });
  });

  it("devuelve error de servidor si ocurre una excepción", async () => {
    jest.spyOn(prisma.club, "findUnique").mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/club/10");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error al buscar club" });
  });
});

