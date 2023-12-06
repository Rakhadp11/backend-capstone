'use strict';

const firebase = require('../../db');
const User = require('../models/User');
const admin = require("firebase-admin");
const jwt = require('jsonwebtoken');
const config = require('../../config');
const credentials = require("../../serviceAccountKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });

const firestore = admin.firestore();


const registerUser = async (req, res, next) => {
    try {
        const data = req.body;
        await firestore.collection('users').doc().set(data);
        res.json({
            success: true,
            message: "Account Created Successfully",
            });
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Authenticate user using Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);

        // Check if the provided password is correct
        const isPasswordValid = await bcrypt.compare(password, userRecord.passwordHash);

        if (isPasswordValid) {
            const userToken = generateToken(email);
            res.json({
                success: true,
                message: "Login Successful",
                token: userToken,
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const users = await firestore.collection('users');
        const data = await users.get();
        const usersArray = [];
        if(data.empty) {
            res.status(404).send('No user record found');
        }else {
            data.forEach(doc => {
                const user = new User(
                    doc.id,
                    doc.data().firstName,
                    doc.data().lastName,
                    doc.data().fatherName,
                    doc.data().class,
                    doc.data().age,
                    doc.data().phoneNumber,
                    doc.data().subject,
                    doc.data().year,
                    doc.data().semester,
                    doc.data().status
                );
                usersArray.push(user);
            });
            res.send({ msg: "User data has been successfully accepted" });
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const getUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await firestore.collection('users').doc(id);
        const data = await user.get();
        if(!data.exists) {
            res.status(404).send('User with the given ID not found');
        }else {
            res.send(data.data());
            res.send({ msg: "User data based on ID has been successfully accepted" });
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const updateUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user =  await firestore.collection('users').doc(id);
        await user.update(data);
        res.send('User data has been successfully updated');        
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        await firestore.collection('users').doc(id).delete();
        res.send('User data has been successfully deleted');
    } catch (error) {
        res.status(400).send(error.message);
    }
}

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser
}