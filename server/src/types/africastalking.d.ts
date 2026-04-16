declare module 'africastalking' {
  interface ATConfig {
    apiKey: string;
    username: string;
  }

  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface ATInstance {
    SMS: {
      send: (options: SMSSendOptions) => Promise<unknown>;
    };
  }

  export default function AfricasTalking(config: ATConfig): ATInstance;
}
