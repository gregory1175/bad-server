import { Router } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import rateLimit from 'express-rate-limit';
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers';
import auth, { roleGuardMiddleware } from '../middlewares/error-handler';
import { Role } from '../models/user';


const customerRouter = Router();

// Ограничение по частоте запросов
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 10, // максимум 10 запросов в минуту
    message: { error: 'Too many requests, please try again later.' },
});

// Для списка клиентов (где обычно много запросов)
customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), limiter, getCustomers);

// Для операций с конкретным клиентом
customerRouter.get('/:id', auth, getCustomerById);
customerRouter.patch('/:id', auth, updateCustomer);
customerRouter.delete('/:id', auth, deleteCustomer);

export default customerRouter;
