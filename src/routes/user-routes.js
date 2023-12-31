const express = require('express');
const { registerUser, 
        loginUser,
        getAllUsers, 
        getUserById,
        updateUser,
        deleteUser
        } = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', getAllUsers);
router.get('/user/:id', getUserById);
router.put('/user/update/:id', updateUser);
router.delete('/user/delete/:id', deleteUser);


module.exports = {
    routes: router
}