import jwt from "jsonwebtoken";
import e, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();


declare global{
    namespace Express {
        interface Request{
            user?: string
        }
    }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    const response = jwt.verify(token, process.env.JWT_SECRET as string);

    if(response){
        req.user = (response as any).id;
        next();
    } else{
        res.status(403).json({
            message: "Unauthorized"
        })
    }
}


export default authMiddleware;