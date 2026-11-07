"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  buildMailtoHref,
  validateContactForm,
  type ContactFormErrors,
  type ContactFormValues,
} from "@/components/contact/validate";
import { email } from "@/lib/data";

export default function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof ContactFormValues;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validateContactForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitted && (
        <div
          role="status"
          className="border border-accent/50 bg-accent/10 p-4 font-mono text-xs text-on-dark space-y-2"
        >
          <p>Message queued for dispatch. Thank you for reaching out!</p>
          <a
            href={buildMailtoHref(email, values)}
            className="inline-flex items-center gap-1 font-bold text-accent underline underline-offset-4 hover:text-white"
          >
            Open in Mail Client ↗
          </a>
        </div>
      )}

      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-dark-muted"
        >
          {"01 // YOUR NAME"}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          placeholder="Enter your name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className="min-h-11 w-full border border-border-dark bg-surface-black px-4 py-3 font-sans text-sm text-on-dark placeholder:text-on-dark-muted/60 focus:border-accent focus:outline-none"
        />
        {errors.name && (
          <p
            id="contact-name-error"
            data-testid="form-error"
            role="alert"
            className="mt-1.5 font-mono text-xs text-[#ff8a3d]"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-dark-muted"
        >
          {"02 // EMAIL ADDRESS"}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          placeholder="your.email@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className="min-h-11 w-full border border-border-dark bg-surface-black px-4 py-3 font-sans text-sm text-on-dark placeholder:text-on-dark-muted/60 focus:border-accent focus:outline-none"
        />
        {errors.email && (
          <p
            id="contact-email-error"
            data-testid="form-error"
            role="alert"
            className="mt-1.5 font-mono text-xs text-[#ff8a3d]"
          >
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-2 block font-mono text-xs uppercase tracking-wider text-on-dark-muted"
        >
          {"03 // PROJECT / MESSAGE"}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          value={values.message}
          onChange={handleChange}
          placeholder="Tell me about your project..."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className="min-h-11 w-full border border-border-dark bg-surface-black px-4 py-3 font-sans text-sm text-on-dark placeholder:text-on-dark-muted/60 focus:border-accent focus:outline-none resize-y"
        />
        {errors.message && (
          <p
            id="contact-message-error"
            data-testid="form-error"
            role="alert"
            className="mt-1.5 font-mono text-xs text-[#ff8a3d]"
          >
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 bg-accent px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-surface-black transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transform-none"
      >
        Send Message →
      </button>
    </form>
  );
}
