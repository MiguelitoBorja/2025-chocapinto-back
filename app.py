from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)

USERS_FILE = "users.json"

# --- Leer usuarios ---
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

# --- Guardar usuarios ---
def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

# --- Registro ---
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not username or not password or not role:
        return jsonify({"success": False, "message": "Faltan datos"}), 400

    users = load_users()

    # Verificar si ya existe el usuario
    if any(u["username"] == username for u in users):
        return jsonify({"success": False, "message": "El usuario ya existe"}), 400

    users.append({"username": username, "password": password, "role": role})
    save_users(users)

    return jsonify({"success": True, "message": "Usuario registrado con éxito"}), 201

# --- Login ---
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "Faltan datos"}), 400

    users = load_users()

    for user in users:
        if user["username"] == username and user["password"] == password:
            return jsonify({
                "success": True,
                "message": "Login exitoso",
                "role": user["role"]
            }), 200

    return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"}), 401

# --- Inicio del servidor ---
if __name__ == "__main__":
    app.run(debug=True)
