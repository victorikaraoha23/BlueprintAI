export interface NotificationAdapter {
  send: (to: string, subject: string, body: string) => Promise<void>;
}

export class EmailNotificationAdapter implements NotificationAdapter {
  async send(to: string, subject: string, _body: string): Promise<void> {
    // Send notification
    console.log(`Sending email to ${to}: ${subject}`);
  }
}

export class NoopNotificationAdapter implements NotificationAdapter {
  async send(): Promise<void> {
    // Notification failure never fails the workflow step (logged, not fatal)
  }
}

let adapter: NotificationAdapter = new NoopNotificationAdapter();

export function setNotificationAdapter(newAdapter: NotificationAdapter) {
  adapter = newAdapter;
}

export async function notifyApprovalRequired(email: string, blueprintId: string): Promise<void> {
  try {
    await adapter.send(email, "Approval Required", `Blueprint ${blueprintId} requires approval`);
  } catch (error) {
    // Notification failure never fails the workflow step (logged, not fatal)
    console.error("Notification failed:", error);
  }
}

export default {
  setNotificationAdapter,
  notifyApprovalRequired,
  EmailNotificationAdapter,
  NoopNotificationAdapter,
};
