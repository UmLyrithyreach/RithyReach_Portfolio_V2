export interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(
  values: ContactFormValues,
): ContactFormErrors {
  const errors: ContactFormErrors = {};
  if (!values.name.trim()) {
    errors.name = "Name is required";
  }
  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Please enter a valid email";
  }
  if (!values.message.trim()) {
    errors.message = "Message is required";
  }
  return errors;
}

export function buildMailtoHref(
  recipient: string,
  values: ContactFormValues,
): string {
  const name = values.name.trim();
  const sender = values.email.trim();
  const message = values.message.trim();
  const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
  const body = encodeURIComponent(
    `Name: ${name}\nEmail: ${sender}\n\n${message}`,
  );
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

if (
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1]?.endsWith("validate.ts")
) {
  const empty = validateContactForm({ name: " ", email: "", message: "\n" });
  if (
    empty.name !== "Name is required" ||
    empty.email !== "Email is required" ||
    empty.message !== "Message is required"
  ) {
    throw new Error(`Unexpected empty-form errors: ${JSON.stringify(empty)}`);
  }

  const badEmail = validateContactForm({
    name: "Reach",
    email: "invalid-email",
    message: "Hello",
  });
  if (
    badEmail.email !== "Please enter a valid email" ||
    badEmail.name ||
    badEmail.message
  ) {
    throw new Error(`Unexpected bad-email errors: ${JSON.stringify(badEmail)}`);
  }

  const valid = validateContactForm({
    name: "Reach",
    email: "reach@example.com",
    message: "Let's build",
  });
  if (Object.keys(valid).length !== 0) {
    throw new Error(`Expected valid form, got: ${JSON.stringify(valid)}`);
  }

  const href = buildMailtoHref("umlyrithyreach@gmail.com", {
    name: "Reach",
    email: "reach@example.com",
    message: "Hi there",
  });
  if (!href.startsWith("mailto:umlyrithyreach@gmail.com?subject=")) {
    throw new Error(`Unexpected mailto href: ${href}`);
  }
}
