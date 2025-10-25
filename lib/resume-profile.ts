// Resume Profile - Used by AI agents for personalized job matching
export const RESUME_PROFILE = {
    personalInfo: {
        name: "Yash Singh",
        email: "yashs3324@gmail.com",
        phone: "+91 8755-765-125",
        linkedin: "https://www.linkedin.com/in/yash-singh",
        github: "https://github.com/yash-singh",
        leetcode: "https://leetcode.com/yash-singh",
        codeforces: "https://codeforces.com/profile/yash-singh"
    },
    
    education: {
        institution: "Indian Institute of Information Technology Una",
        degree: "Bachelor of Technology in Computer Science",
        duration: "October 2022 – July 2026",
        gpa: "8.3/10.0",
        graduationYear: 2026
    },
    
    experience: [
        {
            company: "Binocs",
            role: "Software Development Engineer Intern",
            duration: "July 2025 – Present",
            location: "Remote",
            technologies: ["Python", "FastAPI", "AWS", "Docker", "Helm", "Grafana", "Go"],
            highlights: [
                "Delivered full-stack admin panel with CI/CD pipelines and microservices proxy architecture",
                "Optimized 6000+ LOC backend/frontend codebase for PPT generation pipeline",
                "Accelerated LLM API response times by 20% through asynchronous Python optimization",
                "Established AWS SES/SQU email automation infrastructure processing 500+ daily notifications"
            ]
        },
        {
            company: "ViewR",
            role: "Software Engineering Intern",
            duration: "January 2025 – July 2025",
            location: "Remote",
            technologies: ["React", "Elysia.js", "Python", "AWS Rekognition", "Docker", "Kubernetes"],
            highlights: [
                "Architected cross-platform desktop application using Electron, React, and TypeScript",
                "Spearheaded real-time video streaming platform with ONVIF and RTSP protocols",
                "Deployed 4 AI/ML models for attendance tracking and face recognition",
                "Enhanced Kubernetes infrastructure with ingress controller and load balancing"
            ]
        },
        {
            company: "IIT Mandi",
            role: "Research Assistant (Intern)",
            duration: "May 2024 – September 2024",
            location: "Himachal Pradesh",
            technologies: ["Python", "Keras", "NumPy", "Pandas", "Seaborn", "Machine Learning"],
            highlights: [
                "Refined continuous authentication system boosting security accuracy from 89% to 92%",
                "Investigated molecular olfaction using Graph Neural Networks",
                "Streamlined Transformer architectures for NLP tasks"
            ]
        }
    ],
    
    projects: [
        {
            name: "Resume Builder Platform",
            technologies: ["TypeScript", "Next.js", "Prisma", "PostgreSQL", "Docker", "Turborepo", "Recoil", "Gemini API"],
            highlights: [
                "Serving 1,000+ monthly users",
                "99.9% uptime handling 5,000+ concurrent users",
                "AI-powered resume optimization"
            ]
        },
        {
            name: "Payment Processing System",
            technologies: ["WebHooks", "Next.js", "Docker", "MongoDB", "Prisma", "NextAuth", "CI/CD", "AWS"],
            highlights: [
                "Processing 2,000+ daily transactions",
                "Reduced confirmation time by 40%",
                "99.95% success rate with 500+ concurrent users"
            ]
        }
    ],
    
    skills: {
        programmingLanguages: ["Python", "JavaScript", "TypeScript", "C++", "C", "HTML", "CSS", "SQL"],
        frameworks: ["React", "Next.js", "Node.js", "Express.js", "Electron.js", "Prisma ORM", "Redux", "Recoil"],
        databases: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "AWS", "Google Cloud Platform", "Firebase"],
        devops: ["Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", "Jenkins", "Linux", "Bash", "Helm"],
        machineLearning: ["TensorFlow", "Keras", "PyTorch", "NumPy", "Pandas", "Scikit-learn", "OpenCV", "NLP", "Graph Neural Networks"],
        other: ["WebRTC", "WebSockets", "Microservices", "RESTful APIs", "GraphQL", "Blockchain", "Solana", "Ethereum"]
    },
    
    achievements: [
        "Secured 4th place among 50+ teams developing HD cryptocurrency wallet with biometric authentication",
        "Earned top 4 position in AlgoUniversity Contest among 200+ participants",
        "Delivered 7th place finish with 97% accurate Music Similarity generator using ML algorithms"
    ],
    
    // Job Search Preferences
    preferences: {
        targetRoles: ["Software Development Engineer", "SDE Intern", "Backend Engineer", "Full Stack Engineer", "ML Engineer"],
        graduationYear: 2026,
        minimumStipend: 50000, // INR per month
        locationPreference: ["Remote", "Bangalore", "Hyderabad", "Pune", "Delhi NCR"],
        companySize: ["Startup", "Mid-sized", "Large"],
        mustHaveKeywords: ["2026 passout", "SDE", "full-time", "PPO", "placement"],
        avoidKeywords: ["contract", "part-time", "freelance"],
        priorities: {
            ppoOpportunity: "high",
            learningOpportunity: "high",
            compensation: "high",
            workLifeBalance: "medium",
            brandValue: "medium"
        }
    }
} as const;

