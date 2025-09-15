import fs from "fs"
import path from "path"

interface PortfolioItem {
    Techstack: string;
    Links: string;
}

class PortfolioService {
    private portfolioData: PortfolioItem[];

    constructor(){
        this.portfolioData = this.loadPortfolio();
    }

    loadPortfolio(): PortfolioItem[] {
        try{
            const dataPath = path.join(__dirname, '../data/portfolio.json');
            const data = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(data) as PortfolioItem[];
        } catch(error){
            console.error('Error loading portfolio data:', error);
            return [];
        }
    }

    queryLinks(skills: string[]): string[] {
        if(!skills || !Array.isArray(skills)) return [];

        const matchingLinks: string[] = [];
        
        // Define technical keywords that would match our portfolio
        const technicalKeywords = [
            'javascript', 'typescript', 'react', 'node', 'mongodb', 'postgresql', 
            'web', 'development', 'programming', 'software', 'full-stack', 'frontend', 'backend',
            'database', 'api', 'microservices', 'html', 'css', 'express', 'next.js', 'vue'
        ];

        for(const skill of skills){
            const skillLower = skill.toLowerCase();
            
            // First, try exact or partial matches with our portfolio
            const matches = this.portfolioData.filter((item: PortfolioItem) => 
                item.Techstack.toLowerCase().includes(skillLower)
            );

            matches.forEach((match: PortfolioItem) => {
                if(!matchingLinks.includes(match.Links)){
                    matchingLinks.push(match.Links);
                }
            });
            
            // For non-technical skills, check if any technical keywords match
            const isTechnicalSkill = technicalKeywords.some(keyword => 
                skillLower.includes(keyword) || keyword.includes(skillLower)
            );
            
            if (isTechnicalSkill && matchingLinks.length === 0) {
                // Add a default technical portfolio link
                const defaultLinks = [
                    "https://github.com/balmukund/react-portfolio",
                    "https://github.com/balmukund/nodejs-project"
                ];
                defaultLinks.forEach(link => {
                    if (!matchingLinks.includes(link)) {
                        matchingLinks.push(link);
                    }
                });
            }
        }
        
        return matchingLinks.slice(0, 2);
    }

}

export default new PortfolioService();