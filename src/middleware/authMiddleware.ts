import jwt from "jsonwebtoken";
import e, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

declare global{
    namespace Express {
        interface Request{
            user?: {
                id: string;
                email: string;
                username: string;
            }
        }
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: "Access token is required"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        if (!decoded || !decoded.id) {
            return res.status(403).json({
                message: "Invalid token"
            });
        }

        // Fetch user details from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, username: true }
        });

        if (!user) {
            return res.status(403).json({
                message: "User not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(403).json({
            message: "Unauthorized"
        });
    }
}


export default authMiddleware;