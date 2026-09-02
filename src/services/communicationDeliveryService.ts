import type { 
  CommunicationChannel, 
  CommunicationRecipient, 
  DeliveryStatus 
} from '../types';

export interface OutboundMessage {
  recipient: CommunicationRecipient;
  subject?: string;
  body: string;
  attachments?: Array<{ fileName: string; downloadUrl?: string }>;
}

export interface DeliveryResult {
  deliveryStatus: DeliveryStatus;
  providerMessageId?: string;
  deliveredAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationProvider {
  readonly channel: CommunicationChannel;
  send(message: OutboundMessage): Promise<DeliveryResult>;
}

export class EmailProvider implements CommunicationProvider {
  readonly channel: CommunicationChannel = 'email';

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    const email = message.recipient.recipientEmail?.trim();
    if (!email || !email.includes('@')) {
      return {
        deliveryStatus: 'failed',
        failureReason: 'Missing or invalid recipient email address.'
      };
    }

    // In browser/Firebase client environment: simulate/log delivery through provider abstraction
    const providerMessageId = `mock_mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      deliveryStatus: 'sent',
      providerMessageId,
      deliveredAt: new Date().toISOString(),
      metadata: { simulated: true, recipientEmail: email }
    };
  }
}

export class WhatsAppManualProvider implements CommunicationProvider {
  readonly channel: CommunicationChannel = 'whatsapp';

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    const phone = message.recipient.recipientPhone?.replace(/\D/g, '');
    if (!phone) {
      return {
        deliveryStatus: 'failed',
        failureReason: 'Missing recipient phone number for WhatsApp message.'
      };
    }

    // Generate user-initiated WhatsApp link
    const encodedText = encodeURIComponent(message.body);
    const whatsappLink = `https://wa.me/${phone}?text=${encodedText}`;

    // Critical rule: WhatsApp without direct enterprise API is strictly "prepared", never falsely "delivered"
    return {
      deliveryStatus: 'prepared',
      metadata: {
        whatsappLink,
        phone
      }
    };
  }
}

export class SmsManualProvider implements CommunicationProvider {
  readonly channel: CommunicationChannel = 'sms';

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    const phone = message.recipient.recipientPhone?.trim();
    if (!phone) {
      return {
        deliveryStatus: 'failed',
        failureReason: 'Missing recipient phone number for SMS.'
      };
    }

    const charCount = message.body.length;
    const segmentCount = Math.ceil(charCount / 160) || 1;

    // Critical rule: SMS without verified carrier API returns "prepared"
    return {
      deliveryStatus: 'prepared',
      metadata: {
        charCount,
        segmentCount,
        phone
      }
    };
  }
}

export class ManualOrPrintProvider implements CommunicationProvider {
  constructor(public readonly channel: CommunicationChannel) {}

  async send(message: OutboundMessage): Promise<DeliveryResult> {
    return {
      deliveryStatus: 'prepared',
      metadata: {
        preparedAt: new Date().toISOString(),
        recipientName: message.recipient.recipientName
      }
    };
  }
}

export const communicationDeliveryService = {
  getProvider(channel: CommunicationChannel): CommunicationProvider {
    switch (channel) {
      case 'email':
        return new EmailProvider();
      case 'whatsapp':
        return new WhatsAppManualProvider();
      case 'sms':
        return new SmsManualProvider();
      case 'internal':
      case 'print':
      case 'manual':
      default:
        return new ManualOrPrintProvider(channel);
    }
  },

  async deliver(message: OutboundMessage): Promise<DeliveryResult> {
    const provider = this.getProvider(message.recipient.deliveryChannel);
    return provider.send(message);
  }
};
