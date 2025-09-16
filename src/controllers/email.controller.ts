import { Request, Response } from "express";
import aiServices from "../services/ai.services";
import portfolioService from "../services/portfolio.services";



// Extend Request to include user with email property
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            email: string;
        };
    }
}

export const generateEmail = async (req: Request, res: Response) => {
    try {
        const { joburl } = req.body;
        const userEmail: string | undefined = req.user?.email; // Extracted from authMiddleware
        console.log("Request user:", req.user); // Debug log
        console.log("User email from request:", userEmail); // Debug log
        
        if (!joburl) {
            return res.status(400).json({
                message: "Job URL is required"
            });
        }

        // First load the webpage content
        console.log("Loading webpage:", joburl);
        const cleanedText = await aiServices.loadWebPage(joburl);
        console.log("Webpage loaded, text length:", cleanedText.length);
        
        if (!cleanedText || cleanedText.trim().length === 0) {
            return res.status(400).json({
                message: "Could not load content from the provided URL. The website might be blocking requests or experiencing issues."
            });
        }
        
        // Check if the content indicates an error (503, 404, etc.)
        if (cleanedText.includes("503") || cleanedText.includes("Server Error") || cleanedText.includes("temporarily unavailable")) {
            return res.status(400).json({
                message: "The target website is currently unavailable (503 error). Please try again later or use a different job URL."
            });
        }
        
        // Extract job information from the cleaned text
        console.log("Extracting job information...");
        const jobData = await aiServices.extractJobInfo(cleanedText);
        console.log("Job data extracted:", jobData);
        
        if (!jobData) {
            return res.status(400).json({
                message: "Could not extract job information from the provided URL"
            });
        }
        
        // Check if the job data indicates an error response from the website
        if (jobData.description && (
            jobData.description.includes("503 error") || 
            jobData.description.includes("Server Error") || 
            jobData.description.includes("No job posting available")
        )) {
            return res.status(400).json({
                message: "The target website returned an error or is temporarily unavailable. Please try a different job URL or try again later.",
                details: jobData.description
            });
        }
        
        // Check if we have valid job data
        if (!jobData.role && !jobData.experience && (!jobData.skills || jobData.skills.length === 0)) {
            return res.status(400).json({
                message: "Could not extract meaningful job information from the provided URL. The page might not contain a job posting or the website structure is not supported."
            });
        }
        
        if (!jobData.skills || !Array.isArray(jobData.skills) || jobData.skills.length === 0) {
            console.log("No skills found in job data, using generic skills");
            jobData.skills = ["JavaScript", "TypeScript", "React", "Node.js"]; // Fallback skills
        }

        // Query portfolio links based on job skills
        const portfolioLinks = portfolioService.queryLinks(jobData.skills);
        console.log("Portfolio links found:", portfolioLinks);
        
        // If no portfolio links found, use some default ones
        const linksToUse = portfolioLinks.length > 0 ? portfolioLinks : [
            "https://github.com/balmukund/react-portfolio",
            "https://github.com/balmukund/nodejs-project"
        ];
        
        // Generate the email (writeEmail expects a string of links)
        if (!userEmail) {
            return res.status(401).json({
                message: "User authentication required"
            });
        }
        
        const email = await aiServices.writeEmail(jobData, linksToUse.join(', '), userEmail);

        res.json({
            success: true,
            email: email,
            jobData: jobData,
            portfolioLinks: portfolioLinks
        });

    } catch (error) {
        console.error('Error generating email:', error);
        res.status(500).json({
            success: false,
            message: "Failed to generate email",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export const generateEmailFromData = async (req: Request, res: Response) => {
    try {
        const { jobData } = req.body;

        const userEmail = req.user?.email; // Extracted from authMiddleware
        
        if (!jobData) {
            return res.status(400).json({
                message: "Job data is required. Example: { role: 'Software Engineer', skills: ['JavaScript', 'React'], description: '...' }"
            });
        }

        // Ensure skills is an array
        if (!jobData.skills || !Array.isArray(jobData.skills)) {
            jobData.skills = ["JavaScript", "TypeScript", "React", "Node.js"];
        }

        // Query portfolio links based on job skills
        const portfolioLinks = portfolioService.queryLinks(jobData.skills);
        console.log("Portfolio links found:", portfolioLinks);
        
        // If no portfolio links found, use some default ones
        const linksToUse = portfolioLinks.length > 0 ? portfolioLinks : [
            "https://github.com/balmukund/react-portfolio",
            "https://github.com/balmukund/nodejs-project"
        ];
        
        // Generate the email
        if (!userEmail) {
            return res.status(401).json({
                message: "User authentication required"
            });
        }
        
        const email = await aiServices.writeEmail(jobData, linksToUse.join(', '), userEmail);

        res.json({
            success: true,
            email: email,
            jobData: jobData,
            portfolioLinks: linksToUse
        });

    } catch (error) {
        console.error('Error generating email from data:', error);
        res.status(500).json({
            success: false,
            message: "Failed to generate email",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const testEndpoint = async (req: Request, res: Response) => {
    res.json({
        message: "Email service is working!",
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            "POST /api/email/generate": "Generate email from job URL",
            "POST /api/email/generate-from-data": "Generate email from job data object (bypass scraping)",
            "GET /api/email/test": "Test endpoint"
        },
        sampleJobData: {
            role: "Full Stack Developer",
            experience: "2-4 years",
            skills: ["JavaScript", "React", "Node.js", "MongoDB"],
            description: "We are looking for a full stack developer..."
        }
    });
};