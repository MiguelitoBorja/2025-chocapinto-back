// server.test.js
const request = require("supertest");
const app = require("../app");
const prisma = require("../db");


//test para agregar libro a un club
describe("POST /club/:id/addBook", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("agrega el libro correctamente al club", async () => {
    jest.spyOn(prisma.book, "create").mockResolvedValue({
      id: 1,
      title: "Libro Test",
      author: "Autor Test"
    });

    const res = await request(app)
      .post("/club/10/addBook")
      .send({ title: "Libro Test", author: "Autor Test" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Libro agregado",
      book: {
        id: 1,
        title: "Libro Test",
        author: "Autor Test"
      }
    });
    expect(prisma.book.create).toHaveBeenCalledWith({
      data: {
        title: "Libro Test",
        author: "Autor Test",
        clubs: { connect: { id: 10 } }
      }
    });
  });

  it("falla si faltan datos obligatorios", async () => {
    const res = await request(app)
      .post("/club/10/addBook")
      .send({ author: "Autor Test" }); // falta title

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Faltan datos obligatorios" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.book, "create").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/club/10/addBook")
      .send({ title: "Libro Test", author: "Autor Test" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error al agregar libro" });
  });
});

//test para eliminar libro de un club
describe("DELETE /club/:id/deleteBook/:bookId", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("elimina el libro correctamente si el usuario es owner", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      id_owner: 1,
      readBooks: [{ id: 5 }]
    });
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });
    jest.spyOn(prisma.book, "update").mockResolvedValue({});
    jest.spyOn(prisma.book, "findUnique").mockResolvedValue({ clubs: [] });
    jest.spyOn(prisma.book, "delete").mockResolvedValue({});

    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({ username: "juan" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Libro eliminado del club" });
    expect(prisma.club.findUnique).toHaveBeenCalledWith({ where: { id: 10 }, include: { readBooks: true } });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: "juan" } });
    expect(prisma.book.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { clubs: { disconnect: { id: 10 } } }
    });
    expect(prisma.book.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it("falla si faltan datos obligatorios", async () => {
    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({}); // falta username

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Faltan datos obligatorios" });
  });

  it("falla si el club no existe", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue(null);

    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({ username: "juan" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Club no encontrado" });
  });

  it("falla si el usuario no existe", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      id_owner: 1,
      readBooks: [{ id: 5 }]
    });
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({ username: "juan" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Usuario no encontrado" });
  });

  it("falla si el usuario no es owner", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      id_owner: 2,
      readBooks: [{ id: 5 }]
    });
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });

    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({ username: "juan" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "No tienes permisos para eliminar libros" });
  });

  it("falla si el libro no pertenece al club", async () => {
    jest.spyOn(prisma.club, "findUnique").mockResolvedValue({
      id: 10,
      id_owner: 1,
      readBooks: [{ id: 6 }]
    });
    jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ id: 1, username: "juan" });

    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({ username: "juan" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "El libro no pertenece a este club" });
  });

  it("falla si hay error de servidor", async () => {
    jest.spyOn(prisma.club, "findUnique").mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .delete("/club/10/deleteBook/5")
      .send({ username: "juan" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error al eliminar libro" });
  });
});

//test para obtener todos los libros
describe("GET /books", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devuelve la lista de libros correctamente", async () => {
    jest.spyOn(prisma.book, "findMany").mockResolvedValue([
      { id: 1, title: "Libro 1", author: "Autor 1" },
      { id: 2, title: "Libro 2", author: "Autor 2" }
    ]);

    const res = await request(app).get("/books");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      books: [
        { id: 1, title: "Libro 1", author: "Autor 1" },
        { id: 2, title: "Libro 2", author: "Autor 2" }
      ]
    });
    expect(prisma.book.findMany).toHaveBeenCalled();
  });

  it("devuelve error de servidor si falla la consulta", async () => {
    jest.spyOn(prisma.book, "findMany").mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/books");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Error al obtener libros" });
  });
});