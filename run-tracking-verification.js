#!/usr/bin/env node

/**
 * Email Tracking Verification Script
 * 
 * This script verifies the email tracking data flow in your Supabase database.
 * It checks table structures, data presence, RLS policies, and relationships.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Color codes for better output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.bold + colors.cyan);
    console.log('='.repeat(60));
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function runQuery(query, description) {
    try {
        logInfo(`Running: ${description}`);
        const { data, error } = await supabase.rpc('exec_sql', { query });
        
        if (error) {
            logError(`Failed: ${error.message}`);
            return null;
        }
        
        logSuccess(`Success: ${description}`);
        return data;
    } catch (err) {
        logError(`Exception: ${err.message}`);
        return null;
    }
}

async function checkTableStructure(tableName) {
    logSection(`${tableName.toUpperCase()} TABLE STRUCTURE`);
    
    const query = `
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
    `;
    
    const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
    
    if (error) {
        logError(`Table ${tableName} structure check failed: ${error.message}`);
        return false;
    }
    
    if (!data || data.length === 0) {
        logError(`Table ${tableName} does not exist or has no columns`);
        return false;
    }
    
    logSuccess(`Table ${tableName} exists with ${data.length} columns:`);
    data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    return true;
}

async function checkRecentData(tableName, timeColumn = 'created_at') {
    logSection(`${tableName.toUpperCase()} DATA CHECK`);
    
    const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        logError(`Failed to check ${tableName} data: ${error.message}`);
        return;
    }
    
    const totalCount = data;
    logInfo(`Total records in ${tableName}: ${totalCount || 0}`);
    
    // Get sample records
    const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .order(timeColumn, { ascending: false })
        .limit(3);
    
    if (sampleError) {
        logWarning(`Could not fetch sample data from ${tableName}: ${sampleError.message}`);
    } else if (sampleData && sampleData.length > 0) {
        logSuccess(`Sample records from ${tableName}:`);
        sampleData.forEach((record, index) => {
            console.log(`  Record ${index + 1}:`, JSON.stringify(record, null, 2));
        });
    } else {
        logWarning(`No data found in ${tableName}`);
    }
}

async function checkEmailEvents() {
    logSection('EMAIL EVENTS ANALYSIS');
    
    // Check event types distribution
    const { data: eventTypes, error: eventError } = await supabase
        .from('email_events')
        .select('event_type')
        .then(result => {
            if (result.error) return result;
            
            const distribution = {};
            result.data.forEach(row => {
                distribution[row.event_type] = (distribution[row.event_type] || 0) + 1;
            });
            
            return { data: distribution, error: null };
        });
    
    if (eventError) {
        logError(`Failed to analyze email events: ${eventError.message}`);
    } else if (eventTypes) {
        logSuccess('Email event types distribution:');
        Object.entries(eventTypes).forEach(([type, count]) => {
            console.log(`  - ${type}: ${count}`);
        });
    }
}

async function checkCampaignRelationships() {
    logSection('CAMPAIGN-EVENT RELATIONSHIPS');
    
    // Check campaigns with their event counts
    const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
            id,
            name,
            status,
            created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (campaignError) {
        logError(`Failed to fetch campaigns: ${campaignError.message}`);
        return;
    }
    
    if (!campaigns || campaigns.length === 0) {
        logWarning('No campaigns found');
        return;
    }
    
    logSuccess('Recent campaigns:');
    for (const campaign of campaigns) {
        console.log(`\n  Campaign: ${campaign.name} (${campaign.status})`);
        console.log(`    ID: ${campaign.id}`);
        console.log(`    Created: ${campaign.created_at}`);
        
        // Get event count for this campaign
        const { data: events, error: eventError } = await supabase
            .from('email_events')
            .select('event_type', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);
        
        if (eventError) {
            logWarning(`    Could not fetch events: ${eventError.message}`);
        } else {
            console.log(`    Events: ${events || 0}`);
        }
    }
}

async function checkRLSPolicies() {
    logSection('RLS POLICIES CHECK');
    
    const tables = ['email_events', 'campaign_analytics', 'email_tracking', 'campaigns'];
    
    for (const table of tables) {
        logInfo(`Checking RLS for ${table}...`);
        
        // Try to access the table directly
        const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            if (error.message.includes('permission denied') || error.message.includes('RLS')) {
                logWarning(`${table}: RLS policy may be blocking access - ${error.message}`);
            } else if (error.message.includes('does not exist')) {
                logError(`${table}: Table does not exist`);
            } else {
                logWarning(`${table}: ${error.message}`);
            }
        } else {
            logSuccess(`${table}: Accessible (${data || 0} records)`);
        }
    }
}

async function main() {
    log('🔍 SUPABASE EMAIL TRACKING VERIFICATION', colors.bold + colors.magenta);
    log('==========================================', colors.magenta);
    
    try {
        // Test basic connection
        logSection('CONNECTION TEST');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('campaigns')
            .select('count', { count: 'exact', head: true });
        
        if (connectionError) {
            logError(`Connection failed: ${connectionError.message}`);
            process.exit(1);
        }
        
        logSuccess('Successfully connected to Supabase');
        
        // Check table structures
        const tables = ['email_events', 'campaign_analytics', 'email_tracking', 'campaigns'];
        const existingTables = [];
        
        for (const table of tables) {
            const exists = await checkTableStructure(table);
            if (exists) {
                existingTables.push(table);
            }
        }
        
        // Check data in existing tables
        for (const table of existingTables) {
            await checkRecentData(table);
        }
        
        // Specific checks
        if (existingTables.includes('email_events')) {
            await checkEmailEvents();
        }
        
        if (existingTables.includes('campaigns')) {
            await checkCampaignRelationships();
        }
        
        // Check RLS policies
        await checkRLSPolicies();
        
        logSection('VERIFICATION COMPLETE');
        logSuccess('Email tracking verification finished');
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`- Tables found: ${existingTables.length}/${tables.length}`);
        console.log(`- Missing tables: ${tables.filter(t => !existingTables.includes(t)).join(', ') || 'None'}`);
        
        if (existingTables.length < tables.length) {
            logWarning('Some tables are missing. Check migration status.');
        }
        
    } catch (error) {
        logError(`Unexpected error: ${error.message}`);
        process.exit(1);
    }
}

// Run the verification
main().catch(console.error);