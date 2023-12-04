const express = require('express');
const { registerUser, 
        getAllUsers, 
        getUser,
        updateUser,
        deleteUser
        } = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.get('/users', getAllUsers);
router.get('/user/:id', getUser);
router.put('/user/update/:id', updateUser);
router.delete('/user/delete/:id', deleteUser);


module.exports = {
    routes: router
}