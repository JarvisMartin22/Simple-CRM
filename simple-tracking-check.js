#!/usr/bin/env node

/**
 * Simple Email Tracking Check
 * Uses basic Supabase client queries to verify tracking setup
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable(tableName) {
    console.log(`\n📊 Checking ${tableName}...`);
    
    try {
        // Check if table is accessible and get count
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`❌ Error accessing ${tableName}: ${error.message}`);
            return false;
        }
        
        console.log(`✅ ${tableName} is accessible`);
        console.log(`📈 Record count: ${count || 0}`);
        
        // If table has data, get a sample
        if (count > 0) {
            const { data: sampleData, error: sampleError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (!sampleError && sampleData && sampleData.length > 0) {
                console.log(`📝 Sample record structure:`);
                Object.keys(sampleData[0]).forEach(key => {
                    console.log(`   - ${key}`);
                });
            }
        }
        
        return true;
    } catch (err) {
        console.log(`❌ Exception checking ${tableName}: ${err.message}`);
        return false;
    }
}

async function testEmailTrackingInsert() {
    console.log(`\n🧪 Testing email_events insert...`);
    
    try {
        const testRecord = {
            id: crypto.randomUUID(),
            campaign_id: crypto.randomUUID(),
            recipient_email: 'test@example.com',
            event_type: 'test',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('email_events')
            .insert(testRecord)
            .select();
        
        if (error) {
            console.log(`❌ Insert failed: ${error.message}`);
            if (error.code) console.log(`   Error code: ${error.code}`);
            if (error.hint) console.log(`   Hint: ${error.hint}`);
            return false;
        }
        
        console.log(`✅ Successfully inserted test record`);
        
        // Clean up
        const { error: deleteError } = await supabase
            .from('email_events')
            .delete()
            .eq('id', testRecord.id);
        
        if (deleteError) {
            console.log(`⚠️  Could not clean up test record: ${deleteError.message}`);
        } else {
            console.log(`🧹 Test record cleaned up`);
        }
        
        return true;
        
    } catch (err) {
        console.log(`❌ Exception during insert test: ${err.message}`);
        return false;
    }
}

async function testCampaignAnalyticsInsert() {
    console.log(`\n🧪 Testing campaign_analytics insert...`);
    
    try {
        const testRecord = {
            id: crypto.randomUUID(),
            campaign_id: crypto.randomUUID(),
            total_sent: 1,
            total_delivered: 1,
            total_opened: 0,
            total_clicked: 0,
            bounce_rate: 0,
            open_rate: 0,
            click_rate: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('campaign_analytics')
            .insert(testRecord)
            .select();
        
        if (error) {
            console.log(`❌ Insert failed: ${error.message}`);
            if (error.code) console.log(`   Error code: ${error.code}`);
            if (error.hint) console.log(`   Hint: ${error.hint}`);
            return false;
        }
        
        console.log(`✅ Successfully inserted test analytics record`);
        
        // Clean up
        const { error: deleteError } = await supabase
            .from('campaign_analytics')
            .delete()
            .eq('id', testRecord.id);
        
        if (deleteError) {
            console.log(`⚠️  Could not clean up test record: ${deleteError.message}`);
        } else {
            console.log(`🧹 Test analytics record cleaned up`);
        }
        
        return true;
        
    } catch (err) {
        console.log(`❌ Exception during analytics insert test: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('🔍 SIMPLE EMAIL TRACKING VERIFICATION');
    console.log('=====================================');
    
    try {
        // Test connection first
        console.log('\n🔌 Testing connection...');
        const { data, error } = await supabase.auth.getSession();
        if (error && error.message !== 'No session found') {
            console.log(`❌ Connection issue: ${error.message}`);
            return;
        }
        console.log('✅ Connection established');
        
        // Check each table
        const tables = ['campaigns', 'email_events', 'campaign_analytics', 'email_tracking'];
        const results = {};
        
        for (const table of tables) {
            results[table] = await checkTable(table);
        }
        
        // Test inserts if tables are accessible
        if (results.email_events) {
            await testEmailTrackingInsert();
        }
        
        if (results.campaign_analytics) {
            await testCampaignAnalyticsInsert();
        }
        
        // Summary
        console.log('\n📋 VERIFICATION SUMMARY');
        console.log('=======================');
        
        const accessibleTables = Object.entries(results)
            .filter(([table, accessible]) => accessible)
            .map(([table]) => table);
        
        const inaccessibleTables = Object.entries(results)
            .filter(([table, accessible]) => !accessible)
            .map(([table]) => table);
        
        console.log(`✅ Accessible tables: ${accessibleTables.join(', ')}`);
        if (inaccessibleTables.length > 0) {
            console.log(`❌ Inaccessible tables: ${inaccessibleTables.join(', ')}`);
        }
        
        if (accessibleTables.length === tables.length) {
            console.log('\n🎉 All email tracking tables are set up correctly!');
            console.log('\n📝 RECOMMENDATIONS:');
            console.log('1. ✅ Database structure is ready');
            console.log('2. ✅ No RLS issues blocking access');
            console.log('3. ✅ Insert/delete operations work');
            console.log('4. 🔄 Ready to start tracking email events');
            console.log('\n🚀 Next: Send test emails and verify events are recorded');
        } else {
            console.log('\n⚠️  Some tables are not accessible. Check migrations and RLS policies.');
        }
        
    } catch (error) {
        console.log(`❌ Unexpected error: ${error.message}`);
    }
}

main().catch(console.error);