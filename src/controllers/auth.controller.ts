import z from 'zod';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


const prisma = new PrismaClient();



export const register = async (req: Request, res: Response) => {
    // Registration logic here
    const requiredBody = z.object({
        email: z.string().email(),
        username: z.string().min(3),
        password: z.string().min(6)
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDataWithSuccess.success) {
        const errorMessages = parsedDataWithSuccess.error.issues[0].message
        return res.status(400).json({ error: errorMessages });
    }
    const { email, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email,
                username,
                password: hashedPassword
            }
        })
    } catch (error) {
        res.status(411).json({
            message: "User registration failed",
            error: error
        })
    }

    res.status(201).json({
        message: "User registered successfully",
        user: { email, username }
    });
}

export const login = async (req: Request, res: Response) => {
    // Login logic here
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password"
            })
        }

        if(!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "JWT_SECRET is not defined in environment variables"
            });
        }

        const token = jwt.sign({ id: user.id, }, process.env.JWT_SECRET)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        })
        res.status(200).json({
            message: "Login successful",
            token,
            user: { email: user.email, username: user.username }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error
        });
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        // Get token from cookies or Authorization header
        const token: string = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(400).json({ 
                message: "No token provided" 
            });
        }

        // Verify token is valid before blacklisting
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "JWT_SECRET is not defined in environment variables"
            });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                message: "Invalid token" 
            });
        }

        // Add token to blacklist
        await prisma.blacklisttokenmodel.create({ 
            data: { token } 
        });

        // Clear cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({ 
            message: "Logout successful" 
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: "Logout failed",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }   
}