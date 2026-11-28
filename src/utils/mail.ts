/**
 * Mail Utility Functions
 * Ensures all email actions redirect to Gmail Web compose rather than OS desktop clients (Outlook).
 */

export const getGmailComposeUrl = (to: string, subject?: string, body?: string): string => {
  const cleanTo = (to || '').trim();
  const params = new URLSearchParams();
  params.set('view', 'cm');
  params.set('fs', '1');
  params.set('tf', '1');
  if (cleanTo) params.set('to', cleanTo);
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);
  return `https://mail.google.com/mail/?${params.toString()}`;
};

export const openGmailCompose = (to: string, subject?: string, body?: string): void => {
  const url = getGmailComposeUrl(to, subject, body);
  window.open(url, '_blank', 'noopener,noreferrer');
};
