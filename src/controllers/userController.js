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

        const existingUserByEmail = await firestore.collection('users').where('email', '==', data.email).get();
        const existingUserByUsername = await firestore.collection('users').where('username', '==', data.username).get();

        if (!existingUserByEmail.empty) {
            return res.status(400).json({ success: false, message: 'Email is already registered' });
        }

        if (!existingUserByUsername.empty) {
            return res.status(400).json({ success: false, message: 'Username is already taken' });
        }

        if (!data.password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        // Hash the password using bcrypt
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        const userData = {
            ...data,
            password: hashedPassword,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        };

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

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

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

        const user = {
            id: userDoc.id,
            username: userData.username,
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Update the user document with the refresh token
        await usersCollection.doc(user.id).update({ refresh_token: refreshToken });

        res.json({
            success: true,
            message:"Account successfully logged in",
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const usersCollection = firestore.collection('users');
        const data = await usersCollection.get();

        if (data.empty) {
            return res.status(404).json({ success: false, message: 'No user record found' });
        }

        const usersArray = data.docs.map(doc => {
            const userData = doc.data();
            const user = {
                id: doc.id,
                username: userData.username,
                email: userData.email,
                password: userData.password,
                access_token: userData.access_token || '',
                refresh_token: userData.refresh_token,
                created_at: userData.created_at,
            };
            return user;
        });

        return res.json({
            success: true,
            message: 'User data has been successfully accepted',
            data: usersArray,
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getUserById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await firestore.collection('users').doc(id);
        const data = await user.get();

        if (!data.exists) {
            return res.status(404).json({ success: false, message: 'User with the given ID not found' });
        } else {
            const userData = data.data();
            const userResponse = {
                id: data.id,
                username: userData.username,
                email: userData.email,
                password: userData.password,
                access_token: userData.access_token || '',
                refresh_token: userData.refresh_token,
                created_at: userData.created_at,
            };

            return res.json({
                success: true,
                message: 'User data based on ID has been successfully retrieved',
                data: userResponse,
            });
        }
    } catch (error) {
        console.error('Error fetching user data by ID:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const newData = req.body;

        const userRef = firestore.collection('users').doc(id);
        const user = await userRef.get();

        if (!user.exists) {
            return res.status(404).json({ success: false, message: 'User with the given ID not found' });
        }

        await userRef.update(newData);

        res.json({
            success: true,
            message: 'User data has been successfully updated',
            data: { id, ...newData },
        });
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userRef = firestore.collection('users').doc(id);
        const user = await userRef.get();

        if (!user.exists) {
            return res.status(404).json({ success: false, message: 'User with the given ID not found' });
        }

        await userRef.delete();

        res.json({
            success: true,
            message: 'User has been successfully deleted',
            data: { id, ...user.data() },
        });
    } catch (error) {
        console.error('Error deleting user data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
}