import { openaiClient } from './ai/client';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

/**
 * Contact Enrichment Utilities
 * 
 * Provides AI-powered contact enrichment when Lusha rate limits occur
 * Generates CSV files for found contacts
 */

export interface Contact {
    name: string;
    title?: string;
    company: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    website?: string;
    notes?: string;
}

/**
 * Use AI to enrich contact information when Lusha fails
 * Falls back to Claude/OpenAI for intelligent guessing based on company info
 */
export async function enrichContactWithAI(params: {
    companyName: string;
    companyDomain: string;
    personName?: string;
    personTitle?: string;
}): Promise<Contact | null> {
    try {
        console.log(`🤖 Using AI to enrich contact for ${params.companyName}`);

        const prompt = `You are a professional contact researcher. Based on the following information, provide the most likely contact details in JSON format.

Company: ${params.companyName}
Website: ${params.companyDomain}
${params.personName ? `Person Name: ${params.personName}` : ''}
${params.personTitle ? `Person Title: ${params.personTitle}` : ''}

Provide the most likely professional contact information. For email addresses, use common business email formats like:
- firstname.lastname@${params.companyDomain}
- firstname@${params.companyDomain}  
- firstinitiallastname@${params.companyDomain}

For phone numbers, if you don't have actual data, it's better to leave it empty.

Return ONLY a JSON object with this structure (use null for unknown fields):
{
  "name": "Full Name",
  "title": "Job Title",
  "company": "${params.companyName}",
  "email": "likely@email.com or null",
  "phone": "phone number or null",
  "linkedin": "linkedin profile URL or null",
  "website": "${params.companyDomain}",
  "notes": "Brief note about confidence level"
}`;

        const { text } = await generateText({
            model: openaiClient,
            prompt,
        });

        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log('⚠️ AI enrichment failed: no JSON in response');
            return null;
        }

        const contact = JSON.parse(jsonMatch[0]);
        console.log(`✅ AI enriched contact: ${contact.name || contact.company}`);
        
        return contact as Contact;
    } catch (error) {
        console.error('❌ AI enrichment failed:', error);
        return null;
    }
}

/**
 * Generate CSV content from contacts array
 */
export function generateContactsCSV(contacts: Contact[]): string {
    if (contacts.length === 0) {
        return 'Name,Title,Company,Email,Phone,LinkedIn,Website,Notes\n';
    }

    const headers = ['Name', 'Title', 'Company', 'Email', 'Phone', 'LinkedIn', 'Website', 'Notes'];
    
    const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const rows = contacts.map(contact => [
        escapeCSV(contact.name),
        escapeCSV(contact.title),
        escapeCSV(contact.company),
        escapeCSV(contact.email),
        escapeCSV(contact.phone),
        escapeCSV(contact.linkedin),
        escapeCSV(contact.website),
        escapeCSV(contact.notes),
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
}

/**
 * Save CSV to temp folder
 */
export async function saveContactsCSV(
    contacts: Contact[],
    filename: string = `contacts_${Date.now()}.csv`
): Promise<string> {
    try {
        // Ensure tmp directory exists
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
            console.log(`📁 Created tmp directory: ${tmpDir}`);
        }

        // Generate CSV content
        const csvContent = generateContactsCSV(contacts);
        
        // Save file
        const filePath = path.join(tmpDir, filename);
        fs.writeFileSync(filePath, csvContent, 'utf-8');
        
        console.log(`✅ Saved contacts CSV: ${filePath} (${contacts.length} contacts)`);
        return filePath;
    } catch (error) {
        console.error('❌ Failed to save CSV:', error);
        throw error;
    }
}

/**
 * Parse company domain from URL or text
 */
export function extractDomain(url: string): string {
    try {
        // Remove protocol
        let domain = url.replace(/^https?:\/\//, '');
        // Remove www
        domain = domain.replace(/^www\./, '');
        // Remove path
        domain = domain.split('/')[0];
        // Remove port
        domain = domain.split(':')[0];
        return domain;
    } catch {
        return url;
    }
}

/**
 * Extract contact info from text using AI
 */
export async function extractContactsFromText(text: string): Promise<Contact[]> {
    try {
        const prompt = `Extract all contact information from the following text. Return a JSON array of contacts.

Text:
${text.substring(0, 4000)}

Return ONLY a JSON array like this:
[
  {
    "name": "Person Name",
    "title": "Job Title",
    "company": "Company Name",
    "email": "email@example.com or null",
    "phone": "phone or null",
    "linkedin": "linkedin URL or null",
    "website": "company website or null",
    "notes": "any relevant notes"
  }
]

If no contacts found, return an empty array [].`;

        const { text: response } = await generateText({
            model: openaiClient,
            prompt,
        });

        // Extract JSON array
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return [];
        }

        const contacts = JSON.parse(jsonMatch[0]);
        console.log(`📋 Extracted ${contacts.length} contacts from text`);
        return contacts;
    } catch (error) {
        console.error('❌ Failed to extract contacts:', error);
        return [];
    }
}

