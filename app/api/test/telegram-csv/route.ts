import { NextResponse } from 'next/server';
import { sendTelegramDocument, notifyJobOpportunities } from '@/lib/telegram';

export async function GET() {
    console.log('🧪 Testing Telegram CSV sending...');

    // Test CSV content
    const testCSV = `Title,Company,Location,Salary,Match Score,Matched Skills,Relevance Factors,URL
SDE Intern,Google,Bangalore,₹80000/month,92,"Python, React, AWS, Docker","2026 Batch; PPO Opportunity",https://example.com/job1
Software Engineer Intern,Microsoft,Hyderabad,₹75000/month,88,"JavaScript, Node.js, Azure","2026 Batch; Good Stipend",https://example.com/job2`;

    console.log(`📄 Test CSV length: ${testCSV.length} bytes`);

    // Test direct CSV sending
    console.log('\n1️⃣ Testing direct CSV document send...');
    const directResult = await sendTelegramDocument(
        'job',
        {
            filename: 'test-jobs.csv',
            content: testCSV,
        },
        '🧪 Test CSV file from direct send'
    );

    console.log(`Result: ${JSON.stringify(directResult, null, 2)}`);

    // Test via notifyJobOpportunities
    console.log('\n2️⃣ Testing via notifyJobOpportunities...');
    const testJobs = [
        {
            title: 'SDE Intern',
            company: 'Google',
            location: 'Bangalore',
            salary: '₹80,000/month',
            matchScore: 92,
            matchedSkills: ['Python', 'React', 'AWS', 'Docker'],
            url: 'https://example.com/job1',
            relevanceFactors: ['🎯 2026 Batch', '✅ PPO Opportunity'],
        },
        {
            title: 'Software Engineer Intern',
            company: 'Microsoft',
            location: 'Hyderabad',
            salary: '₹75,000/month',
            matchScore: 88,
            matchedSkills: ['JavaScript', 'Node.js', 'Azure'],
            url: 'https://example.com/job2',
            relevanceFactors: ['🎯 2026 Batch', '💰 Good Stipend'],
        },
    ];

    await notifyJobOpportunities(testJobs, testCSV);

    return NextResponse.json({
        success: true,
        message: 'Test completed. Check console logs and Telegram.',
        directSendResult: directResult,
        csvLength: testCSV.length,
        jobsCount: testJobs.length,
    });
}


