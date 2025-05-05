import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import { roleGuardMiddleware } from '../middlewares/error-handler'

// TODO: Добавить guard admin
// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    roleGuardMiddleware();
    try {
        const {
            page = '1',
            limit = '10',
            sortField = 'createdAt',
            sortOrder = 'desc',
            registrationDateFrom,
            registrationDateTo,
            lastOrderDateFrom,
            lastOrderDateTo,
            totalAmountFrom,
            totalAmountTo,
            orderCountFrom,
            orderCountTo,
            search,
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.max(1, Math.min(100, Number(limit) || 10));

        const filters: FilterQuery<Partial<IUser>> = {};

        if (registrationDateFrom) {
            filters.createdAt = {
                ...filters.createdAt,
                $gte: new Date(registrationDateFrom.toString()),
            };
        }

        if (registrationDateTo) {
            const endOfDay = new Date(registrationDateTo.toString());
            endOfDay.setHours(23, 59, 59, 999);
            filters.createdAt = {
                ...filters.createdAt,
                $lte: endOfDay,
            };
        }

        if (lastOrderDateFrom) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $gte: new Date(lastOrderDateFrom.toString()),
            };
        }

        if (lastOrderDateTo) {
            const endOfDay = new Date(lastOrderDateTo.toString());
            endOfDay.setHours(23, 59, 59, 999);
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $lte: endOfDay,
            };
        }

        if (totalAmountFrom) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: Number(totalAmountFrom),
            };
        }

        if (totalAmountTo) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: Number(totalAmountTo),
            };
        }

        if (orderCountFrom) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: Number(orderCountFrom),
            };
        }

        if (orderCountTo) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: Number(orderCountTo),
            };
        }

        if (search) {
            const searchRegex = new RegExp(search.toString(), 'i');
            const orders = await Order.find(
                { $or: [{ deliveryAddress: searchRegex }] },
                '_id'
            );

            const orderIds = orders.map((order) => order._id);

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ];
        }

        const sort: { [key: string]: 1 | -1 } = {};
        sort[sortField.toString()] = sortOrder === 'desc' ? -1 : 1;

        const options = {
            sort,
            skip: (pageNumber - 1) * limitNumber,
            limit: limitNumber,
        };

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: 'products customer',
            },
        ]);

        const totalUsers = await User.countDocuments(filters);
        const totalPages = Math.ceil(totalUsers / limitNumber);

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: pageNumber,
                pageSize: limitNumber,
            },
        });
    } catch (error) {
        next(error);
    }
};


// TODO: Добавить guard admin
// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    roleGuardMiddleware();
    try {
        const user = await User.findById(req.params.id).populate([
            'orders',
            'lastOrder',
        ])
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    roleGuardMiddleware();
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    roleGuardMiddleware();
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
