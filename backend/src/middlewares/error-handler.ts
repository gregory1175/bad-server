import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Model, Types } from 'mongoose'
import { ACCESS_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'
import NotFoundError from '../errors/not-found-error'
import UnauthorizedError from '../errors/unauthorized-error'
import UserModel, { Role, IUser } from '../models/user'

// Мидлвар для проверки JWT
const auth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Невалидный токен'))
    }

    try {
        const token = authHeader.split(' ')[1]
        const payload = jwt.verify(token, ACCESS_TOKEN.secret) as JwtPayload

        const user = await UserModel.findOne(
            { _id: new Types.ObjectId(payload.sub) },
            { password: 0, salt: 0 }
        )

        if (!user) {
            return next(new ForbiddenError('Нет доступа'))
        }

        res.locals.user = user
        return next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return next(new UnauthorizedError('Истек срок действия токена'))
        }
        return next(new UnauthorizedError('Необходима авторизация'))
    }
}

// Мидлвар для проверки ролей
export function roleGuardMiddleware(...roles: Role[]) {
    return (_req: Request, res: Response, next: NextFunction) => {
        const user = res.locals.user as IUser // Уточняем тип пользователя

        if (!user) {
            return next(new UnauthorizedError('Необходима авторизация'))
        }

        const hasAccess = roles.some(role => user.roles.includes(role))

        if (!hasAccess) {
            return next(new ForbiddenError('Доступ запрещен'))
        }

        return next()
    }
}

// Мидлвар для проверки доступа к сущности
export function currentUserAccessMiddleware<T>(
    model: Model<T>,
    idProperty: string,
    userProperty: keyof T
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[idProperty]
        const user = res.locals.user as IUser

        if (!user) {
            return next(new UnauthorizedError('Необходима авторизация'))
        }

        if (user.roles.includes(Role.Admin)) {
            return next()
        }

        const entity = await model.findById(id)

        if (!entity) {
            return next(new NotFoundError('Не найдено'))
        }

        const userEntityId = entity[userProperty] as Types.ObjectId
        const hasAccess = new Types.ObjectId(user.id).equals(userEntityId)

        if (!hasAccess) {
            return next(new ForbiddenError('Доступ запрещен'))
        }

        return next()
    }
}

export default auth
