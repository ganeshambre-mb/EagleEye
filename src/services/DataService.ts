export interface EmailResponse {
  success: boolean;
  sent_to: string[];
  message: string;
}

export interface EmailPayload {
  recipients: string;
  subject: string;
  body: string;
  filename: string;
  byte_array_base64: string;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly';
  schedule_name?: string;
  schedule_time?: string;
  schedule_day_of_week?: number;
  schedule_day_of_month?: number;
}

class DataService {
  private getApiEndpoint(): string {
    return import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8000/email/send';
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResponse> {
    const API_ENDPOINT = this.getApiEndpoint();
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result: EmailResponse = await response.json();
    return result;
  }
}

export default new DataService();

