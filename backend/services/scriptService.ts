// services/scriptService.ts

interface UserData {
    name: string;
    city: string;
    phone: string;
    actor?: string;
}

interface ScriptTemplate {
    id: string;
    name: string;
    content: string;
    variables: string[];
    duration?: string;
    voice?: string;
}

interface GeneratedScript {
    id: string;
    templateId: string;
    personalizedContent: string;
    userData: UserData;
    generatedAt: Date;
    estimatedDuration?: number;
}

class ScriptService {
    private templates: ScriptTemplate[] = [
        {
            id: 'marketing_intro',
            name: 'Marketing Introduction',
            content: `Hello {{name}} from {{city}}! 

This is a personalized video message just for you. We're excited to connect with you and share something special.

Your phone number {{phone}} has been registered for our premium service. We believe you'll love what we have to offer.

Thank you for your time, {{name}}. We look forward to serving you in {{city}}!`,
            variables: ['name', 'city', 'phone'],
            duration: '15-20 seconds',
            voice: 'nova'
        },
        {
            id: 'welcome_message',
            name: 'Welcome Message',
            content: `Hi {{name}}! Welcome to our platform! 

We're thrilled that you've joined us from {{city}}. Your journey with us is about to begin, and we're here to make it amazing.

We'll keep you updated at {{phone}} with all the latest news and offers.

Thanks for choosing us, {{name}}!`,
            variables: ['name', 'city', 'phone'],
            duration: '12-15 seconds',
            voice: 'shimmer'
        },
        {
            id: 'promotion_offer',
            name: 'Promotional Offer',
            content: `Hey {{name}}! 

We have an exclusive offer just for residents of {{city}}! This is a limited-time opportunity that we don't want you to miss.

Check your messages at {{phone}} for all the details. This offer is personalized specifically for you, {{name}}.

Don't wait - grab this deal today!`,
            variables: ['name', 'city', 'phone'],
            duration: '10-15 seconds',
            voice: 'alloy'
        }
    ];

    // Get all available templates
    getTemplates(): ScriptTemplate[] {
        return this.templates;
    }

    // Get template by ID
    getTemplate(templateId: string): ScriptTemplate | null {
        return this.templates.find(t => t.id === templateId) || null;
    }

    // Generate personalized script from template
    generateScript(templateId: string, userData: UserData): GeneratedScript | null {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template with ID '${templateId}' not found`);
        }

        // Replace template variables with user data
        let personalizedContent = template.content;
        
        // Replace {{name}}
        personalizedContent = personalizedContent.replace(/{{name}}/g, userData.name);
        
        // Replace {{city}}
        personalizedContent = personalizedContent.replace(/{{city}}/g, userData.city);
        
        // Replace {{phone}}
        personalizedContent = personalizedContent.replace(/{{phone}}/g, userData.phone);

        // Clean up extra whitespace and line breaks
        personalizedContent = personalizedContent
            .replace(/\n\s*\n/g, '\n\n') // Replace multiple line breaks with double line breaks
            .trim();

        console.log(`📝 Generated personalized script for ${userData.name} from template '${templateId}'`);

        return {
            id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            templateId,
            personalizedContent,
            userData,
            generatedAt: new Date(),
            estimatedDuration: this.estimateDuration(personalizedContent)
        };
    }

    // Add custom template
    addTemplate(template: Omit<ScriptTemplate, 'id'>): ScriptTemplate {
        const newTemplate: ScriptTemplate = {
            ...template,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.templates.push(newTemplate);
        console.log(`✅ Added new template: ${newTemplate.name}`);
        return newTemplate;
    }

    // Validate template variables
    validateTemplate(templateContent: string): { isValid: boolean; missingVariables?: string[] } {
        const requiredVars = ['name', 'city', 'phone'];
        const foundVars = templateContent.match(/{{(\w+)}}/g) || [];
        const extractedVars = foundVars.map(v => v.replace(/[{}]/g, ''));
        
        const missingVars = requiredVars.filter(rv => !extractedVars.includes(rv));
        
        return {
            isValid: missingVars.length === 0,
            missingVariables: missingVars.length > 0 ? missingVars : undefined
        };
    }

    // Estimate script duration (rough calculation)
    private estimateDuration(content: string): number {
        // Average speaking rate: ~150 words per minute
        const words = content.split(/\s+/).length;
        const minutes = words / 150;
        const seconds = Math.ceil(minutes * 60);
        return seconds;
    }

    // Get random template
    getRandomTemplate(): ScriptTemplate {
        const randomIndex = Math.floor(Math.random() * this.templates.length);
        return this.templates[randomIndex];
    }

    // Search templates
    searchTemplates(query: string): ScriptTemplate[] {
        const lowerQuery = query.toLowerCase();
        return this.templates.filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.content.toLowerCase().includes(lowerQuery)
        );
    }
}

export default ScriptService;
export type { UserData, ScriptTemplate, GeneratedScript };
