import AfricasTalkingSDK from 'africastalking';
import { env } from './env';
import { logger } from './logger';

// En dev, on log l'OTP en console au lieu d'envoyer un SMS
export const sendSms = async (to: string, message: string): Promise<void> => {
  if (env.NODE_ENV === 'development') {
    logger.info({ to, message }, '[SMS DEV] OTP envoye');
    return;
  }

  const at = AfricasTalkingSDK({
    apiKey: env.AT_API_KEY,
    username: env.AT_USERNAME,
  });

  await at.SMS.send({
    to: [to],
    message,
    // Sender ID omis tant qu'il n'est pas approuve par l'operateur
    // Decommenter apres approbation : from: env.AT_SENDER_ID,
  });
};
