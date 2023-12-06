'use strict';

const firebase = require('../../db');
const User = require('../models/User');
const admin = require("firebase-admin");
const jwt = require('jsonwebtoken');
const config = require('../../config');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../../jwt-helper');
const credentials = require("../../serviceAccountKey.json");

    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });

const firestore = admin.firestore();

const registerUser = async (req, res, next) => {
    try {
        const data = req.body;

        // Check if password is provided
        if (!data.password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        // Save the hashed password to the data object
        const userData = {
            ...data,
            password: hashedPassword,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Store the user data in Firestore
        await firestore.collection('users').doc().set(userData);

        res.json({
            success: true,
            message: 'Account Created Successfully',
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email is provided
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check credentials and fetch user from Firestore
        const usersCollection = await firestore.collection('users');
        const querySnapshot = await usersCollection.where('email', '==', email).get();

        if (querySnapshot.empty) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Check password using bcrypt
        const isPasswordValid = await bcrypt.compare(password, userData.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Assuming credentials are valid, proceed with token generation
        const user = {
            id: userDoc.id,
            email: userData.email,
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Update the user document with the refresh token
        await usersCollection.doc(user.id).update({ refresh_token: refreshToken });

        res.json({
            success: true,
            accessToken,
            refreshToken,
        });
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
                    doc.data().username,
                    doc.data().email,
                    doc.data().password,
                    doc.data().created_at,
                    doc.data().updated_at,
                );
                usersArray.push(user);
            });
            return res.json({
                success:true,
                message:"User data has been successfully accepted",
                data: usersArray
            });
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