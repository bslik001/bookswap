import { env } from './env';

// En dev, on log l'OTP en console au lieu d'envoyer un SMS
export const sendSms = async (to: string, message: string): Promise<void> => {
  if (env.NODE_ENV === 'development') {
    console.log(`\n📱 [SMS DEV] Destinataire: ${to}`);
    console.log(`   Message: ${message}\n`);
    return;
  }

  const AfricasTalking = require('africastalking')({
    apiKey: env.AT_API_KEY,
    username: env.AT_USERNAME,
  });

  await AfricasTalking.SMS.send({
    to: [to],
    message,
    // Sender ID omis tant qu'il n'est pas approuve par l'operateur
    // Decommenter apres approbation : from: env.AT_SENDER_ID,
  });
};
