// TEST SCRIPT - Execute this in the browser console to test cost creation
// Copy and paste this in the browser console on the Costs page

async function testCostCreation() {
  console.log('Starting cost creation test...');
  
  // Test with minimal data first
  const minimalTestData = {
    category: 'Avulsa',
    vehicle_id: 'test-vehicle-id', // Replace with a real vehicle ID from your database
    description: 'Teste de custo básico',
    amount: 100.50,
    cost_date: '2025-01-03',
    status: 'Pendente',
    origin: 'Manual'
  };
  
  console.log('Test data:', minimalTestData);
  
  try {
    // Test direct Supabase call
    const { supabase } = window;
    
    if (!supabase) {
      console.error('Supabase not found. Make sure you are on the Costs page.');
      return;
    }
    
    const result = await supabase
      .from('costs')
      .insert([{
        ...minimalTestData,
        tenant_id: 'default-tenant' // Replace with your tenant ID
      }])
      .select('*')
      .single();
      
    console.log('Direct Supabase result:', result);
    
    if (result.error) {
      console.error('Supabase error:', result.error);
      
      // Test if the issue is with specific values
      if (result.error.message.includes('check constraint')) {
        console.log('❌ Check constraint violation - need to run SQL migration');
        console.log('📋 Execute the SQL migration in EXECUTE_THIS_SQL.md');
      } else if (result.error.message.includes('column')) {
        console.log('❌ Column does not exist - need to run SQL migration');
        console.log('📋 Execute the SQL migration in EXECUTE_THIS_SQL.md');
      } else {
        console.log('❌ Other error:', result.error.message);
      }
    } else {
      console.log('✅ Success! Cost created:', result.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Instructions for use:
console.log(`
🧪 COST CREATION TEST
1. Copy this entire script
2. Paste in browser console on the Costs page
3. Run: testCostCreation()
4. Check the console output for specific error details
`);

// Auto-expose the function
window.testCostCreation = testCostCreation; 