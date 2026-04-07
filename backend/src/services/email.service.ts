import { resend } from '../config/resend.config';

const FROM_EMAIL = 'Stud’Housing Trust <onboarding@resend.dev>';

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text?: string;
  retries: number;
}

class EmailQueue {
  private queue: EmailJob[] = [];
  private isProcessing = false;
  private readonly maxRetries = 3;

  // Ajouter un job
  add(job: Omit<EmailJob, 'retries'>) {
    this.queue.push({ ...job, retries: 0 });
    this.process(); // lance immédiatement
  }

  // Traitement
  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: job.to,
          subject: job.subject,
          html: job.html,
          text: job.text,
        });

        if (error) throw new Error(error.message);

        console.log(`Email envoyé à ${job.to}`);
      } catch (error) {
        console.error(`Erreur email (${job.to})`, error);

        if (job.retries < this.maxRetries) {
          job.retries++;
          this.queue.push(job);
          console.log(`Retry ${job.retries} pour ${job.to}`);
        }
      }

      // petite pause pour éviter spam API
      await new Promise((res) => setTimeout(res, 800));
    }

    this.isProcessing = false;
  }
}

// instance singleton
const emailQueue = new EmailQueue();

// Fonctions simples à utiliser

export const sendWelcomeEmail = (email: string, name: string) => {
  emailQueue.add({
    to: email,
    subject: "Bienvenue sur Stud'Housing Trust 🎉",
    html: `<p>Bonjour ${name},</p>
           <p>Votre compte a été créé avec succès.</p>`,
    text: `Bonjour ${name}, votre compte a été créé avec succès.`,
  });
};

export const sendListingApprovedEmail = (
  email: string,
  ownerName: string,
  listingTitle: string
) => {
  emailQueue.add({
    to: email,
    subject: "Votre annonce est validée",
    html: `<p>Bonjour ${ownerName},</p>
           <p>Votre logement "${listingTitle}" est maintenant en ligne.</p>`,
    text: `Bonjour ${ownerName}, votre logement "${listingTitle}" est maintenant en ligne.`,
  });
};

export { emailQueue };