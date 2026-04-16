import admin from 'firebase-admin';
import { env } from './env';
import { logger } from './logger';

// En dev, on log le push en console au lieu d'envoyer via FCM
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string
): Promise<void> => {
  if (env.NODE_ENV === 'development') {
    logger.info({ token: fcmToken.slice(0, 20), title, body }, '[PUSH DEV] Notification');
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  await admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
  });
};
