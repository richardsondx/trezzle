// netlify/functions/generateChallenge.js

const { createClient } = require('@supabase/supabase-js');
const { generateChallenge } = require('../../generateChallengeLogic'); // Adjust the path as needed

exports.handler = async function(event, context) {
  // Secure the function with a secret key
  const secret = event.headers['x-secret-key'];
  if (secret !== process.env.GENERATE_CHALLENGE_SECRET) {
    return {
      statusCode: 401,
      body: 'Unauthorized',
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine the new challenge number
  const today = new Date().toISOString().split('T')[0];

  // Check if today's challenge already exists
  const { data: existingChallenge } = await supabase
    .from('challenges')
    .select('id')
    .eq('date', today)
    .single();

  if (existingChallenge) {
    return {
      statusCode: 200,
      body: 'Challenge for today already exists.',
    };
  }

  // Get the last challenge number
  const { data: lastChallenge } = await supabase
    .from('challenges')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
    .single();

  const challengeNumber = lastChallenge ? lastChallenge.id + 1 : 1;

  // Generate the new challenge (implement your logic)
  const newChallenge = await generateChallenge(challengeNumber);

  // Insert the new challenge into Supabase
  const { error } = await supabase
    .from('challenges')
    .insert(newChallenge);

  if (error) {
    console.error('Error inserting challenge:', error);
    return {
      statusCode: 500,
      body: 'Error inserting challenge',
    };
  }

  return {
    statusCode: 200,
    body: 'Challenge generated successfully',
  };
};
