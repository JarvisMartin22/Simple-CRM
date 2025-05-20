// This file is used to deploy the gmail-contacts-preview edge function

const fetchOtherContacts = async (accessToken) => {
  try {
    console.log("Fetching other contacts...");
    const otherContactsUrl = 'https://people.googleapis.com/v1/otherContacts?pageSize=1000&readMask=names,emailAddresses,organizations,phoneNumbers,urls,metadata,photos';
    
    const response = await fetch(otherContactsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching other contacts: ${response.status}`, error);
      return { success: false, data: null, error };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      data: data.otherContacts || [],
      totalItems: data.otherContacts?.length || 0,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error("Error fetching other contacts:", error);
    return { success: false, data: null, error: error.message };
  }
};

const fetchFrequentContacts = async (accessToken) => {
  try {
    console.log("Fetching frequent contacts...");
    // First, get the frequent contact group members
    const frequentGroupUrl = 'https://people.googleapis.com/v1/contactGroups/frequentlyContacted';
    
    const groupResponse = await fetch(frequentGroupUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!groupResponse.ok) {
      const error = await groupResponse.text();
      console.error(`Error fetching frequent contacts group: ${groupResponse.status}`, error);
      return { success: false, data: null, error };
    }
    
    const groupData = await groupResponse.json();
    const memberResourceNames = groupData.memberResourceNames || [];
    
    if (memberResourceNames.length === 0) {
      console.log("No frequent contacts found");
      return { success: true, data: [], totalItems: 0 };
    }
    
    // Now fetch the actual contact details
    // Google API has a limit on batch sizes, so we'll do batches of 50
    const batchSize = 50;
    let allContacts = [];
    
    for (let i = 0; i < memberResourceNames.length; i += batchSize) {
      const batch = memberResourceNames.slice(i, i + batchSize);
      const personFields = "names,emailAddresses,organizations,phoneNumbers,urls,metadata,photos";
      const batchUrl = `https://people.googleapis.com/v1/people:batchGet?personFields=${personFields}&` + 
                       batch.map(name => `resourceNames=${encodeURIComponent(name)}`).join('&');
      
      const batchResponse = await fetch(batchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!batchResponse.ok) {
        console.error(`Error fetching batch ${i/batchSize} of contact details: ${batchResponse.status}`);
        continue;
      }
      
      const batchData = await batchResponse.json();
      if (batchData.responses && batchData.responses.length > 0) {
        const validResponses = batchData.responses.filter(r => r.person);
        const contacts = validResponses.map(r => r.person);
        allContacts = [...allContacts, ...contacts];
      }
    }
    
    return { 
      success: true, 
      data: allContacts,
      totalItems: allContacts.length
    };
  } catch (error) {
    console.error("Error fetching frequent contacts:", error);
    return { success: false, data: null, error: error.message };
  }
};

// Usage in the edge function:
/*
// Inside the main handler where we process the request:
if (resourceName === "connections") {
  // Use existing code for connections
  // ...
} else if (resourceName === "otherContacts") {
  const result = await fetchOtherContacts(accessToken);
  if (!result.success) {
    // Handle error
    throw new Error(`Failed to fetch other contacts: ${result.error}`);
  }
  connections = result.data;
} else if (resourceName === "contactGroups/frequentlyContacted/members") {
  const result = await fetchFrequentContacts(accessToken);
  if (!result.success) {
    // Handle error
    throw new Error(`Failed to fetch frequent contacts: ${result.error}`);
  }
  connections = result.data;
}
*/

console.log("This file provides functions that can be integrated into your edge function for proper handling of different contact types from the Google People API.");
console.log("Copy the fetchOtherContacts and fetchFrequentContacts functions into your gmail-contacts-preview/index.ts file, then use them where appropriate."); 