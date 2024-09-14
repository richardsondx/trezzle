// netlify/functions/generateRandomChallenge.js

const { generateChallenge } = require('./generateChallengeLogic'); // Adjust the path as needed

exports.handler = async function (event, context) {
  try {
    // Generate a random challenge number (you can use a timestamp or random number)
    const challengeNumber = Date.now(); // Using timestamp for uniqueness

    // Generate the challenge
    const newChallenge = await generateChallenge(challengeNumber);

    if (!newChallenge) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate a new challenge.' }),
      };
    }

    // Return the challenge in the response
    return {
      statusCode: 200,
      body: JSON.stringify(newChallenge),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error generating random challenge:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error.' }),
    };
  }
};
