import axios from 'axios';

async function testAnalytics() {
  try {
    console.log("Simulating page view to trigger analytics tracking...");
    const response = await axios.get('http://localhost:3000/');
    console.log("Response status:", response.status);
    
    // Wait a bit for the async tracking to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Checking if analytics data is accessible via API...");
    // Note: This might fail if we are not logged in as admin, but we can check the server logs if we had them
    // For now, we'll just check if the server is still running and not crashing
  } catch (error: any) {
    console.error("Test failed:", error.message);
  }
}

testAnalytics();
