const User = require('../models/User');
const jwt = require('jsonwebtoken');

const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user: {
            _id: user._id,
            name: user.name,
            role: user.role,
            studentId: user.studentId
        }
    });
};

const register = async (req, res) => {
    try {
        const { name, email, password, role, studentId } = req.body;
        const userExists = await User.findOne({ email });
        
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password, role, studentId });
        sendTokenResponse(user, 201, res);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            sendTokenResponse(user, 200, res);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const logout = (req, res) => {
    res
        .status(200)
        .clearCookie('token')
        .json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            _id: req.user._id,
            name: req.user.name,
            role: req.user.role,
            studentId: req.user.studentId
        }
    });
};

module.exports = { register, login, logout, getMe };
