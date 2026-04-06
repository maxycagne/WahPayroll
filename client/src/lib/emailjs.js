import emailjs from "@emailjs/browser";

// Double check these names match your .env file!
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

emailjs.init(PUBLIC_KEY);

export { SERVICE_ID, TEMPLATE_ID };
export default emailjs;
