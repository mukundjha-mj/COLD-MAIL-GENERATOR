import { ChatGroq } from "@langchain/groq";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";


class AIService {
    private llm: ChatGroq;
    constructor() {
        this.llm = new ChatGroq({
            temperature: 0,
            model: "llama-3.3-70b-versatile",
            apiKey: process.env.GROQ_API_KEY
        })
    }
    async extractJobInfo(cleanedText: string) {
        try {
            console.log("Extracting job info from text length:", cleanedText.length);
            
            const promptExtract = PromptTemplate.fromTemplate(`
                ### SCRAPED TEXT FROM WEBSITE:
                {page_data}
                ### INSTRUCTION:
                The scraped text is from the career's page of a website.
                Your job is to extract the job posting and return them in JSON format containing the
                following keys: \`role\`, \`experience\`, \`skills\` and \`description\`.
                The \`skills\` should be an array of strings.
                Only return the valid JSON.
                ### VALID JSON (NO PREAMBLE):
            `);
            
            const chainExtract = promptExtract.pipe(this.llm);
            const res = await chainExtract.invoke({ page_data: cleanedText });
            
            console.log("AI Response:", res.content);

            try {
                const jsonParser = new JsonOutputParser();
                const parsedRes = await jsonParser.parse(res.content as string);
                
                // Ensure we return a single job object, not an array
                const jobData = Array.isArray(parsedRes) ? parsedRes[0] : parsedRes;
                
                // Validate the job data has required fields
                if (!jobData || typeof jobData !== 'object') {
                    throw new Error("Invalid job data structure");
                }
                
                // Ensure skills is an array
                if (!jobData.skills) {
                    jobData.skills = [];
                } else if (typeof jobData.skills === 'string') {
                    // If skills is a string, split it into an array
                    jobData.skills = jobData.skills.split(',').map((skill: string) => skill.trim());
                } else if (!Array.isArray(jobData.skills)) {
                    jobData.skills = [];
                }
                
                console.log("Parsed job data:", jobData);
                return jobData;
                
            } catch (parseError) {
                console.error("Parse error:", parseError);
                throw new Error("Context too big. Unable to parse jobs.");
            }
        } catch (error) {
            console.error("Error extracting jobs:", error);
            throw error;
        }
    }

    async writeEmail(job: any, links: string) {
        try {
            const promptEmail = PromptTemplate.fromTemplate(`
                ### JOB DESCRIPTION:
                Role: {role}
                Experience Required: {experience}
                Skills Required: {skills}
                Description: {description}
                
                ### INSTRUCTION:
                You are Balmukund Jha, currently in the final year of MCA at VIT with diverse skills and experience.
                Your primary expertise is in full-stack development (JavaScript, TypeScript, React, Next.js, Node.js, MongoDB, PostgreSQL), 
                but you are also adaptable and have transferable skills that can apply to various roles.
                
                Write a professional cold email for the specific job role mentioned above. 
                - If it's a technical/development role, emphasize your technical skills
                - If it's a non-technical role (like HR, Admin, etc.), focus on your analytical skills, problem-solving abilities, communication skills, and adaptability
                - Always be honest about your background but highlight relevant transferable skills
                - Customize your response based on the actual job requirements
                
                Include relevant portfolio links if they match the job requirements: {link_list}
                
                Make the email personalized to the specific role and requirements mentioned in the job description.
                Do not provide a preamble.
                ### EMAIL (NO PREAMBLE):
            `);
            
            const chainEmail = promptEmail.pipe(this.llm);
            const res = await chainEmail.invoke({
                role: job.role || "Not specified",
                experience: job.experience || "Not specified", 
                skills: Array.isArray(job.skills) ? job.skills.join(", ") : "Not specified",
                description: job.description || "Not specified",
                link_list: links
            })
            return res.content as string;
        } catch(error) {
            console.error("Error writing email: ", error);
            throw error;
        }
    }

    async loadWebPage(url: string): Promise<string> {
        try {
            console.log("Attempting to load webpage:", url);
            
            const loader = new CheerioWebBaseLoader(url, {
                // Add some configuration to avoid being blocked
                timeout: 30000, // 30 second timeout
                // You can add more options here if needed
            });
            
            const docs = await loader.load();
            
            if (!docs || docs.length === 0) {
                throw new Error("No content loaded from the webpage");
            }
            
            const content = docs[0].pageContent;
            console.log("Successfully loaded webpage, content preview:", content.substring(0, 200) + "...");
            
            if (content.length < 100) {
                console.warn("Warning: Very short content loaded, might indicate an error page");
            }
            
            return content;
        } catch (error) {
            console.error("Error loading webpage:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to load webpage: ${error.message}`);
            } else {
                throw new Error("Failed to load webpage: Unknown error");
            }
        }
    }

}


export default new AIService();