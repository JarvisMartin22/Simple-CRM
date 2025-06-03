#!/bin/bash

# Test tracking endpoints with curl
SUPABASE_URL="https://bujaaqjxrvntcneoarkj.supabase.co"
TRACKING_ID="test-curl-$(date +%s)"
CAMPAIGN_ID="550e8400-e29b-41d4-a716-446655440000"  # Use a valid UUID

echo "🧪 Testing Email Tracking Endpoints"
echo "=================================="
echo ""
echo "Tracking ID: $TRACKING_ID"
echo "Campaign ID: $CAMPAIGN_ID"
echo ""

# Test 1: Open tracking pixel
echo "1. Testing open tracking pixel..."
OPEN_URL="$SUPABASE_URL/functions/v1/email-tracker?id=$TRACKING_ID&type=open&campaign=$CAMPAIGN_ID"
echo "URL: $OPEN_URL"
echo ""

echo "Response:"
curl -v -X GET "$OPEN_URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  2>&1 | grep -E "< HTTP|< Content-Type|< Location"

echo ""
echo ""

# Test 2: Link click tracking
echo "2. Testing link click tracking..."
TEST_URL="https://example.com/test"
CLICK_URL="$SUPABASE_URL/functions/v1/link-tracker?id=$TRACKING_ID&url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TEST_URL'))")"
echo "URL: $CLICK_URL"
echo ""

echo "Response:"
curl -v -X GET "$CLICK_URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  --max-redirs 0 \
  2>&1 | grep -E "< HTTP|< Location|< Content-Type"

echo ""
echo ""

# Test 3: Check if pixel returns an image
echo "3. Checking pixel content type..."
curl -s -I "$OPEN_URL" | grep -i content-type

echo ""
echo "✅ Tests complete"