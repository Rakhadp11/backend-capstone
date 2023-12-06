const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class User {
    constructor(username, email, password, refresh_token = null) {
        this.id = uuidv4();
        this.username = username;
        this.email = email;
        this.password = this.encryptPassword(password);
        this.created_at = admin.firestore.FieldValue.serverTimestamp();
        this.refresh_token = refresh_token;
        this.updated_at = null;
    }

    async encryptPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async isValidPassword(password) {
        return bcrypt.compare(password, this.password);
    }
}

module.exports = User;
