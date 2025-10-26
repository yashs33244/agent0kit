import { tool } from 'ai';
import { z } from 'zod';

/**
 * Lusha API Tool - Contact & Company Enrichment
 * 
 * Get phone numbers, emails, and company data for sales outreach
 * Docs: https://www.lusha.com/docs/api/
 */

export const lushaTool = tool({
    description: `Find contact information and enrich company data using Lusha API. Perfect for sales prospecting. Returns phone numbers, emails, LinkedIn profiles, and company details. Use this to find decision maker contacts at target companies.`,

    inputSchema: z.object({
        companyDomain: z.string().describe('Company website domain to search (e.g., binocs.co, sequoiacap.com)'),
    }),

    execute: async ({ companyDomain }) => {
        const apiKey = process.env.LUSHA_API_KEY;

        // Try Lusha first if API key is available
        if (apiKey) {
            try {
                console.log(`🔍 Lusha company lookup for: ${companyDomain}`);
                const result = await lookupCompany({ domain: companyDomain, apiKey });

                // If successful, return immediately
                if (result.success) {
                    return result;
                }

                // If failed (including rate limit), fall through to AI enrichment
                console.log(`⚠️ Lusha lookup failed: ${('error' in result) ? result.error : 'Unknown error'}, trying AI fallback...`);
            } catch (error) {
                console.error('❌ Lusha API error:', error);
                console.log('🤖 Falling back to AI enrichment...');
            }
        } else {
            console.log('⚠️ LUSHA_API_KEY not configured, using AI fallback');
        }

        // AI Fallback: Use AI to enrich contact information
        try {
            const { enrichContactWithAI } = await import('@/lib/contact-enrichment');

            // Extract company name from domain
            const companyName = companyDomain
                .replace(/^www\./, '')
                .replace(/\.[a-z]+$/, '')
                .split('.')[0];

            const aiContact = await enrichContactWithAI({
                companyName,
                companyDomain,
            });

            if (aiContact) {
                return {
                    success: true,
                    data: {
                        name: aiContact.company,
                        domain: companyDomain,
                        industry: 'To be verified',
                        location: {
                            city: null,
                            state: null,
                            country: null,
                        },
                        contactInfo: {
                            email: aiContact.email,
                            phone: aiContact.phone,
                            linkedin: aiContact.linkedin,
                        },
                    },
                    message: `AI-enriched contact information for ${aiContact.company}`,
                    summary: `Contact info retrieved via AI (Lusha unavailable)`,
                    source: 'AI',
                    note: aiContact.notes,
                };
            }

            return {
                success: false,
                error: 'Both Lusha and AI enrichment failed',
                message: `Could not find contact information for ${companyDomain}. Try searching on LinkedIn or company website.`,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to enrich contact data. Both Lusha and AI fallback unavailable.',
            };
        }
    },
});

async function lookupPerson({ firstName, lastName, companyDomain, apiKey }: any) {
    const params = new URLSearchParams();

    if (firstName) params.append('firstName', firstName);
    if (lastName) params.append('lastName', lastName);
    if (companyDomain) params.append('companyDomain', companyDomain);

    const url = `https://api.lusha.com/person?${params.toString()}`;

    console.log(`📞 Looking up person: ${firstName} ${lastName} at ${companyDomain}`);

    const response = await fetch(url, {
        headers: {
            'api_key': apiKey,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lusha API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Format response
    const result = {
        success: true,
        data: {
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            title: data.title,
            company: data.company,
            location: data.location,
            emails: data.emailAddresses || [],
            phones: data.phoneNumbers?.map((p: any) => ({
                number: p.number,
                type: p.type,
                country: p.countryCode,
            })) || [],
            socialProfiles: {
                linkedin: data.linkedInUrl,
                twitter: data.twitterUrl,
            },
            confidence: data.confidence,
        },
        message: `Found contact information for ${data.firstName} ${data.lastName}`,
        contactInfo: {
            primaryEmail: data.emailAddresses?.[0],
            primaryPhone: data.phoneNumbers?.[0]?.number,
            linkedin: data.linkedInUrl,
        },
    };

    console.log(`✅ Found ${result.data.emails.length} emails and ${result.data.phones.length} phone numbers`);

    return result;
}

async function lookupCompany({ domain, apiKey }: any) {
    if (!domain) {
        return {
            success: false,
            error: 'Domain required for company lookup',
        };
    }

    console.log(`🏢 Looking up company: ${domain}`);

    const url = `https://api.lusha.com/company?domain=${domain}`;

    const response = await fetch(url, {
        headers: {
            'api_key': apiKey,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lusha API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    const result = {
        success: true,
        data: {
            name: data.name,
            domain: data.domain,
            industry: data.industry,
            employees: data.employeeCount,
            revenue: data.revenue,
            location: {
                city: data.city,
                state: data.state,
                country: data.country,
            },
            description: data.description,
            founded: data.foundedYear,
            technologies: data.technologies || [],
            socialProfiles: {
                linkedin: data.linkedInUrl,
                twitter: data.twitterUrl,
                facebook: data.facebookUrl,
            },
        },
        message: `Found company information for ${data.name}`,
        summary: `${data.name} - ${data.employeeCount} employees in ${data.industry}`,
    };

    console.log(`✅ Company info retrieved: ${result.summary}`);

    return result;
}

async function bulkEnrich({ companyDomain, jobTitle, department, seniority, apiKey }: any) {
    if (!companyDomain) {
        return {
            success: false,
            error: 'Company domain required for bulk enrichment',
        };
    }

    console.log(`📋 Bulk enrichment for ${companyDomain} - ${jobTitle || 'all roles'}`);

    // First get company info
    const companyInfo = await lookupCompany({ domain: companyDomain, apiKey });

    // Check if company lookup was successful
    if (!companyInfo.success || !('data' in companyInfo)) {
        return {
            success: false,
            error: 'Failed to get company information',
            message: 'Could not retrieve company details for bulk enrichment',
        };
    }

    // Then search for people at this company
    const params = new URLSearchParams({
        companyDomain,
        ...(jobTitle && { title: jobTitle }),
        ...(department && { department }),
        ...(seniority && { seniority }),
    });

    const url = `https://api.lusha.com/people?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            'api_key': apiKey,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        // If bulk search fails, return company info
        return {
            success: true,
            data: {
                company: companyInfo.data,
                contacts: [],
            },
            message: 'Company info retrieved, but could not find contacts. Try specific person lookup.',
            note: 'Bulk search may require Lusha Pro plan',
        };
    }

    const peopleData = await response.json();
    const people = peopleData.data || [];

    const contacts = people.slice(0, 10).map((person: any) => ({
        name: `${person.firstName} ${person.lastName}`,
        title: person.title,
        email: person.emailAddresses?.[0],
        phone: person.phoneNumbers?.[0]?.number,
        linkedin: person.linkedInUrl,
        department: person.department,
    }));

    console.log(`✅ Found ${contacts.length} contacts at ${companyDomain}`);

    return {
        success: true,
        data: {
            company: companyInfo.data,
            contacts,
            totalFound: people.length,
        },
        message: `Found ${contacts.length} contacts at ${companyInfo.data.name}`,
        summary: `Retrieved contacts for ${jobTitle || 'all roles'} at ${companyInfo.data.name}`,
    };
}

