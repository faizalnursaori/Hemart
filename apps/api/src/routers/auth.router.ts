import express from 'express';
import { login, register, resetPassword  } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/user/reset-password', resetPassword);

export default router;
