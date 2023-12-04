const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

class User {
    constructor(username, email, password) {
        this.id = uuidv4();
        this.username = username;
        this.email = email;
        this.password = this.encryptPassword(password);
        this.created_at = admin.firestore.FieldValue.serverTimestamp();
        this.updated_at = null;
    }

    encryptPassword(password) {
        const saltRounds = 10;
        return bcrypt.hashSync(password, saltRounds);
    }
}

module.exports = User;