// Email forwarding detection logic
export interface ForwardDetectionResult {
  isForwarded: boolean;
  confidence: number;
  indicators: string[];
}

export function detectEmailForward(
  userAgent: string,
  ipAddress: string,
  previousEvents: any[]
): ForwardDetectionResult {
  const indicators: string[] = [];
  let confidenceScore = 0;

  // 1. Check for different IP address from previous opens
  if (previousEvents.length > 0 && ipAddress !== "Unknown") {
    const previousIps = previousEvents
      .filter(e => e.event_type === 'opened' && e.ip_address)
      .map(e => e.ip_address);
    
    if (previousIps.length > 0 && !previousIps.includes(ipAddress)) {
      indicators.push('different_ip_address');
      confidenceScore += 30;
    }
  }

  // 2. Check for different user agent
  if (previousEvents.length > 0 && userAgent !== "Unknown") {
    const previousAgents = previousEvents
      .filter(e => e.event_type === 'opened' && e.user_agent)
      .map(e => e.user_agent);
    
    if (previousAgents.length > 0) {
      const currentBrowser = parseBrowserFromUserAgent(userAgent);
      const previousBrowser = parseBrowserFromUserAgent(previousAgents[0]);
      
      if (currentBrowser !== previousBrowser) {
        indicators.push('different_browser');
        confidenceScore += 25;
      }
    }
  }

  // 3. Check for rapid succession of opens (within 5 seconds)
  if (previousEvents.length > 0) {
    const lastOpen = previousEvents
      .filter(e => e.event_type === 'opened')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (lastOpen) {
      const timeDiff = Date.now() - new Date(lastOpen.created_at).getTime();
      if (timeDiff < 5000) { // Less than 5 seconds
        indicators.push('rapid_succession');
        confidenceScore += 20;
      }
    }
  }

  // 4. Check for known forwarding service user agents
  const forwardingServices = [
    'Outlook-Mail-Forwarder',
    'Gmail-Forwarder',
    'Yahoo-Mail-Forward',
    'Exchange-Forward'
  ];
  
  if (forwardingServices.some(service => userAgent.includes(service))) {
    indicators.push('forwarding_service_detected');
    confidenceScore += 40;
  }

  // 5. Check for different geographic location (would need IP geolocation service)
  // This is a placeholder for future enhancement
  // if (differentCountry) {
  //   indicators.push('different_country');
  //   confidenceScore += 35;
  // }

  return {
    isForwarded: confidenceScore >= 50,
    confidence: Math.min(confidenceScore, 100),
    indicators
  };
}

function parseBrowserFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Other';
}