// Helper function to generate resume summary for AI prompts
export function getResumeContext(): string {
    const { personalInfo, education, experience, skills, preferences } = RESUME_PROFILE;
    
    return `
# Candidate Profile

**Name**: ${personalInfo.name}
**Education**: ${education.degree} from ${education.institution} (GPA: ${education.gpa})
**Graduation Year**: ${education.graduationYear}

## Key Skills
- **Programming**: ${skills.programmingLanguages.join(", ")}
- **Frameworks**: ${skills.frameworks.slice(0, 8).join(", ")}
- **DevOps**: ${skills.devops.slice(0, 6).join(", ")}
- **Databases**: ${skills.databases.slice(0, 5).join(", ")}
- **ML/AI**: ${skills.machineLearning.slice(0, 6).join(", ")}

## Recent Experience
${experience.map(exp => `
- **${exp.role}** at ${exp.company} (${exp.duration})
  - Technologies: ${exp.technologies.slice(0, 5).join(", ")}
  - ${exp.highlights[0]}
`).join("\n")}

## Job Search Criteria
- **Target Roles**: ${preferences.targetRoles.join(", ")}
- **Graduation Year**: ${preferences.graduationYear}
- **Minimum Stipend**: ₹${preferences.minimumStipend.toLocaleString()}/month
- **Location Preference**: ${preferences.locationPreference.join(", ")}
- **Must-Have Keywords**: ${preferences.mustHaveKeywords.join(", ")}
- **Priorities**: PPO Opportunity (${preferences.priorities.ppoOpportunity}), Good Compensation (${preferences.priorities.compensation}), Learning (${preferences.priorities.learningOpportunity})

## Unique Strengths
- Full-stack development with production experience (1000+ users, 5000+ concurrent)
- DevOps & Cloud infrastructure (AWS, Docker, Kubernetes, CI/CD)
- ML/AI experience (NLP, GNN, TensorFlow, PyTorch)
- Real-time systems (WebRTC, WebSockets, streaming)
- Research experience at IIT Mandi
`;
}

// Helper to calculate job match score
export function calculateJobMatchScore(jobDescription: string): {
    score: number;
    matchedSkills: string[];
    relevanceFactors: string[];
    warnings: string[];
} {
    const lowerDesc = jobDescription.toLowerCase();
    const matchedSkills: string[] = [];
    const relevanceFactors: string[] = [];
    const warnings: string[] = [];
    let score = 0;
    
    // Check graduation year (critical)
    if (lowerDesc.includes('2026') || lowerDesc.includes('2026 passout') || lowerDesc.includes('2026 graduate')) {
        score += 30;
        relevanceFactors.push('✅ Specifically hiring 2026 passouts');
    } else if (lowerDesc.includes('fresher') || lowerDesc.includes('recent graduate')) {
        score += 15;
        relevanceFactors.push('Accepts fresh graduates');
    }
    
    // Check role match
    const targetRoles = RESUME_PROFILE.preferences.targetRoles.map(r => r.toLowerCase());
    if (targetRoles.some(role => lowerDesc.includes(role.toLowerCase()))) {
        score += 25;
        relevanceFactors.push('✅ Role matches target positions');
    }
    
    // Check PPO opportunity
    if (lowerDesc.includes('ppo') || lowerDesc.includes('pre-placement offer') || lowerDesc.includes('full-time conversion')) {
        score += 20;
        relevanceFactors.push('✅ PPO opportunity mentioned');
    }
    
    // Check skill matches (programming languages)
    RESUME_PROFILE.skills.programmingLanguages.forEach(skill => {
        if (lowerDesc.includes(skill.toLowerCase())) {
            matchedSkills.push(skill);
            score += 2;
        }
    });
    
    // Check framework matches
    RESUME_PROFILE.skills.frameworks.forEach(framework => {
        if (lowerDesc.includes(framework.toLowerCase())) {
            matchedSkills.push(framework);
            score += 3;
        }
    });
    
    // Check DevOps skills
    RESUME_PROFILE.skills.devops.forEach(tool => {
        if (lowerDesc.includes(tool.toLowerCase())) {
            matchedSkills.push(tool);
            score += 2;
        }
    });
    
    // Check location preference
    if (RESUME_PROFILE.preferences.locationPreference.some(loc => lowerDesc.includes(loc.toLowerCase()))) {
        score += 10;
        relevanceFactors.push('Preferred location match');
    }
    
    // Check for red flags
    if (RESUME_PROFILE.preferences.avoidKeywords.some(kw => lowerDesc.includes(kw))) {
        score -= 20;
        warnings.push('⚠️ Contains keywords to avoid (contract/part-time)');
    }
    
    // Bonus for high-growth companies or good compensation
    if (lowerDesc.includes('competitive salary') || lowerDesc.includes('high stipend')) {
        score += 5;
        relevanceFactors.push('Competitive compensation mentioned');
    }
    
    if (matchedSkills.length > 5) {
        relevanceFactors.push(`Strong skill match (${matchedSkills.length} skills)`);
    }
    
    return {
        score: Math.min(100, Math.max(0, score)),
        matchedSkills: [...new Set(matchedSkills)],
        relevanceFactors,
        warnings
    };
}

